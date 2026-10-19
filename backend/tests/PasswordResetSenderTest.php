<?php

namespace App\Tests;

use App\Entity\User;
use App\Repository\PasswordResetTokenRepository;
use App\Service\PasswordResetService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class PasswordResetSenderTest extends TestCase
{
    public function testResetEmailUsesConfiguredSenderAndFrontend(): void
    {
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('wrapInTransaction')->willReturnCallback(static fn (callable $callback) => $callback());
        $repository = $this->createStub(PasswordResetTokenRepository::class);
        $repository->method('findBy')->willReturn([]);
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::once())->method('send')->with(self::callback(static function (Email $email): bool {
            self::assertSame('sender@example.test', $email->getFrom()[0]->getAddress());
            self::assertSame('recipient@example.test', $email->getTo()[0]->getAddress());
            self::assertStringContainsString('https://app.example.test/reset-password?token=', $email->getTextBody());
            return true;
        }));
        $service = new PasswordResetService($em, $repository, $mailer, 'https://app.example.test', new NullLogger(), 'sender@example.test');
        $service->createAndSendToken((new User())->setEmail('recipient@example.test'));
    }
}
