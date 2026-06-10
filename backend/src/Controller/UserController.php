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
        $user->setStatus('pending');

        if (!empty($data['firstName'])) {
            $user->setFirstName(trim($data['firstName']));
        }

        if (!empty($data['lastName'])) {
            $user->setLastName(trim($data['lastName']));
        }

        $roles = ['ROLE_USER'];

        if (isset($data['roles']) && in_array('ROLE_ADMIN', $data['roles'], true)) {
            if ($this->getUser() && $this->isGranted('ROLE_ADMIN')) {
                $roles[] = 'ROLE_ADMIN';
            }
        }

        $user->setRoles($roles);

        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        $em->persist($user);
        $em->flush();

        return $this->json([
            'message' => 'User created — waiting for admin approval',
            'user' => $this->formatUser($user)
        ], 201);
    }

    #[Route('/api/users/{id}/status', methods: ['PUT'])]
    public function updateStatus(
        int $id,
        Request $request,
        UserRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $user = $repository->find($id);

        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['status']) || !in_array($data['status'], ['active', 'pending', 'rejected'], true)) {
            return $this->json(['message' => 'Invalid status. Must be active, pending or rejected'], 400);
        }

        $user->setStatus($data['status']);
        $em->flush();

        return $this->json([
            'message' => 'User status updated',
            'user' => $this->formatUser($user)
        ]);
    }

    #[Route('/api/users/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        UserRepository $repository,
        EntityManagerInterface $em
    ): JsonResponse {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $user = $repository->find($id);

        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        // Empêcher la suppression de son propre compte
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if ($currentUser->getId() === $user->getId()) {
            return $this->json(['message' => 'You cannot delete your own account'], 403);
        }

        try {
            // Supprimer les opérations de l'user
            $operations = $em->getRepository(\App\Entity\Operation::class)
                ->findBy(['user' => $user]);
            foreach ($operations as $operation) {
                $em->remove($operation);
            }

            // Supprimer les user_categories de l'user
            $userCategories = $em->getRepository(\App\Entity\UserCategory::class)
                ->findBy(['user' => $user]);
            foreach ($userCategories as $userCategory) {
                $em->remove($userCategory);
            }

            $em->flush();

            // Supprimer l'user
            $em->remove($user);
            $em->flush();

            return $this->json(['message' => 'User deleted successfully']);

        } catch (\Exception $e) {
            return $this->json(['message' => 'Cannot delete this user: ' . $e->getMessage()], 500);
        }
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
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'roles' => $user->getRoles(),
            'status' => $user->getStatus()
        ];
    }
    #[Route('/api/users/{id}/role', methods: ['PUT'])]
public function updateRole(
    int $id,
    Request $request,
    UserRepository $repository,
    EntityManagerInterface $em
): JsonResponse {
    if (!$this->isGranted('ROLE_ADMIN')) {
        return $this->json(['message' => 'Access denied'], 403);
    }

    $user = $repository->find($id);

    if (!$user) {
        return $this->json(['message' => 'User not found'], 404);
    }

    $data = json_decode($request->getContent(), true);

    if (!isset($data['roles']) || !is_array($data['roles'])) {
        return $this->json(['message' => 'Roles must be an array'], 400);
    }

    $validRoles = ['ROLE_USER', 'ROLE_ADMIN'];
    foreach ($data['roles'] as $role) {
        if (!in_array($role, $validRoles, true)) {
            return $this->json(['message' => 'Invalid role: ' . $role], 400);
        }
    }

    $user->setRoles($data['roles']);
    $em->flush();

    return $this->json([
        'message' => 'User role updated',
        'user' => $this->formatUser($user)
    ]);
}
}