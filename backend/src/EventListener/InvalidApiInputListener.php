<?php

namespace App\EventListener;

use App\Http\InvalidApiInput;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;

#[AsEventListener(event: 'kernel.exception')]
final class InvalidApiInputListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        if ($event->getThrowable() instanceof InvalidApiInput) {
            $event->setResponse(new JsonResponse(['message' => $event->getThrowable()->getMessage()], 400));
        }
    }
}
