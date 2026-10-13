<?php

namespace App\Tests\Integration;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use App\Repository\PasswordResetTokenRepository;
use App\Service\PasswordResetService;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\NullLogger;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mailer\Exception\TransportException;

final class PasswordResetDeliveryTest extends KernelTestCase
{
    public function testSmtpFailurePreservesPreviousResetLink(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        $em = $container->get(EntityManagerInterface::class);
        $user = (new User())->setEmail('mailfailure_'.bin2hex(random_bytes(8)).'@example.test')->setStatus('active');
        $previous = (new PasswordResetToken())->setUser($user)->setToken(hash('sha256','previous-fictitious-link'))->setCreatedAt(new \DateTimeImmutable())->setExpiresAt(new \DateTimeImmutable('+1 hour'));
        $em->persist($user); $em->persist($previous); $em->flush();
        $id = $user->getId(); $previousId = $previous->getId();
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::once())->method('send')->willThrowException(new TransportException('Simulated SMTP outage'));
        $service = new PasswordResetService($em, $container->get(PasswordResetTokenRepository::class), $mailer, 'http://localhost:5173', new NullLogger());
        try {
            $service->createAndSendToken($user);
            $em = $container->get(ManagerRegistry::class)->resetManager();
            $tokens = $em->getRepository(PasswordResetToken::class)->findBy(['user'=>$id]);
            self::assertCount(1,$tokens);
            self::assertSame($previousId,$tokens[0]->getId());
            self::assertTrue($tokens[0]->isValid());
        } finally {
            $em->getConnection()->delete('user',['id'=>$id]);
        }
    }
}
