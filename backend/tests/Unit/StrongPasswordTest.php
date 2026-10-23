<?php

namespace App\Tests\Unit;

use App\Validator\StrongPassword;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Validation;

final class StrongPasswordTest extends TestCase
{
    public function testMinimumLengthIsTwelveAndCompositionStillApplies(): void
    {
        $validator = Validation::createValidator();
        foreach (['Password12!', 'password123!', 'PASSWORD123!', 'Passwordabcd!', 'Password1234'] as $password) {
            self::assertGreaterThan(0, count($validator->validate($password, new StrongPassword())), $password);
        }
        self::assertCount(0, $validator->validate('Password123!', new StrongPassword()));
    }
}
