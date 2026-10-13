<?php

namespace App\Controller;

use App\Service\OAuthCodeService;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class OAuthExchangeController extends AbstractController
{
    #[Route('/api/auth/oauth/exchange', methods: ['POST'])]
    public function exchange(
        Request $request,
        OAuthCodeService $oAuthCodeService,
        JWTTokenManagerInterface $jwtManager,
        RefreshTokenGeneratorInterface $refreshTokenGenerator,
        RefreshTokenManagerInterface $refreshTokenManager,
        #[Autowire('%gesdinet_jwt_refresh_token.ttl%')] int $refreshTokenTtl,
    ): JsonResponse {
        $data = \App\Http\JsonInput::read($request);
        $code = is_array($data) ? (string) ($data['code'] ?? '') : '';

        $user = $oAuthCodeService->consumeCode($code);

        if (!$user) {
            return $this->json(['message' => 'This sign-in code is invalid or has expired'], 400);
        }

        if ($user->getStatus() !== 'active') {
            return $this->json(['message' => 'Your account is not active. Please contact support.'], 403);
        }

        $accessToken = $jwtManager->create($user);

        $refreshToken = $refreshTokenGenerator->createForUserWithTtl($user, $refreshTokenTtl);
        // Capture the plaintext before save(): with hash_tokens enabled the model
        // only keeps the hash afterwards.
        $plainRefreshToken = $refreshToken->getRefreshToken();
        $refreshTokenManager->save($refreshToken);

        return $this->json([
            'token' => $accessToken,
            'refresh_token' => $plainRefreshToken,
            'refresh_token_expiration' => $refreshToken->getValid()?->getTimestamp(),
        ]);
    }
}
