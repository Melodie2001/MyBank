<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\HttpFoundation\JsonResponse;

class AuthenticationSuccessListener
{
    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        if ($user->getStatus() === 'pending') {
            $event->setData([]);
            $response = new JsonResponse([
                'message' => 'Your account is pending approval from an administrator'
            ], 403);
            $event->getResponse()->setStatusCode(403);
            $event->getResponse()->setContent($response->getContent());
        }

        if ($user->getStatus() === 'rejected') {
            $event->setData([]);
            $response = new JsonResponse([
                'message' => 'Your account has been rejected. Please contact support.'
            ], 403);
            $event->getResponse()->setStatusCode(403);
            $event->getResponse()->setContent($response->getContent());
        }
    }
}