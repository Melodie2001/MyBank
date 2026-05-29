<?php

namespace App\Controller;

use App\Entity\Category;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CategoryController extends AbstractController
{
    #[Route('/api/categories', methods: ['GET'])]
    public function index(CategoryRepository $repository): JsonResponse
    {
        return $this->json($repository->findAll());
    }

    #[Route('/api/categories/{id}', methods: ['GET'])]
    public function show(int $id, CategoryRepository $repository): JsonResponse
    {
        $category = $repository->find($id);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        return $this->json($category);
    }

    #[Route('/api/categories', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $validationError = $this->validateCategoryData($data, true);
        if ($validationError) {
            return $validationError;
        }

        $category = new Category();
        $category->setName(trim($data['name']));
        $category->setIcon(trim($data['icon']));
        $category->setColor(trim($data['color']));

        $em->persist($category);
        $em->flush();

        return $this->json([
            'message' => 'Category created',
            'category' => $this->formatCategory($category)
        ], 201);
    }

    #[Route('/api/categories/{id}', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        CategoryRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $category = $repository->find($id);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $validationError = $this->validateCategoryData($data, false);
        if ($validationError) {
            return $validationError;
        }

        if (isset($data['name'])) {
            $category->setName(trim($data['name']));
        }

        if (isset($data['icon'])) {
            $category->setIcon(trim($data['icon']));
        }

        if (isset($data['color'])) {
            $category->setColor(trim($data['color']));
        }

        $em->flush();

        return $this->json([
            'message' => 'Category updated',
            'category' => $this->formatCategory($category)
        ]);
    }

    #[Route('/api/categories/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        CategoryRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $category = $repository->find($id);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        try {
            $em->remove($category);
            $em->flush();
        } catch (\Exception) {
            return $this->json([
                'message' => 'Cannot delete this category because it is used by operations'
            ], 409);
        }

        return $this->json(['message' => 'Category deleted']);
    }

    private function validateCategoryData(?array $data, bool $isCreate): ?JsonResponse
    {
        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if ($isCreate && empty($data['name'])) {
            return $this->json(['message' => 'Name is required'], 400);
        }

        if ($isCreate && empty($data['icon'])) {
            return $this->json(['message' => 'Icon is required'], 400);
        }

        if ($isCreate && empty($data['color'])) {
            return $this->json(['message' => 'Color is required'], 400);
        }

        if (isset($data['name']) && trim($data['name']) === '') {
            return $this->json(['message' => 'Name cannot be empty'], 400);
        }

        if (isset($data['icon']) && trim($data['icon']) === '') {
            return $this->json(['message' => 'Icon cannot be empty'], 400);
        }

        if (isset($data['color']) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'])) {
            return $this->json(['message' => 'Color must be a valid hexadecimal color'], 400);
        }

        return null;
    }

    private function formatCategory(Category $category): array
    {
        return [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'icon' => $category->getIcon(),
            'color' => $category->getColor()
        ];
    }
}