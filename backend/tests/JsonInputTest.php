<?php

namespace App\Tests;

use App\Http\InvalidApiInput;
use App\Http\JsonInput;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class JsonInputTest extends TestCase
{
    public function testSubCentAmountsAreRejectedEvenCloseToZero(): void
    {
        $this->expectException(InvalidApiInput::class);
        JsonInput::read(new Request(content: '{"amount":0.000000001}'));
    }

    public function testRolesObjectCannotMasqueradeAsAnEmptyArray(): void
    {
        $this->expectException(InvalidApiInput::class);
        JsonInput::read(new Request(content: '{"roles":{}}'));
    }

    public function testOneCentAndEmptyRolesArrayRemainValid(): void
    {
        self::assertSame(['amount'=>0.01, 'roles'=>[]], JsonInput::read(new Request(content: '{"amount":0.01,"roles":[]}')));
    }
}
