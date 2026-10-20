<?php

namespace App\Service;

use App\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class AccountActivationMailer
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly string $frontendUrl,
        private readonly string $mailerFrom,
        private readonly LoggerInterface $logger,
    ) {}

    public function send(User $user): bool
    {
        $loginUrl = rtrim($this->frontendUrl, '/').'/login';
        $email = (new Email())
            ->from($this->mailerFrom)
            ->to($user->getEmail())
            ->subject('Bienvenue sur Nexo Finance')
            ->text("Bonjour,\n\nBienvenue sur Nexo Finance ! Votre compte est prêt à être utilisé.\nVous pouvez maintenant vous connecter avec la méthode de connexion choisie lors de votre inscription :\n\n".$loginUrl."\n\nL’équipe Nexo Finance")
            ->html('<p>Bonjour,</p><p>Bienvenue sur Nexo Finance ! Votre compte est prêt à être utilisé.</p><p>Vous pouvez maintenant vous connecter avec la méthode de connexion choisie lors de votre inscription.</p><p><a href="'.htmlspecialchars($loginUrl, ENT_QUOTES).'">Se connecter à Nexo Finance</a></p><p>L’équipe Nexo Finance</p>');

        try {
            $this->mailer->send($email);
            return true;
        } catch (TransportExceptionInterface $error) {
            $this->logger->error('Account activation email delivery failed', ['user_id' => $user->getId(), 'error_type' => $error::class]);
            return false;
        }
    }
}
