<?php

namespace App\EventListener;

use App\Entity\User;
use App\Service\ActivityLogService;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
class JWTCreatedListener
{
    public function __construct(private readonly ActivityLogService $activityLogService) {}

    public function __invoke(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $this->activityLogService->log(
            $user->getId(),
            $user->getUserIdentifier(),
            'login',
            ['roles' => $user->getRoles()]
        );
    }
}
