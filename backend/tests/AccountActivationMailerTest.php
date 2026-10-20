<?php

namespace App\Tests;

use App\Entity\User;
use App\Service\AccountActivationMailer;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class AccountActivationMailerTest extends TestCase
{
    public function testSendsLoginLinkToActivatedUser(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::once())->method('send')->with(self::callback(static function (Email $email): bool {
            self::assertSame('Bienvenue sur Nexo Finance', $email->getSubject());
            self::assertSame('sender@example.test', $email->getFrom()[0]->getAddress());
            self::assertSame('member@example.test', $email->getTo()[0]->getAddress());
            self::assertStringContainsString('https://app.example.test/login', $email->getTextBody());
            self::assertStringContainsString('https://app.example.test/login', $email->getHtmlBody());
            self::assertStringNotContainsString('private-password', $email->getTextBody());
            return true;
        }));
        $service = new AccountActivationMailer($mailer, 'https://app.example.test/', 'sender@example.test', new NullLogger());
        self::assertTrue($service->send((new User())->setEmail('member@example.test')->setPassword('private-password')));
    }

    public function testReportsSmtpFailureWithoutUndoingAccountActivation(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::once())->method('send')->willThrowException(new TransportException('Simulated outage'));
        $service = new AccountActivationMailer($mailer, 'https://app.example.test', 'sender@example.test', new NullLogger());
        $user = (new User())->setEmail('member@example.test')->setStatus('active');
        self::assertFalse($service->send($user));
        self::assertSame('active', $user->getStatus());
    }
}
