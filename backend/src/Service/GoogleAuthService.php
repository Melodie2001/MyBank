<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use League\OAuth2\Client\Provider\GoogleUser;

class GoogleAuthService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly AccountActivationMailer $activationMailer,
    ) {}

    public function findOrCreateUser(GoogleUser $googleUser): User
    {
        $existingByGoogleId = $this->userRepository->findOneBy(['googleId' => $googleUser->getId()]);
        if ($existingByGoogleId) {
            return $existingByGoogleId;
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));
        $existingByEmail = $this->userRepository->findOneBy(['email' => $email]);

        if ($existingByEmail) {
            // Compte créé via email/mot de passe : on le lie au compte Google.
            $existingByEmail->setGoogleId($googleUser->getId());
            $this->em->flush();

            return $existingByEmail;
        }

        $user = new User();
        $user->setEmail($email);
        $user->setGoogleId($googleUser->getId());
        $user->setFirstName($googleUser->getFirstName());
        $user->setLastName($googleUser->getLastName());
        $user->setStatus('active');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword(null);

        $this->em->persist($user);
        $this->em->flush();
        $this->activationMailer->send($user);

        return $user;
    }
}
