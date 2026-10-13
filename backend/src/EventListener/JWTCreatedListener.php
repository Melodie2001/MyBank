<?php

namespace App\EventListener;

use App\Entity\User;
use App\Service\ActivityLogService;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\RequestStack;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
class JWTCreatedListener
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
        private readonly RequestStack $requestStack,
    ) {}

    public function __invoke(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();
        $payload['user_id'] = $user->getId();
        $payload['session_version'] = $user->getSessionVersion();
        $event->setData($payload);

        // A token minted by /api/token/refresh is a renewal, not a new sign-in;
        // logging it would flood the activity log every few minutes.
        if ($this->requestStack->getCurrentRequest()?->getPathInfo() === '/api/token/refresh') {
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
