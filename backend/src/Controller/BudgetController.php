<?php

namespace App\Controller;

use App\Entity\Budget;
use App\Entity\User;
use App\Repository\BudgetRepository;
use App\Repository\CategoryRepository;
use App\Repository\OperationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class BudgetController extends AbstractController
{
    #[Route('/api/budgets', methods: ['GET'])]
    public function index(
        Request $request,
        BudgetRepository $budgetRepository,
        OperationRepository $operationRepository
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $budgets = $budgetRepository->findBy(['user' => $user]);

        $month = $request->query->get('month', (new \DateTimeImmutable())->format('Y-m'));
        if (!is_string($month) || !preg_match('/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/D', $month)) {
            return $this->json(['message' => 'Month must use YYYY-MM format'], 400);
        }
        $monthStart = new \DateTimeImmutable($month.'-01 00:00:00');

        return $this->json(array_map(
            fn (Budget $budget) => $this->formatBudget($budget, $operationRepository, $monthStart),
            $budgets
        ));
    }

    #[Route('/api/budgets', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        CategoryRepository $categoryRepository,
        BudgetRepository $budgetRepository,
        OperationRepository $operationRepository
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = \App\Http\JsonInput::read($request);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if (empty($data['category_id'])) {
            return $this->json(['message' => 'Category is required'], 400);
        }

        if (!isset($data['monthly_limit']) || !is_numeric($data['monthly_limit']) || (float) $data['monthly_limit'] <= 0) {
            return $this->json(['message' => 'Monthly limit must be a positive number'], 400);
        }

        $category = $categoryRepository->find($data['category_id']);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        $existing = $budgetRepository->findOneBy(['user' => $user, 'category' => $category]);

        if ($existing) {
            return $this->json(['message' => 'A budget already exists for this category'], 409);
        }

        $budget = new Budget();
        $budget->setUser($user);
        $budget->setCategory($category);
        $budget->setMonthlyLimit((float) $data['monthly_limit']);

        $em->persist($budget);
        $em->flush();

        $now = new \DateTimeImmutable();
        $monthStart = $now->modify('first day of this month')->setTime(0, 0, 0);

        return $this->json([
            'message' => 'Budget created',
            'budget' => $this->formatBudget($budget, $operationRepository, $monthStart)
        ], 201);
    }

    #[Route('/api/budgets/{id}', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        BudgetRepository $budgetRepository,
        OperationRepository $operationRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $budget = $budgetRepository->find($id);

        if (!$budget) {
            return $this->json(['message' => 'Budget not found'], 404);
        }

        if ($budget->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $data = \App\Http\JsonInput::read($request);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if (!isset($data['monthly_limit']) || !is_numeric($data['monthly_limit']) || (float) $data['monthly_limit'] <= 0) {
            return $this->json(['message' => 'Monthly limit must be a positive number'], 400);
        }

        $budget->setMonthlyLimit((float) $data['monthly_limit']);
        $em->flush();

        $now = new \DateTimeImmutable();
        $monthStart = $now->modify('first day of this month')->setTime(0, 0, 0);

        return $this->json([
            'message' => 'Budget updated',
            'budget' => $this->formatBudget($budget, $operationRepository, $monthStart)
        ]);
    }

    #[Route('/api/budgets/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        BudgetRepository $budgetRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $budget = $budgetRepository->find($id);

        if (!$budget) {
            return $this->json(['message' => 'Budget not found'], 404);
        }

        if ($budget->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $em->remove($budget);
        $em->flush();

        return $this->json(['message' => 'Budget deleted']);
    }

    private function formatBudget(
        Budget $budget,
        OperationRepository $operations,
        \DateTimeImmutable $monthStart
    ): array {
        $spent = $operations->monthlyExpenses($budget->getUser(), $budget->getCategory(), $monthStart);

        return [
            'id' => $budget->getId(),
            'month' => $monthStart->format('Y-m'),
            'monthly_limit' => $budget->getMonthlyLimit(),
            'spent' => $spent,
            'remaining' => round($budget->getMonthlyLimit() - $spent, 2),
            'percentage' => $budget->getMonthlyLimit() > 0
                ? round(($spent / $budget->getMonthlyLimit()) * 100, 1)
                : 0,
            'category' => [
                'id' => $budget->getCategory()->getId(),
                'name' => $budget->getCategory()->getName(),
                'icon' => $budget->getCategory()->getIcon(),
                'color' => $budget->getCategory()->getColor()
            ]
        ];
    }
}
