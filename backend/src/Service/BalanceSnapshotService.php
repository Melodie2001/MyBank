<?php

namespace App\Service;

use App\Document\BalanceSnapshot;
use App\Entity\User;
use App\Repository\OperationRepository;
use Doctrine\ODM\MongoDB\DocumentManager;

class BalanceSnapshotService
{
    public function __construct(
        private readonly DocumentManager $dm,
        private readonly OperationRepository $operationRepository
    ) {}

    public function snapshot(User $user): void
    {
        try {
            $operations = $this->operationRepository->findBy(['user' => $user]);

            $income   = 0.0;
            $expenses = 0.0;
            foreach ($operations as $op) {
                if ($op->getType() === 'income') {
                    $income += $op->getAmount();
                } else {
                    $expenses += $op->getAmount();
                }
            }

            // Upsert: one snapshot per user per day
            $today    = new \DateTimeImmutable('today midnight');
            $tomorrow = new \DateTimeImmutable('tomorrow midnight');

            $existing = $this->dm->createQueryBuilder(BalanceSnapshot::class)
                ->field('userId')->equals($user->getId())
                ->field('snapshotDate')->gte($today)->lt($tomorrow)
                ->getQuery()
                ->getSingleResult();

            if ($existing instanceof BalanceSnapshot) {
                $existing->setBalance($income - $expenses);
                $existing->setTotalIncome($income);
                $existing->setTotalExpenses($expenses);
            } else {
                $snapshot = new BalanceSnapshot();
                $snapshot->setUserId($user->getId());
                $snapshot->setBalance($income - $expenses);
                $snapshot->setTotalIncome($income);
                $snapshot->setTotalExpenses($expenses);
                $snapshot->setSnapshotDate(new \DateTimeImmutable());
                $this->dm->persist($snapshot);
            }

            $this->dm->flush();
        } catch (\Throwable $e) {
            // MongoDB failure must not break the main MySQL transaction
        }
    }
}
