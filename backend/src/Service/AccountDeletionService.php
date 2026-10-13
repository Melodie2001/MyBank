<?php

namespace App\Service;

use App\Document\ActivityLog;
use App\Document\BalanceSnapshot;
use App\Entity\User;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class AccountDeletionService
{
    public function __construct(
        private readonly DocumentManager $dm,
        private readonly EntityManagerInterface $em,
        private readonly SessionRevocationService $sessions,
    ) {}

    public function delete(User $user): void
    {
        // Fail closed: keep the SQL account available for retry if MongoDB is unavailable.
        // Both removals are idempotent. MySQL and MongoDB do not share a transaction.
        try {
            foreach ([BalanceSnapshot::class, ActivityLog::class] as $document) {
                $this->dm->createQueryBuilder($document)->remove()
                    ->field('userId')->equals($user->getId())->getQuery()->execute();
            }
        } catch (\Throwable $error) {
            throw new ServiceUnavailableHttpException(null, 'Account cleanup unavailable. Please retry.', $error);
        }
        $this->em->wrapInTransaction(function () use ($user): void {
            $this->sessions->revoke($user);
            $this->em->remove($user);
        });
    }
}
