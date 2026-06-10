<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\UserCategory;
use App\Repository\CategoryRepository;
use App\Repository\UserCategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class CategoryController extends AbstractController
{
    // GET toutes les categories disponibles
    #[Route('/api/categories', methods: ['GET'])]
    public function index(CategoryRepository $repository): JsonResponse
    {
        return $this->json(array_map(
            fn($cat) => $this->formatCategory($cat),
            $repository->findAll()
        ));
    }

    // GET les categories de l'utilisateur connecté
    #[Route('/api/my-categories', methods: ['GET'])]
    public function myCategories(UserCategoryRepository $userCategoryRepository): JsonResponse
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $userCategories = $userCategoryRepository->findBy(['user' => $user]);

        return $this->json(array_map(
            fn($uc) => $this->formatCategory($uc->getCategory()),
            $userCategories
        ));
    }

    // POST ajouter une categorie a la liste de l'utilisateur
    #[Route('/api/my-categories', methods: ['POST'])]
    public function addToMyCategories(
        Request $request,
        CategoryRepository $categoryRepository,
        UserCategoryRepository $userCategoryRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (empty($data['category_id'])) {
            return $this->json(['message' => 'Category ID is required'], 400);
        }

        $category = $categoryRepository->find($data['category_id']);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        // Vérifier si déjà ajoutée
        $existing = $userCategoryRepository->findOneBy([
            'user' => $user,
            'category' => $category
        ]);

        if ($existing) {
            return $this->json(['message' => 'Category already added'], 409);
        }

        $userCategory = new UserCategory();
        $userCategory->setUser($user);
        $userCategory->setCategory($category);

        $em->persist($userCategory);
        $em->flush();

        return $this->json([
            'message' => 'Category added',
            'category' => $this->formatCategory($category)
        ], 201);
    }

    // DELETE supprimer une categorie de la liste de l'utilisateur
    #[Route('/api/my-categories/{id}', methods: ['DELETE'])]
    public function removeFromMyCategories(
        int $id,
        CategoryRepository $categoryRepository,
        UserCategoryRepository $userCategoryRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();

        $category = $categoryRepository->find($id);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        $userCategory = $userCategoryRepository->findOneBy([
            'user' => $user,
            'category' => $category
        ]);

        if (!$userCategory) {
            return $this->json(['message' => 'Category not in your list'], 404);
        }

        $em->remove($userCategory);
        $em->flush();

        return $this->json(['message' => 'Category removed']);
    }

    #[Route('/api/categories/{id}', methods: ['GET'])]
    public function show(int $id, CategoryRepository $repository): JsonResponse
    {
        $category = $repository->find($id);

        if (!$category) {
            return $this->json(['message' => 'Category not found'], 404);
        }

        return $this->json($this->formatCategory($category));
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

        if (isset($data['name'])) $category->setName(trim($data['name']));
        if (isset($data['icon'])) $category->setIcon(trim($data['icon']));
        if (isset($data['color'])) $category->setColor(trim($data['color']));

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