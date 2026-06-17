<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Entity\User;
use App\Repository\BudgetRepository;
use App\Repository\CategoryRepository;
use App\Repository\OperationRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class OperationController extends AbstractController
{
    #[Route('/api/operations', methods: ['GET'])]
    public function index(OperationRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if ($this->isGranted('ROLE_ADMIN')) {
            $operations = $repository->findBy([], ['date' => 'DESC']);
        } else {
            $operations = $repository->findBy(['user' => $user], ['date' => 'DESC']);
        }

        return $this->json(array_map([$this, 'formatOperation'], $operations));
    }

    #[Route('/api/operations/{id}', methods: ['GET'])]
    public function show(int $id, OperationRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $operation = $repository->find($id);

        if (!$operation) {
            return $this->json(['message' => 'Operation not found'], 404);
        }

        if (!$this->isGranted('ROLE_ADMIN') && $operation->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        return $this->json($this->formatOperation($operation));
    }

    #[Route('/api/operations', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        CategoryRepository $categoryRepository,
        OperationRepository $operationRepository,
        BudgetRepository $budgetRepository,
        NotificationService $notificationService
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        $validationError = $this->validateOperationData($data, true);
        if ($validationError) {
            return $validationError;
        }

        $category = $categoryRepository->find($data['category_id']);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        $operation = new Operation();
        $operation->setLabel(trim($data['label']));
        $operation->setAmount((float) $data['amount']);
        $operation->setDate(new \DateTimeImmutable($data['date']));
        $operation->setType($data['type']);
        $operation->setCategory($category);
        $operation->setUser($user);

        $em->persist($operation);
        $em->flush();

        // Notification: operation added
        $typeLabel = $data['type'] === 'income' ? 'Income' : 'Expense';
        $notificationService->create(
            $user,
            'operation_added',
            $typeLabel . ' recorded: ' . trim($data['label']),
            sprintf('%s of %.2f € added to %s.', $typeLabel, (float) $data['amount'], $category->getName()),
            $operation->getId()
        );

        // Budget threshold notifications (expense only)
        if ($data['type'] === 'expense') {
            $budget = $budgetRepository->findOneBy(['user' => $user, 'category' => $category]);
            if ($budget) {
                $now = new \DateTimeImmutable();
                $monthStart = $now->modify('first day of this month')->setTime(0, 0, 0);
                $monthEnd   = $now->modify('last day of this month')->setTime(23, 59, 59);

                $allOps = $operationRepository->findBy(['user' => $user]);
                $monthlySpent = 0.0;
                foreach ($allOps as $op) {
                    if (
                        $op->getType() === 'expense'
                        && $op->getCategory()->getId() === $category->getId()
                        && $op->getDate() >= $monthStart
                        && $op->getDate() <= $monthEnd
                    ) {
                        $monthlySpent += $op->getAmount();
                    }
                }

                $prevSpent = $monthlySpent - $operation->getAmount();
                $limit     = $budget->getMonthlyLimit();
                $prevPct   = $limit > 0 ? ($prevSpent / $limit) * 100 : 0;
                $newPct    = $limit > 0 ? ($monthlySpent / $limit) * 100 : 0;

                if ($prevPct < 100 && $newPct >= 100) {
                    $notificationService->create(
                        $user,
                        'budget_exceeded',
                        'Budget exceeded: ' . $category->getName(),
                        sprintf(
                            'You have exceeded your %s budget this month (%.2f € spent / %.2f € limit).',
                            $category->getName(), $monthlySpent, $limit
                        ),
                        $budget->getId()
                    );
                } elseif ($prevPct < 80 && $newPct >= 80) {
                    $notificationService->create(
                        $user,
                        'budget_warning',
                        'Budget nearly reached: ' . $category->getName(),
                        sprintf(
                            'You have used %.0f%% of your %s budget this month (%.2f € / %.2f €).',
                            $newPct, $category->getName(), $monthlySpent, $limit
                        ),
                        $budget->getId()
                    );
                }
            }
        }

        $em->flush();

        return $this->json([
            'message' => 'Operation created',
            'operation' => $this->formatOperation($operation)
        ], 201);
    }

    #[Route('/api/operations/{id}', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        OperationRepository $repository,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $operation = $repository->find($id);

        if (!$operation) {
            return $this->json(['message' => 'Operation not found'], 404);
        }

        if (!$this->isGranted('ROLE_ADMIN') && $operation->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $validationError = $this->validateOperationData($data, false);
        if ($validationError) {
            return $validationError;
        }

        if (isset($data['label'])) {
            $operation->setLabel(trim($data['label']));
        }

        if (isset($data['amount'])) {
            $operation->setAmount((float) $data['amount']);
        }

        if (isset($data['date'])) {
            $operation->setDate(new \DateTimeImmutable($data['date']));
        }

        if (isset($data['type'])) {
            $operation->setType($data['type']);
        }

        if (isset($data['category_id'])) {
            $category = $categoryRepository->find($data['category_id']);

            if (!$category) {
                return $this->json(['message' => 'Category not found'], 404);
            }

            $operation->setCategory($category);
        }

        $em->flush();

        return $this->json([
            'message' => 'Operation updated',
            'operation' => $this->formatOperation($operation)
        ]);
    }

    #[Route('/api/operations/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        OperationRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $operation = $repository->find($id);

        if (!$operation) {
            return $this->json(['message' => 'Operation not found'], 404);
        }

        if (!$this->isGranted('ROLE_ADMIN') && $operation->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $em->remove($operation);
        $em->flush();

        return $this->json(['message' => 'Operation deleted']);
    }

    #[Route('/api/me/operations', methods: ['GET'])]
    public function myOperations(OperationRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $operations = $repository->findBy(['user' => $user], ['date' => 'DESC']);

        return $this->json(array_map([$this, 'formatOperation'], $operations));
    }

    #[Route('/api/dashboard', methods: ['GET'])]
    public function dashboard(OperationRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $operations = $repository->findBy(['user' => $user], ['date' => 'DESC']);

        $income = 0;
        $expenses = 0;

        foreach ($operations as $operation) {
            if ($operation->getType() === 'income') {
                $income += $operation->getAmount();
            } else {
                $expenses += $operation->getAmount();
            }
        }

        return $this->json([
            'balance' => $income - $expenses,
            'income' => $income,
            'expenses' => $expenses,
            'recent_operations' => array_map([$this, 'formatOperation'], $operations)
        ]);
    }

    private function validateOperationData(?array $data, bool $isCreate): ?JsonResponse
    {
        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if ($isCreate && empty($data['label'])) {
            return $this->json(['message' => 'Label is required'], 400);
        }

        if ($isCreate && !isset($data['amount'])) {
            return $this->json(['message' => 'Amount is required'], 400);
        }

        if (isset($data['amount']) && (!is_numeric($data['amount']) || (float) $data['amount'] <= 0)) {
            return $this->json(['message' => 'Amount must be a positive number'], 400);
        }

        if ($isCreate && empty($data['date'])) {
            return $this->json(['message' => 'Date is required'], 400);
        }

        if (isset($data['date'])) {
            try {
                new \DateTimeImmutable($data['date']);
            } catch (\Exception) {
                return $this->json(['message' => 'Invalid date format'], 400);
            }
        }

        if ($isCreate && empty($data['type'])) {
            return $this->json(['message' => 'Type is required'], 400);
        }

        if (isset($data['type']) && !in_array($data['type'], ['income', 'expense'], true)) {
            return $this->json(['message' => 'Type must be income or expense'], 400);
        }

        if ($isCreate && empty($data['category_id'])) {
            return $this->json(['message' => 'Category is required'], 400);
        }

        return null;
    }

    private function formatOperation(Operation $operation): array
    {
        return [
            'id' => $operation->getId(),
            'label' => $operation->getLabel(),
            'amount' => $operation->getAmount(),
            'date' => $operation->getDate()->format('Y-m-d'),
            'type' => $operation->getType(),
            'category' => [
                'id' => $operation->getCategory()->getId(),
                'name' => $operation->getCategory()->getName(),
                'icon' => $operation->getCategory()->getIcon(),
                'color' => $operation->getCategory()->getColor()
            ],
            'user' => [
                'id' => $operation->getUser()->getId(),
                'email' => $operation->getUser()->getEmail()
            ]
        ];
    }
}