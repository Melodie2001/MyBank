<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class ActiveUserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if ($user instanceof User && $user->getStatus() !== 'active') {
            throw new CustomUserMessageAccountStatusException('Your account is not active. Please contact support.');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
    }
}
