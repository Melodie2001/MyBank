<?php

namespace App\Controller;

use App\DTO\ChangePasswordDTO;
use App\DTO\RegisterDTO;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\ActivityLogService;
use App\Service\NotificationService;
use App\Service\SessionRevocationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

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

        $data = \App\Http\JsonInput::read($request);

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
    public function deleteMe(\App\Service\AccountDeletionService $deletion): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $deletion->delete($user);

        return $this->json(['message' => 'Account deleted successfully']);
    }

    #[Route('/api/me/password', methods: ['PUT'])]
    public function updatePassword(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator,
        SessionRevocationService $sessions
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $data = \App\Http\JsonInput::read($request);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        $dto = ChangePasswordDTO::fromArray($data);

        $violations = $validator->validate($dto);
        if (count($violations) > 0) {
            return $this->json(['message' => $violations[0]->getMessage()], 400);
        }

        if (!$passwordHasher->isPasswordValid($user, $dto->currentPassword)) {
            return $this->json(['message' => 'Current password is incorrect'], 400);
        }

        $em->wrapInTransaction(function () use ($user, $dto, $passwordHasher, $sessions): void {
            $user->setPassword($passwordHasher->hashPassword($user, $dto->newPassword));
            $sessions->revoke($user);
        });

        return $this->json(['message' => 'Password updated successfully']);
    }

    #[Route('/api/register', methods: ['POST'])]
    public function register(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        UserRepository $userRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = \App\Http\JsonInput::read($request);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        $dto = RegisterDTO::fromArray($data);

        $violations = $validator->validate($dto);
        if (count($violations) > 0) {
            return $this->json(['message' => $violations[0]->getMessage()], 400);
        }

        $existingUser = $userRepository->findOneBy(['email' => $dto->email]);

        if ($existingUser) {
            return $this->json(['message' => 'Email already exists'], 409);
        }

        $user = new User();
        $user->setEmail($dto->email);
        $user->setStatus('pending');

        if ($dto->firstName) {
            $user->setFirstName($dto->firstName);
        }

        if ($dto->lastName) {
            $user->setLastName($dto->lastName);
        }

        if ($dto->phone) {
            $user->setPhone($dto->phone);
        }

        if ($dto->birthDate) {
            $birthDate = \DateTime::createFromFormat('Y-m-d', $dto->birthDate);
            if ($birthDate) {
                $user->setBirthDate($birthDate);
            }
        }

        if ($dto->gender) {
            $user->setGender($dto->gender);
        }

        // Route publique : toute valeur "role"/"roles" envoyée par le client est ignorée.
        // L'attribution de ROLE_ADMIN se fait exclusivement via UserController::updateRole().
        $user->setRoles(['ROLE_USER']);

        $hashedPassword = $passwordHasher->hashPassword($user, $dto->password);
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
        NotificationService $notificationService,
        SessionRevocationService $sessions
    ): JsonResponse {
        if (!$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['message' => 'Access denied'], 403);
        }

        $user = $repository->find($id);

        if (!$user) {
            return $this->json(['message' => 'User not found'], 404);
        }

        $data = \App\Http\JsonInput::read($request);

        if (!isset($data['status']) || !in_array($data['status'], ['active', 'pending', 'rejected'], true)) {
            return $this->json(['message' => 'Invalid status. Must be active, pending or rejected'], 400);
        }

        $previousStatus = $user->getStatus();
        $em->wrapInTransaction(function () use ($user, $data, $previousStatus, $notificationService, $sessions): void {
            $user->setStatus($data['status']);
            if ($data['status'] !== 'active') {
                $sessions->revoke($user);
            }
            if ($previousStatus !== 'active' && $data['status'] === 'active') {
                $notificationService->create(
                    $user,
                    'account_validated',
                    'Your account has been activated!',
                    'Welcome to Nexo Finance! Your account is now active. You can start tracking your finances.'
                );
            }
        });

        return $this->json([
            'message' => 'User status updated',
            'user' => $this->formatUser($user)
        ]);
    }

    #[Route('/api/users/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        UserRepository $repository,
        EntityManagerInterface $em,
        \App\Service\AccountDeletionService $deletion
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

        $deletion->delete($user);

        return $this->json(['message' => 'User deleted successfully']);
    }

    #[Route('/api/login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return $this->json([
            'message' => 'Login is handled by JWT security firewall'
        ]);
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

        $data = \App\Http\JsonInput::read($request);

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
