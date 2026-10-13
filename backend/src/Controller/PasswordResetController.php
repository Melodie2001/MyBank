<?php

namespace App\Controller;

use App\DTO\ResetPasswordDTO;
use App\Repository\UserRepository;
use App\Service\PasswordResetService;
use App\Service\SessionRevocationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class PasswordResetController extends AbstractController
{
    private const GENERIC_MESSAGE = 'If an account exists for this email, a password reset link has been sent.';

    #[Route('/api/forgot-password', methods: ['POST'])]
    public function forgotPassword(
        Request $request,
        UserRepository $userRepository,
        PasswordResetService $resetService,
        RateLimiterFactory $passwordResetLimiter
    ): JsonResponse {
        $limiter = $passwordResetLimiter->create($request->getClientIp() ?? 'unknown');
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(
                ['message' => 'Too many password reset requests. Please try again later.'],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        $data = \App\Http\JsonInput::read($request);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        $email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : '';

        // Ne jamais révéler si l'email existe ou non : même réponse dans tous les cas.
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $user = $userRepository->findOneBy(['email' => $email]);

            if ($user) {
                $resetService->createAndSendToken($user);
            }
        }

        return $this->json(['message' => self::GENERIC_MESSAGE]);
    }

    #[Route('/api/reset-password', methods: ['POST'])]
    public function resetPassword(
        Request $request,
        ValidatorInterface $validator,
        PasswordResetService $resetService,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em,
        SessionRevocationService $sessions
    ): JsonResponse {
        $data = \App\Http\JsonInput::read($request);

        if (!$data) {
            return $this->json(['message' => 'Invalid JSON body'], 400);
        }

        $dto = ResetPasswordDTO::fromArray($data);

        $violations = $validator->validate($dto);
        if (count($violations) > 0) {
            return $this->json(['message' => $violations[0]->getMessage()], 400);
        }

        $resetToken = $resetService->validateToken($dto->token);

        if (!$resetToken) {
            return $this->json(['message' => 'This reset link is invalid or has expired'], 400);
        }

        $user = $resetToken->getUser();
        $em->wrapInTransaction(function () use ($user, $dto, $passwordHasher, $resetService, $resetToken, $sessions): void {
            $user->setPassword($passwordHasher->hashPassword($user, $dto->newPassword));
            $sessions->revoke($user);
            $resetService->consumeToken($resetToken);
        });

        return $this->json(['message' => 'Password has been reset successfully']);
    }
}
