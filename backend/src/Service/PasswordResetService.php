<?php

namespace App\Service;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use App\Repository\PasswordResetTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Psr\Log\LoggerInterface;

class PasswordResetService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PasswordResetTokenRepository $tokenRepository,
        private readonly MailerInterface $mailer,
        private readonly string $frontendUrl,
        private readonly LoggerInterface $logger,
    ) {}

    /**
     * Issues a fresh reset token for the user and e-mails the link.
     *
     * Only the SHA-256 hash of the token is stored; the plaintext value lives
     * solely in the e-mail, so a database leak cannot be replayed against this
     * endpoint.
     */
    public function createAndSendToken(User $user): void
    {
        try {
            $this->em->wrapInTransaction(function () use ($user): void {
                // Invalidate previous links only when the new email is sent.
                $previousTokens = $this->tokenRepository->findBy(['user' => $user, 'usedAt' => null]);
                foreach ($previousTokens as $previousToken) {
                    $this->em->remove($previousToken);
                }

                $plainToken = bin2hex(random_bytes(32));
                $resetToken = new PasswordResetToken();
                $resetToken->setUser($user);
                $resetToken->setToken(self::hashToken($plainToken));
                $resetToken->setCreatedAt(new \DateTimeImmutable());
                $resetToken->setExpiresAt(new \DateTimeImmutable('+1 hour'));
                $this->em->persist($resetToken);
                $this->em->flush();
                $this->sendResetEmail($user, $plainToken);
            });
        } catch (TransportExceptionInterface $error) {
            // Roll back the new token and keep previous links usable. Never expose
            // SMTP failure only for existing accounts (account enumeration).
            $this->logger->error('Password reset email delivery failed', ['user_id' => $user->getId(), 'error_type' => $error::class]);
        }
    }

    public function validateToken(string $plainToken): ?PasswordResetToken
    {
        if ($plainToken === '') {
            return null;
        }

        $resetToken = $this->tokenRepository->findOneBy(['token' => self::hashToken($plainToken)]);

        if (!$resetToken || !$resetToken->isValid()) {
            return null;
        }

        return $resetToken;
    }

    public function consumeToken(PasswordResetToken $resetToken): void
    {
        $resetToken->setUsedAt(new \DateTimeImmutable());
        $this->em->flush();
    }

    private static function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }

    private function sendResetEmail(User $user, string $plainToken): void
    {
        $resetUrl = sprintf('%s/reset-password?token=%s', $this->frontendUrl, $plainToken);

        $email = (new Email())
            ->from('no-reply@nexo-finance.duckdns.org')
            ->to($user->getEmail())
            ->subject('Reset your Nexo Finance password')
            ->text(
                "Hello,\n\n" .
                "You requested a password reset for your Nexo Finance account.\n" .
                "Click the link below to choose a new password (valid for 1 hour):\n\n" .
                $resetUrl . "\n\n" .
                "If you didn't request this, you can safely ignore this email."
            )
            ->html(
                '<p>Hello,</p>' .
                '<p>You requested a password reset for your Nexo Finance account.</p>' .
                '<p>Click the link below to choose a new password (valid for 1 hour):</p>' .
                '<p><a href="' . htmlspecialchars($resetUrl) . '">' . htmlspecialchars($resetUrl) . '</a></p>' .
                "<p>If you didn't request this, you can safely ignore this email.</p>"
            );

        $this->mailer->send($email);
    }
}
