<?php

namespace App\Service;

use App\Document\ActivityLog;
use Doctrine\ODM\MongoDB\DocumentManager;
use Psr\Log\LoggerInterface;

class ActivityLogService
{
    public function __construct(private readonly DocumentManager $dm, private readonly LoggerInterface $logger) {}

    public function log(int $userId, string $userEmail, string $actionType, array $details = []): void
    {
        try {
            $log = new ActivityLog();
            $log->setUserId($userId);
            $log->setUserEmail($userEmail);
            $log->setActionType($actionType);
            $log->setDetails($details);

            $this->dm->persist($log);
            $this->dm->flush();
        } catch (\Throwable $e) {
            $this->logger->error('Activity log persistence failed', ['user_id' => $userId, 'action' => $actionType, 'error_type' => $e::class]);
        }
    }
}
