<?php

namespace App\Controller;

use App\Document\ActivityLog;
use App\Document\BalanceSnapshot;
use App\Entity\User;
use Doctrine\ODM\MongoDB\DocumentManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class AnalyticsController extends AbstractController
{
    #[Route('/api/activity-logs', methods: ['GET'])]
    public function activityLogs(Request $request, DocumentManager $dm): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $limit  = min((int) ($request->query->get('limit', 100)), 500);
        $action = $request->query->get('action');

        $qb = $dm->createQueryBuilder(ActivityLog::class)
            ->sort('createdAt', 'DESC')
            ->limit($limit);

        if ($action) {
            $qb->field('actionType')->equals($action);
        }

        $logs = $qb->getQuery()->execute();

        $result = [];
        foreach ($logs as $log) {
            $result[] = [
                'id'         => $log->getId(),
                'userId'     => $log->getUserId(),
                'userEmail'  => $log->getUserEmail(),
                'actionType' => $log->getActionType(),
                'details'    => $log->getDetails(),
                'createdAt'  => $log->getCreatedAt()->format('c'),
            ];
        }

        return $this->json($result);
    }

    #[Route('/api/balance-history', methods: ['GET'])]
    public function balanceHistory(DocumentManager $dm): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $snapshots = $dm->createQueryBuilder(BalanceSnapshot::class)
            ->field('userId')->equals($user->getId())
            ->sort('snapshotDate', 'ASC')
            ->limit(90)
            ->getQuery()
            ->execute();

        $result = [];
        foreach ($snapshots as $s) {
            $result[] = [
                'date'     => $s->getSnapshotDate()->format('Y-m-d'),
                'balance'  => round($s->getBalance(), 2),
                'income'   => round($s->getTotalIncome(), 2),
                'expenses' => round($s->getTotalExpenses(), 2),
            ];
        }

        return $this->json($result);
    }
}
