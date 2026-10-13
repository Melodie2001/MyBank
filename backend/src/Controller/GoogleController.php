<?php

namespace App\Controller;

use App\Service\GoogleAuthService;
use App\Service\OAuthCodeService;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use KnpU\OAuth2ClientBundle\Client\Provider\GoogleClient;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use League\OAuth2\Client\Token\AccessToken;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Attribute\Route;

final class GoogleController extends AbstractController
{
    public function __construct(private readonly string $frontendUrl)
    {
    }

    #[Route('/api/connect/google', name: 'connect_google_start', methods: ['GET'])]
    public function connect(ClientRegistry $clientRegistry): RedirectResponse
    {
        /** @var GoogleClient $client */
        $client = $clientRegistry->getClient('google');

        return $client->redirect(['email', 'profile']);
    }

    #[Route('/api/connect/google/check', name: 'connect_google_check', methods: ['GET'])]
    public function check(
        ClientRegistry $clientRegistry,
        GoogleAuthService $googleAuthService,
        OAuthCodeService $oAuthCodeService
    ): RedirectResponse {
        /** @var GoogleClient $client */
        $client = $clientRegistry->getClient('google');

        try {
            /** @var AccessToken $accessToken */
            $accessToken = $client->getAccessToken();
            $googleUser = $client->fetchUserFromToken($accessToken);
        } catch (IdentityProviderException) {
            return new RedirectResponse($this->frontendUrl . '/login?error=google_auth_failed');
        }

        if (!$googleUser->getEmail()) {
            return new RedirectResponse($this->frontendUrl . '/login?error=google_auth_failed');
        }

        // Only trust a Google identity whose e-mail Google itself has verified.
        // Otherwise an attacker could register an unverified Google account with
        // someone else's address and get it linked to their existing account.
        $claims = $googleUser->toArray();
        $emailVerified = filter_var(
            $claims['email_verified'] ?? $claims['verified_email'] ?? false,
            FILTER_VALIDATE_BOOLEAN
        );
        if (!$emailVerified) {
            return new RedirectResponse($this->frontendUrl . '/login?error=google_email_unverified');
        }

        $user = $googleAuthService->findOrCreateUser($googleUser);

        if ($user->getStatus() !== 'active') {
            return new RedirectResponse($this->frontendUrl . '/login?error=account_pending');
        }

        // Hand the SPA a short-lived one-time code instead of the JWT itself, so
        // no token ends up in browser history, proxy logs or the Referer header.
        $code = $oAuthCodeService->issueCode($user);

        return new RedirectResponse($this->frontendUrl . '/oauth-callback?code=' . $code);
    }
}
