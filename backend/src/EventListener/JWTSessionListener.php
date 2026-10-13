<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTAuthenticatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_authenticated')]
final class JWTSessionListener
{
    public function __invoke(JWTAuthenticatedEvent $event): void
    {
        $user = $event->getToken()->getUser();
        $payload = $event->getPayload();

        if (!$user instanceof User
            || ($payload['user_id'] ?? null) !== $user->getId()
            || ($payload['session_version'] ?? null) !== $user->getSessionVersion()
        ) {
            throw new CustomUserMessageAuthenticationException('Your session has expired. Please sign in again.');
        }
    }
}
