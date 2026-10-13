<?php

namespace App\Service;

use App\Entity\Operation;
use App\Repository\BudgetRepository;
use App\Repository\OperationRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

final class BudgetAlertService
{
    public function __construct(
        private readonly BudgetRepository $budgets,
        private readonly OperationRepository $operations,
        private readonly NotificationService $notifications,
        private readonly EntityManagerInterface $em,
    ) {}

    /** Capture persisted totals before flushing the change, inside a transaction. */
    public function capture(Operation $operation, ?Operation $previous = null): array
    {
        $periods = [];
        foreach ([$previous, $operation] as $state) {
            if (!$state || $state->getType() !== 'expense') {
                continue;
            }
            $budget = $this->budgets->findOneBy(['user' => $state->getUser(), 'category' => $state->getCategory()]);
            if (!$budget) {
                continue;
            }
            $month = $state->getDate()->modify('first day of this month')->setTime(0, 0);
            $periods[$budget->getId().':'.$month->format('Y-m')] = ['budget' => $budget, 'month' => $month];
        }
        // A consistent lock order avoids opposite category moves deadlocking each other.
        ksort($periods, SORT_NATURAL);
        $locked = [];
        foreach ($periods as &$period) {
            $budget = $period['budget'];
            if (!isset($locked[$budget->getId()])) {
                $this->em->lock($budget, LockMode::PESSIMISTIC_WRITE);
                $locked[$budget->getId()] = true;
            }
            $period['spent'] = $this->operations->monthlyExpenses($budget->getUser(), $budget->getCategory(), $period['month']);
        }
        unset($period);

        return $periods;
    }

    /** Compare against the totals after the operation has been flushed. */
    public function notify(array $periods): void
    {
        foreach ($periods as $period) {
            $budget = $period['budget'];
            $spent = $this->operations->monthlyExpenses($budget->getUser(), $budget->getCategory(), $period['month']);
            $before = (int) round($period['spent'] * 100);
            $after = (int) round($spent * 100);
            $limit = (int) round($budget->getMonthlyLimit() * 100);
            if ($limit <= 0) {
                continue;
            }
            $name = $budget->getCategory()->getName();
            $month = $period['month']->format('Y-m');
            if ($before < $limit && $after >= $limit) {
                $this->notifications->create(
                    $budget->getUser(), 'budget_exceeded', 'Budget reached: '.$name,
                    sprintf('You have reached your %s budget for %s (%.2f € spent / %.2f € limit).', $name, $month, $spent, $budget->getMonthlyLimit()),
                    $budget->getId(),
                );
            } elseif ($before * 100 < $limit * 80 && $after * 100 >= $limit * 80) {
                $this->notifications->create(
                    $budget->getUser(), 'budget_warning', 'Budget nearly reached: '.$name,
                    sprintf('You have used %.0f%% of your %s budget for %s (%.2f € / %.2f €).', ($after / $limit) * 100, $name, $month, $spent, $budget->getMonthlyLimit()),
                    $budget->getId(),
                );
            }
        }
    }
}
