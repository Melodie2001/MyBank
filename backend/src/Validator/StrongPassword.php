<?php

namespace App\Validator;

use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\Compound;

/**
 * Single source of truth for password strength rules, shared by every endpoint
 * that accepts a password (registration, reset, change password).
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::IS_REPEATABLE)]
class StrongPassword extends Compound
{
    protected function getConstraints(array $options): array
    {
        return [
            new Assert\NotBlank(message: 'Password is required'),
            new Assert\Length(
                min: 8,
                max: 4096,
                minMessage: 'Password must contain at least {{ limit }} characters',
            ),
            new Assert\Regex(
                pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one digit and one special character',
            ),
        ];
    }
}
