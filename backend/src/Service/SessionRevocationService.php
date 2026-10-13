<?php

namespace App\Service;

use App\Entity\OAuthExchangeCode;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RevokeRefreshTokenManagerInterface;

final class SessionRevocationService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly RevokeRefreshTokenManagerInterface $refreshTokens,
    ) {}

    /** Call inside the transaction that changes the account or password. */
    public function revoke(User $user): void
    {
        $user->invalidateSessions();
        $this->refreshTokens->revokeAllForUser($user);
        $this->em->createQueryBuilder()
            ->delete(OAuthExchangeCode::class, 'code')
            ->where('code.user = :user')
            ->setParameter('user', $user)
            ->getQuery()->execute();
    }
}
