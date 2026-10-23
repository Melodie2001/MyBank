<?php

namespace App\Tests\Integration;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use App\Service\OAuthCodeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class SessionSecurityTest extends WebTestCase
{
    private $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
    }

    private function request(string $method, string $path, ?array $body = null, ?string $jwt = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        if ($jwt !== null) {
            $headers['HTTP_AUTHORIZATION'] = 'Bearer '.$jwt;
        }
        $this->client->request($method, $path, [], [], $headers, $body === null ? null : json_encode($body));

        return [$this->client->getResponse()->getStatusCode(), json_decode($this->client->getResponse()->getContent(), true)];
    }

    private function user(array $roles = ['ROLE_USER'], ?string $email = null): array
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $user = (new User())->setEmail($email ?? 'sessions_'.bin2hex(random_bytes(8)).'@example.test')
            ->setRoles($roles)->setStatus('active');
        $user->setPassword(static::getContainer()->get('security.user_password_hasher')->hashPassword($user, 'Password123!'));
        $em->persist($user);
        $em->flush();
        $id = $user->getId();
        $email = $user->getEmail();
        [$status, $tokens] = $this->request('POST', '/api/login', ['email' => $email, 'password' => 'Password123!']);
        self::assertSame(200, $status);

        return ['id' => $id, 'email' => $email] + $tokens;
    }

    private function code(array $user): string
    {
        $entity = static::getContainer()->get(EntityManagerInterface::class)->find(User::class, $user['id']);

        return static::getContainer()->get(OAuthCodeService::class)->issueCode($entity);
    }

    private function resetToken(array $user, string $expiry = '+1 hour'): string
    {
        $plain = bin2hex(random_bytes(32));
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $token = (new PasswordResetToken())->setUser($em->find(User::class, $user['id']))
            ->setToken(hash('sha256', $plain))->setCreatedAt(new \DateTimeImmutable())
            ->setExpiresAt(new \DateTimeImmutable($expiry));
        $em->persist($token);
        $em->flush();

        return $plain;
    }

    public function testAdminAccessRequiresAnAuthenticatedAdministrator(): void
    {
        self::assertSame(401, $this->request('GET', '/api/admin/access')[0]);
        $user = $this->user();
        [$status, $body] = $this->request('GET', '/api/admin/access', null, $user['token']);
        self::assertSame(403, $status);
        self::assertSame('This area is reserved for administrators', $body['message']);
        $admin = $this->user(['ROLE_ADMIN']);
        [$status, $body] = $this->request('GET', '/api/admin/access', null, $admin['token']);
        self::assertSame(200, $status);
        self::assertSame(['access' => 'granted'], $body);
    }

    public function testSuspensionAndReactivationDoNotRestoreOldSessions(): void
    {
        $admin = $this->user(['ROLE_ADMIN']);
        foreach (['pending', 'rejected'] as $state) {
            $user = $this->user();
            $code = $this->code($user);
            [$status] = $this->request('PUT', '/api/users/'.$user['id'].'/status', ['status' => $state], $admin['token']);
            self::assertSame(200, $status);
            self::assertSame(401, $this->request('GET', '/api/me', null, $user['token'])[0]);
            self::assertSame(401, $this->request('POST', '/api/token/refresh', ['refresh_token' => $user['refresh_token']])[0]);
            self::assertSame(400, $this->request('POST', '/api/auth/oauth/exchange', ['code' => $code])[0]);
            self::assertSame(200, $this->request('PUT', '/api/users/'.$user['id'].'/status', ['status' => 'active'], $admin['token'])[0]);
            self::assertSame(401, $this->request('GET', '/api/me', null, $user['token'])[0]);
            self::assertSame(200, $this->request('POST', '/api/login', ['email' => $user['email'], 'password' => 'Password123!'])[0]);
        }
    }

    public function testPasswordChangeRevokesEverySessionAndOAuthCode(): void
    {
        $user = $this->user();
        $other = $this->user();
        [, $second] = $this->request('POST', '/api/login', ['email' => $user['email'], 'password' => 'Password123!']);
        $code = $this->code($user);
        [$status] = $this->request('PUT', '/api/me/password', ['current_password' => 'Password123!', 'new_password' => 'ChangedPassword123!'], $user['token']);
        self::assertSame(200, $status);
        foreach ([$user, $second] as $session) {
            self::assertSame(401, $this->request('GET', '/api/me', null, $session['token'])[0]);
            self::assertSame(401, $this->request('POST', '/api/token/refresh', ['refresh_token' => $session['refresh_token']])[0]);
        }
        self::assertSame(400, $this->request('POST', '/api/auth/oauth/exchange', ['code' => $code])[0]);
        self::assertSame(200, $this->request('GET', '/api/me', null, $other['token'])[0]);
        [$status, $new] = $this->request('POST', '/api/login', ['email' => $user['email'], 'password' => 'ChangedPassword123!']);
        self::assertSame(200, $status);
        self::assertSame(200, $this->request('GET', '/api/me', null, $new['token'])[0]);
    }

    public function testWrongPasswordDoesNotRevokeSessions(): void
    {
        $user = $this->user();
        self::assertSame(400, $this->request('PUT', '/api/me/password', ['current_password' => 'WrongPassword123!', 'new_password' => 'ChangedPassword123!'], $user['token'])[0]);
        self::assertSame(200, $this->request('GET', '/api/me', null, $user['token'])[0]);
        [$status, $renewed] = $this->request('POST', '/api/token/refresh', ['refresh_token' => $user['refresh_token']]);
        self::assertSame(200, $status);
        self::assertSame(200, $this->request('GET', '/api/me', null, $renewed['token'])[0]);
    }

    public function testPasswordResetRevokesOldTokensAndCodeAndRemainsSingleUse(): void
    {
        $user = $this->user();
        $code = $this->code($user);
        $plain = $this->resetToken($user);
        $body = ['token' => $plain, 'newPassword' => 'ResetPassword123!'];
        self::assertSame(200, $this->request('POST', '/api/reset-password', $body)[0]);
        self::assertSame(400, $this->request('POST', '/api/reset-password', $body)[0]);
        self::assertSame(401, $this->request('GET', '/api/me', null, $user['token'])[0]);
        self::assertSame(401, $this->request('POST', '/api/token/refresh', ['refresh_token' => $user['refresh_token']])[0]);
        self::assertSame(400, $this->request('POST', '/api/auth/oauth/exchange', ['code' => $code])[0]);
        [$status, $new] = $this->request('POST', '/api/login', ['email' => $user['email'], 'password' => 'ResetPassword123!']);
        self::assertSame(200, $status);
        self::assertSame(200, $this->request('GET', '/api/me', null, $new['token'])[0]);
    }

    public function testExpiredResetDoesNotRevokeSessions(): void
    {
        $user = $this->user();
        $plain = $this->resetToken($user, '-1 hour');
        self::assertSame(400, $this->request('POST', '/api/reset-password', ['token' => $plain, 'newPassword' => 'ResetPassword123!'])[0]);
        self::assertSame(200, $this->request('GET', '/api/me', null, $user['token'])[0]);
    }

    public function testOAuthExchangeRechecksAccountStatusEvenWithoutRevocation(): void
    {
        $user = $this->user();
        $code = $this->code($user);
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $em->find(User::class, $user['id'])->setStatus('rejected');
        $em->flush();
        self::assertSame(403, $this->request('POST', '/api/auth/oauth/exchange', ['code' => $code])[0]);
    }

    public function testDeletedAccountTokensCannotAccessReplacementAccount(): void
    {
        $user = $this->user();
        self::assertSame(200, $this->request('DELETE', '/api/me', null, $user['token'])[0]);
        $replacement = $this->user(['ROLE_USER'], $user['email']);
        self::assertNotSame($user['id'], $replacement['id']);
        self::assertSame(401, $this->request('GET', '/api/me', null, $user['token'])[0]);
        self::assertSame(401, $this->request('POST', '/api/token/refresh', ['refresh_token' => $user['refresh_token']])[0]);
        self::assertSame(200, $this->request('GET', '/api/me', null, $replacement['token'])[0]);
    }
}
