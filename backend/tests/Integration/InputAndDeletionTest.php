<?php

namespace App\Tests\Integration;

use App\Document\ActivityLog;
use App\Document\BalanceSnapshot;
use App\Entity\Category;
use App\Entity\User;
use App\Service\AccountDeletionService;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class InputAndDeletionTest extends WebTestCase
{
    private $client;

    protected function setUp(): void { $this->client = static::createClient(); }

    private function user(array $roles = ['ROLE_USER']): array
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $user = (new User())->setEmail('input_'.bin2hex(random_bytes(8)).'@example.test')->setStatus('active')->setRoles($roles);
        $user->setPassword(static::getContainer()->get('security.user_password_hasher')->hashPassword($user, 'Password123!'));
        $em->persist($user); $em->flush();
        $id = $user->getId(); $email = $user->getEmail();
        $tokens = $this->request('POST', '/api/login', ['email'=>$email, 'password'=>'Password123!']);
        self::assertSame(200, $tokens[0]);
        return ['id'=>$id, 'email'=>$email]+$tokens[1];
    }

    private function request(string $method, string $path, mixed $body = null, ?string $token = null): array
    {
        $headers = ['CONTENT_TYPE'=>'application/json'];
        if ($token) $headers['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        $this->client->request($method, $path, [], [], $headers, $body === null ? null : json_encode($body));
        return [$this->client->getResponse()->getStatusCode(), json_decode($this->client->getResponse()->getContent(), true)];
    }

    public function testInvalidBodiesReturnJsonClientErrors(): void
    {
        $user = $this->user();
        foreach ([['POST','/api/register'], ['POST','/api/reset-password'], ['POST','/api/auth/oauth/exchange'],
            ['PUT','/api/me'], ['PUT','/api/me/password'], ['POST','/api/operations'], ['POST','/api/budgets'],
            ['POST','/api/my-categories']] as [$method, $path]) {
            foreach ([true, 12, 'text', ['list']] as $body) {
                [$status, $data] = $this->request($method, $path, $body, $user['token']);
                self::assertSame(400, $status, $path);
                self::assertIsString($data['message']);
            }
        }
        $this->client->request('POST', '/api/register', [], [], ['CONTENT_TYPE'=>'application/json'], '{broken');
        self::assertResponseStatusCodeSame(400);
    }

    public function testNestedFieldsAndImpossibleDatesDoNotChangeProfile(): void
    {
        $user = $this->user();
        foreach ([['email'=>[]], ['phone'=>['value']], ['firstName'=>true], ['birthDate'=>'2026-02-30'],
            ['birthDate'=>'tomorrow'], ['lastName'=>str_repeat('x',101)], ['new_password'=>[]]] as $body) {
            self::assertSame(400, $this->request('PUT','/api/me',$body,$user['token'])[0]);
        }
        self::assertSame($user['email'], $this->request('GET','/api/me',null,$user['token'])[1]['email']);
        self::assertSame(400, $this->request('POST','/api/register',['email'=>[], 'password'=>'Password123!'])[0]);
        self::assertSame(400, $this->request('POST','/api/reset-password',['token'=>[], 'newPassword'=>'Password123!'])[0]);
        self::assertSame(400, $this->request('POST','/api/auth/oauth/exchange',['code'=>[]])[0]);
    }

    public function testInvalidFinancialDataCreatesNoOperations(): void
    {
        $user = $this->user();
        $category = static::getContainer()->get(EntityManagerInterface::class)->getRepository(Category::class)->findOneBy([])->getId();
        $base = ['label'=>'Input test', 'date'=>'2026-01-15', 'amount'=>10, 'type'=>'expense', 'category_id'=>$category];
        foreach ([['label'=>[]], ['label'=>'   '], ['date'=>'2026-02-30'], ['date'=>'next Monday'],
            ['amount'=>true], ['amount'=>[]], ['amount'=>'1e309'], ['amount'=>0.001], ['amount'=>1000000000],
            ['category_id'=>[]], ['category_id'=>1.5], ['type'=>null]] as $invalid) {
            self::assertSame(400, $this->request('POST','/api/operations',array_replace($base,$invalid),$user['token'])[0]);
        }
        self::assertSame([], $this->request('GET','/api/me/operations',null,$user['token'])[1]);
        self::assertSame(201, $this->request('POST','/api/operations',$base,$user['token'])[0]);
        foreach ([true, '1e309', 0.001] as $amount) {
            self::assertSame(400, $this->request('POST','/api/budgets',['category_id'=>$category,'monthly_limit'=>$amount],$user['token'])[0]);
        }
    }

    public function testAdminFieldsRejectNestedValues(): void
    {
        $admin = $this->user(['ROLE_ADMIN']); $user = $this->user();
        self::assertSame(400, $this->request('PUT','/api/users/'.$user['id'].'/role',['roles'=>[[]]],$admin['token'])[0]);
        self::assertSame(400, $this->request('PUT','/api/users/'.$user['id'].'/status',['status'=>[]],$admin['token'])[0]);
        self::assertSame(400, $this->request('POST','/api/categories',['name'=>[], 'icon'=>'test', 'color'=>'#2563EB'],$admin['token'])[0]);
    }

    private function seedDocuments(array $user): void
    {
        $dm = static::getContainer()->get(DocumentManager::class);
        $dm->persist((new BalanceSnapshot())->setUserId($user['id']));
        $dm->persist((new ActivityLog())->setUserId($user['id'])->setUserEmail($user['email'])->setActionType('test'));
        $dm->flush();
    }

    private function assertDocuments(array $user, int $snapshots, int $logs): void
    {
        $dm = static::getContainer()->get(DocumentManager::class);
        foreach ([BalanceSnapshot::class=>$snapshots, ActivityLog::class=>$logs] as $class=>$count) {
            self::assertCount($count, $dm->getRepository($class)->findBy(['userId'=>$user['id']]));
        }
    }

    public function testSelfDeletionPurgesOnlyOwnedDocuments(): void
    {
        $owner = $this->user(); $other = $this->user();
        $this->seedDocuments($owner); $this->seedDocuments($other);
        self::assertSame(200, $this->request('DELETE','/api/me',null,$owner['token'])[0]);
        $this->assertDocuments($owner, 0, 0); $this->assertDocuments($other, 1, 2);
        self::assertSame(401, $this->request('GET','/api/me',null,$owner['token'])[0]);
    }

    public function testAdminDeletionPurgesOwnedDocuments(): void
    {
        $admin = $this->user(['ROLE_ADMIN']); $user = $this->user();
        $this->seedDocuments($admin); $this->seedDocuments($user);
        self::assertSame(200, $this->request('DELETE','/api/users/'.$user['id'],null,$admin['token'])[0]);
        $this->assertDocuments($user, 0, 0); $this->assertDocuments($admin, 1, 2);
    }

    public function testCleanupFailurePreservesSqlAccountForRetry(): void
    {
        $user = $this->user();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $dm = $this->createMock(DocumentManager::class);
        $dm->expects(self::once())->method('createQueryBuilder')->willThrowException(new \RuntimeException('Mongo unavailable'));
        $service = new AccountDeletionService($dm, $em, static::getContainer()->get(\App\Service\SessionRevocationService::class));
        try {
            $service->delete($em->find(User::class, $user['id']));
            self::fail('Cleanup must fail before deleting the account');
        } catch (ServiceUnavailableHttpException $error) {
            self::assertSame(503, $error->getStatusCode());
        }
        self::assertNotNull($em->find(User::class, $user['id']));
        self::assertSame(200, $this->request('GET','/api/me',null,$user['token'])[0]);
    }
    public function testCategoryTypesAreEnforcedForOperationsAndBudgets(): void
    {
        $user = $this->user();
        $ids = [];
        foreach (['income', 'expense', 'both'] as $type) {
            [$status, $created] = $this->request('POST', '/api/my-categories/custom', ['name'=>'Typed '.bin2hex(random_bytes(6)), 'color'=>'#2563EB', 'type'=>$type], $user['token']);
            self::assertSame(201, $status);
            self::assertSame($type, $created['category']['type']);
            $ids[$type] = $created['category']['id'];
        }
        $draft = ['label'=>'Type test', 'amount'=>10, 'date'=>'2026-10-28'];
        foreach (['income', 'expense', 'both'] as $categoryType) {
            foreach (['income', 'expense'] as $operationType) {
                $expected = $categoryType === 'both' || $categoryType === $operationType ? 201 : 400;
                self::assertSame($expected, $this->request('POST', '/api/operations', $draft + ['type'=>$operationType, 'category_id'=>$ids[$categoryType]], $user['token'])[0]);
            }
        }
        [, $created] = $this->request('POST', '/api/operations', $draft + ['type'=>'income', 'category_id'=>$ids['income']], $user['token']);
        $path = '/api/operations/'.$created['operation']['id'];
        self::assertSame(400, $this->request('PUT', $path, ['type'=>'expense'], $user['token'])[0]);
        self::assertSame(400, $this->request('PUT', $path, ['category_id'=>$ids['expense']], $user['token'])[0]);
        self::assertSame('income', $this->request('GET', $path, null, $user['token'])[1]['type']);
        self::assertSame(200, $this->request('PUT', $path, ['type'=>'expense', 'category_id'=>$ids['expense']], $user['token'])[0]);
        self::assertSame(400, $this->request('POST', '/api/budgets', ['category_id'=>$ids['income'], 'monthly_limit'=>100], $user['token'])[0]);
        self::assertSame(201, $this->request('POST', '/api/budgets', ['category_id'=>$ids['both'], 'monthly_limit'=>100], $user['token'])[0]);
        self::assertSame(400, $this->request('POST', '/api/my-categories/custom', ['name'=>'Bad type', 'color'=>'#2563EB', 'type'=>'invalid'], $user['token'])[0]);
    }

    public function testPersonalCategoriesArePrivateAndUsableByTheirOwner(): void
    {
        $alice = $this->user();
        $bob = $this->user();
        [$status, $created] = $this->request('POST', '/api/my-categories/custom', ['name'=>'Private '.bin2hex(random_bytes(5)), 'color'=>'#2563EB', 'icon'=>'briefcase.png', 'type'=>'income'], $alice['token']);
        self::assertSame(201, $status);
        $id = $created['category']['id'];
        foreach (['/api/categories', '/api/my-categories'] as $path) {
            $mine = $this->request('GET', $path, null, $alice['token'])[1];
            self::assertContains($id, array_column($mine, 'id'));
            $others = $this->request('GET', $path, null, $bob['token'])[1];
            self::assertNotContains($id, array_column($others, 'id'));
        }
        self::assertSame(404, $this->request('GET', '/api/categories/'.$id, null, $bob['token'])[0]);
        self::assertSame(404, $this->request('POST', '/api/my-categories', ['category_id'=>$id], $bob['token'])[0]);
        $operation = ['label'=>'Private test', 'amount'=>10, 'type'=>'income', 'date'=>'2026-10-23', 'category_id'=>$id];
        self::assertSame(404, $this->request('POST', '/api/operations', $operation, $bob['token'])[0]);
        self::assertSame(201, $this->request('POST', '/api/operations', $operation, $alice['token'])[0]);
        self::assertSame(404, $this->request('POST', '/api/budgets', ['category_id'=>$id,'monthly_limit'=>100], $bob['token'])[0]);
    }
}
