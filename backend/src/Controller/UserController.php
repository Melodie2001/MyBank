<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\ActivityLogService;
use App\Service\NotificationService;
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

    #[Route('/api/me', methods: ['PUT'])]
    public function updateMe(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepository,
        ActivityLogService $activityLogService
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if (isset($data['email'])) {
            $email = strtolower(trim($data['email']));

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['message' => 'Email is invalid'], 400);
            }

            if ($email !== $user->getEmail()) {
                $existingUser = $userRepository->findOneBy(['email' => $email]);

                if ($existingUser) {
                    return $this->json(['message' => 'Email already exists'], 409);
                }

                $user->setEmail($email);
            }
        }

        if (isset($data['firstName'])) {
            $user->setFirstName(trim($data['firstName']) ?: null);
        }

        if (isset($data['lastName'])) {
            $user->setLastName(trim($data['lastName']) ?: null);
        }

        if (array_key_exists('phone', $data)) {
            $user->setPhone(!empty($data['phone']) ? trim($data['phone']) : null);
        }

        if (array_key_exists('birthDate', $data)) {
            if (!empty($data['birthDate'])) {
                $birthDate = \DateTime::createFromFormat('Y-m-d', $data['birthDate']);
                $user->setBirthDate($birthDate ?: null);
            } else {
                $user->setBirthDate(null);
            }
        }

        $allowedGenders = ['male', 'female', 'non-binary', 'prefer_not_to_say'];
        if (array_key_exists('gender', $data)) {
            $user->setGender(in_array($data['gender'], $allowedGenders, true) ? $data['gender'] : null);
        }

        $em->flush();

        $activityLogService->log($user->getId(), $user->getUserIdentifier(), 'profile_updated', [
            'email' => $user->getEmail(),
        ]);

        return $this->json([
            'message' => 'Profile updated',
            'user' => $this->formatUser($user)
        ]);
    }

    #[Route('/api/me', methods: ['DELETE'])]
    public function deleteMe(EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        try {
            $operations = $em->getRepository(\App\Entity\Operation::class)->findBy(['user' => $user]);
            foreach ($operations as $op) {
                $em->remove($op);
            }

            $budgets = $em->getRepository(\App\Entity\Budget::class)->findBy(['user' => $user]);
            foreach ($budgets as $budget) {
                $em->remove($budget);
            }

            $notifications = $em->getRepository(\App\Entity\Notification::class)->findBy(['user' => $user]);
            foreach ($notifications as $notif) {
                $em->remove($notif);
            }

            $userCategories = $em->getRepository(\App\Entity\UserCategory::class)->findBy(['user' => $user]);
            foreach ($userCategories as $uc) {
                $em->remove($uc);
            }

            $em->flush();
            $em->remove($user);
            $em->flush();

            return $this->json(['message' => 'Account deleted successfully']);
        } catch (\Exception $e) {
            return $this->json(['message' => 'Could not delete account: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/api/me/password', methods: ['PUT'])]
    public function updatePassword(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        if (empty($data['current_password'])) {
            return $this->json(['message' => 'Current password is required'], 400);
        }

        if (empty($data['new_password'])) {
            return $this->json(['message' => 'New password is required'], 400);
        }

        if (strlen($data['new_password']) < 6) {
            return $this->json(['message' => 'New password must contain at least 6 characters'], 400);
        }

        if (!$passwordHasher->isPasswordValid($user, $data['current_password'])) {
            return $this->json(['message' => 'Current password is incorrect'], 400);
        }

        $hashedPassword = $passwordHasher->hashPassword($user, $data['new_password']);
        $user->setPassword($hashedPassword);

        $em->flush();

        return $this->json(['message' => 'Password updated successfully']);
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

        if (!empty($data['phone'])) {
            $user->setPhone(trim($data['phone']));
        }

        if (!empty($data['birthDate'])) {
            $birthDate = \DateTime::createFromFormat('Y-m-d', $data['birthDate']);
            if ($birthDate) {
                $user->setBirthDate($birthDate);
            }
        }

        $allowedGenders = ['male', 'female', 'non-binary', 'prefer_not_to_say'];
        if (!empty($data['gender']) && in_array($data['gender'], $allowedGenders, true)) {
            $user->setGender($data['gender']);
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
        EntityManagerInterface $em,
        NotificationService $notificationService
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

        $previousStatus = $user->getStatus();
        $user->setStatus($data['status']);

        if ($previousStatus !== 'active' && $data['status'] === 'active') {
            $notificationService->create(
                $user,
                'account_validated',
                'Your account has been activated!',
                'Welcome to Nexo Finance! Your account is now active. You can start tracking your finances.'
            );
        }

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
            'phone' => $user->getPhone(),
            'birthDate' => $user->getBirthDate()?->format('Y-m-d'),
            'gender' => $user->getGender(),
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