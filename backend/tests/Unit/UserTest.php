<?php

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testUserStatusDefault(): void
    {
        $user = new \App\Entity\User();
        $this->assertEquals('pending', $user->getStatus());
    }

    public function testUserRolesDefault(): void
    {
        $user = new \App\Entity\User();
        $user->setRoles(['ROLE_USER']);
        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testUserEmail(): void
    {
        $user = new \App\Entity\User();
        $user->setEmail('test@test.com');
        $this->assertEquals('test@test.com', $user->getEmail());
    }

    public function testUserFirstName(): void
    {
        $user = new \App\Entity\User();
        $user->setFirstName('John');
        $this->assertEquals('John', $user->getFirstName());
    }

    public function testUserLastName(): void
    {
        $user = new \App\Entity\User();
        $user->setLastName('Doe');
        $this->assertEquals('Doe', $user->getLastName());
    }
}