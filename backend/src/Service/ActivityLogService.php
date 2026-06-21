<?php

namespace App\Service;

use App\Document\ActivityLog;
use Doctrine\ODM\MongoDB\DocumentManager;

class ActivityLogService
{
    public function __construct(private readonly DocumentManager $dm) {}

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
            // MongoDB failure must not break the main MySQL transaction
        }
    }
}
