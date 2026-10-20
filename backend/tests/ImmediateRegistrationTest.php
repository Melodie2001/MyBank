<?php

namespace App\Tests;

use App\Controller\UserController;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\AccountActivationMailer;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\ConstraintViolationList;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ImmediateRegistrationTest extends TestCase
{
    public function testRegistrationIsActiveAndSendsWelcome(): void
    {
        $this->register(false);
    }

    public function testSmtpFailureDoesNotBlockRegistration(): void
    {
        $this->register(true);
    }

    private function register(bool $smtpFailure): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::once())->method('persist')->with(self::callback(static fn (User $user) => $user->getStatus() === 'active' && $user->getRoles() === ['ROLE_USER']));
        $em->expects(self::once())->method('flush');
        $repository = $this->createStub(UserRepository::class);
        $repository->method('findOneBy')->willReturn(null);
        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturn('hashed-password');
        $validator = $this->createStub(ValidatorInterface::class);
        $validator->method('validate')->willReturn(new ConstraintViolationList());
        $mailer = $this->createMock(MailerInterface::class);
        $send = $mailer->expects(self::once())->method('send');
        if ($smtpFailure) {
            $send->willThrowException(new TransportException('Simulated outage'));
        } else {
            $send->with(self::callback(static fn (Email $email) => $email->getSubject() === 'Bienvenue sur Nexo Finance'));
        }
        $controller = new UserController();
        $controller->setContainer(new Container());
        $request = new Request(content: json_encode(['email' => 'new@example.test', 'password' => 'Password123!', 'roles' => ['ROLE_ADMIN']]));
        $response = $controller->register($request, $em, $hasher, $repository, $validator, new AccountActivationMailer($mailer, 'https://app.example.test', 'sender@example.test', new NullLogger()));
        self::assertSame(201, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        self::assertSame('active', $data['user']['status']);
        self::assertSame(['ROLE_USER'], $data['user']['roles']);
        self::assertSame(!$smtpFailure, $data['welcomeEmailSent']);
    }
}
