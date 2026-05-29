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
    public function show(
        int $id,
        CategoryRepository $repository
    ): JsonResponse {

        $category = $repository->find($id);

        if (!$category) {
            return $this->json([
                'message' => 'Category not found'
            ], 404);
        }

        return $this->json($category);
    }

    #[Route('/api/categories', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {

        $data = json_decode($request->getContent(), true);

        $category = new Category();

        $category->setName($data['name']);
        $category->setIcon($data['icon']);
        $category->setColor($data['color']);

        $em->persist($category);
        $em->flush();

        return $this->json([
            'message' => 'Category created',
            'category' => [
                'id' => $category->getId(),
                'name' => $category->getName(),
                'icon' => $category->getIcon(),
                'color' => $category->getColor()
            ]
        ], 201);
    }

    #[Route('/api/categories/{id}', methods: ['PUT'])]
    public function update(
        int $id,
        Request $request,
        CategoryRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {

        $category = $repository->find($id);

        if (!$category) {
            return $this->json([
                'message' => 'Category not found'
            ], 404);
        }

        $data = json_decode($request->getContent(), true);

        $category->setName($data['name']);
        $category->setIcon($data['icon']);
        $category->setColor($data['color']);

        $em->flush();

        return $this->json([
            'message' => 'Category updated'
        ]);
    }

    #[Route('/api/categories/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        CategoryRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {

        $category = $repository->find($id);

        if (!$category) {
            return $this->json([
                'message' => 'Category not found'
            ], 404);
        }

        $em->remove($category);
        $em->flush();

        return $this->json([
            'message' => 'Category deleted'
        ]);
    }
}