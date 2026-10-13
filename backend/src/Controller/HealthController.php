<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController
{
    #[Route('/health', methods: ['GET'])]
    public function __invoke(Connection $connection, DocumentManager $dm): JsonResponse
    {
        try {
            $connection->executeQuery('SELECT 1');
            $dm->getDocumentDatabase(\App\Document\BalanceSnapshot::class)->command(['ping' => 1]);
            return new JsonResponse(['status' => 'ok']);
        } catch (\Throwable) {
            return new JsonResponse(['status' => 'unavailable'], 503);
        }
    }
}
