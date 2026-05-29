<?php

namespace App\Controller;

use App\Entity\Operation;
use App\Repository\CategoryRepository;
use App\Repository\OperationRepository;
use App\Repository\UserRepository;
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
        $operations = $repository->findAll();

        return $this->json(array_map([$this, 'formatOperation'], $operations));
    }

    #[Route('/api/operations/{id}', methods: ['GET'])]
    public function show(int $id, OperationRepository $repository): JsonResponse
    {
        $operation = $repository->find($id);

        if (!$operation) {
            return $this->json(['message' => 'Operation not found'], 404);
        }

        return $this->json($this->formatOperation($operation));
    }

    #[Route('/api/operations', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        CategoryRepository $categoryRepository,
        UserRepository $userRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $category = $categoryRepository->find($data['category_id']);
        $user = $userRepository->find($data['user_id']);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        $operation = new Operation();
        $operation->setLabel($data['label']);
        $operation->setAmount((float) $data['amount']);
        $operation->setDate(new \DateTimeImmutable($data['date']));
        $operation->setType($data['type']);
        $operation->setCategory($category);
        $operation->setUser($user);

        $em->persist($operation);
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
        $operation = $repository->find($id);

        if (!$operation) {
            return $this->json(['message' => 'Operation not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['label'])) {
            $operation->setLabel($data['label']);
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
        $operation = $repository->find($id);

        if (!$operation) {
            return $this->json(['message' => 'Operation not found'], 404);
        }

        $em->remove($operation);
        $em->flush();

        return $this->json(['message' => 'Operation deleted']);
    }

    #[Route('/api/dashboard/{userId}', methods: ['GET'])]
    public function dashboard(int $userId, OperationRepository $repository): JsonResponse
    {
        $operations = $repository->findBy(['user' => $userId], ['date' => 'DESC']);

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