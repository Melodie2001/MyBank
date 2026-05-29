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
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $users = $repository->findAll();

        return $this->json(array_map(function (User $user) {
            return $this->formatUser($user);
        }, $users));
    }

    #[Route('/api/users/{id}', methods: ['GET'])]
    public function show(int $id, UserRepository $repository): JsonResponse
    {
        /** @var User $connectedUser */
        $connectedUser = $this->getUser();

        $user = $repository->find($id);

        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        if (!$this->isGranted('ROLE_ADMIN') && $connectedUser->getId() !== $user->getId()) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        return $this->json($this->formatUser($user));
    }

    #[Route('/api/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

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

        $validationError = $this->validateRegisterData($data);
        if ($validationError) {
            return $validationError;
        }

        $email = strtolower(trim($data['email']));

        $existingUser = $userRepository->findOneBy(['email' => $email]);

        if ($existingUser) {
            return $this->json(['message' => 'Email already exists'], 409);
        }

        $user = new User();
        $user->setEmail($email);

        $roles = ['ROLE_USER'];

        if (isset($data['roles']) && in_array('ROLE_ADMIN', $data['roles'], true)) {
            if ($this->getUser() && $this->isGranted('ROLE_ADMIN')) {
                $roles[] = 'ROLE_ADMIN';
            }
        }

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
    public function login(): JsonResponse
    {
        return $this->json([
            'message' => 'Login is handled by JWT security firewall'
        ]);
    }

    private function validateRegisterData(?array $data): ?JsonResponse
    {
        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if (empty($data['email'])) {
            return $this->json(['message' => 'Email is required'], 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email is invalid'], 400);
        }

        if (empty($data['password'])) {
            return $this->json(['message' => 'Password is required'], 400);
        }

        if (strlen($data['password']) < 6) {
            return $this->json(['message' => 'Password must contain at least 6 characters'], 400);
        }

        return null;
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