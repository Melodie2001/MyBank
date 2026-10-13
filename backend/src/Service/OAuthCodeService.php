<?php

namespace App\Service;

use App\Entity\OAuthExchangeCode;
use App\Entity\User;
use App\Repository\OAuthExchangeCodeRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Issues and consumes the one-time code used by the OAuth callback flow, so the
 * JWT never travels in a redirect URL.
 */
class OAuthCodeService
{
    private const TTL_SECONDS = 60;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly OAuthExchangeCodeRepository $codeRepository,
    ) {}

    public function issueCode(User $user): string
    {
        foreach ($this->codeRepository->findBy(['user' => $user, 'usedAt' => null]) as $previous) {
            $this->em->remove($previous);
        }

        $plainCode = bin2hex(random_bytes(32));

        $code = new OAuthExchangeCode();
        $code->setUser($user);
        $code->setCodeHash($this->hash($plainCode));
        $code->setCreatedAt(new \DateTimeImmutable());
        $code->setExpiresAt(new \DateTimeImmutable('+' . self::TTL_SECONDS . ' seconds'));

        $this->em->persist($code);
        $this->em->flush();

        return $plainCode;
    }

    public function consumeCode(string $plainCode): ?User
    {
        if ($plainCode === '') {
            return null;
        }

        $code = $this->codeRepository->findOneBy(['codeHash' => $this->hash($plainCode)]);

        if (!$code || !$code->isValid()) {
            return null;
        }

        $code->setUsedAt(new \DateTimeImmutable());
        $this->em->flush();

        return $code->getUser();
    }

    private function hash(string $plainCode): string
    {
        return hash('sha256', $plainCode);
    }
}
