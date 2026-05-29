<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

final class UserController extends AbstractController
{
    #[Route('/api/users', methods: ['GET'])]
    public function index(UserRepository $repository): JsonResponse
    {
        $users = $repository->findAll();

        return $this->json(array_map(function (User $user) {
            return $this->formatUser($user);
        }, $users));
    }

    #[Route('/api/users/{id}', methods: ['GET'])]
    public function show(int $id, UserRepository $repository): JsonResponse
    {
        $user = $repository->find($id);

        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        return $this->json($this->formatUser($user));
    }

    #[Route('/api/register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        UserRepository $userRepository
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!$data || empty($data['email']) || empty($data['password'])) {
            return $this->json(['message' => 'Email and password are required'], 400);
        }

        $existingUser = $userRepository->findOneBy(['email' => $data['email']]);

        if ($existingUser) {
            return $this->json(['message' => 'Email already exists'], 409);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $roles = $data['roles'] ?? ['ROLE_USER'];
        $user->setRoles($roles);

        $hashedPassword = $passwordHasher->hashPassword(
            $user,
            $data['password']
        );

        $user->setPassword($hashedPassword);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'User created',
            'user' => $this->formatUser($user)
        ], 201);
    }

    #[Route('/api/login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (!$data || empty($data['email']) || empty($data['password'])) {
            return $this->json(['message' => 'Email and password are required'], 400);
        }

        $user = $userRepository->findOneBy(['email' => $data['email']]);

        if (!$user || !$passwordHasher->isPasswordValid($user, $data['password'])) {
            return $this->json(['message' => 'Invalid credentials'], 401);
        }

        return $this->json([
            'message' => 'Login successful',
            'user' => $this->formatUser($user)
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles()
        ];
    }
}