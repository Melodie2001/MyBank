<?php

namespace App\Tests\Unit;

use App\Entity\Category;
use PHPUnit\Framework\TestCase;

final class CategoryTypeTest extends TestCase
{
    public function testCategoryTypesRestrictOperationDirections(): void
    {
        $category = (new Category())->setType('income');
        self::assertTrue($category->accepts('income'));
        self::assertFalse($category->accepts('expense'));
        $category->setType('expense');
        self::assertTrue($category->accepts('expense'));
        self::assertFalse($category->accepts('income'));
        $category->setType('both');
        self::assertTrue($category->accepts('income'));
        self::assertTrue($category->accepts('expense'));
        self::assertFalse($category->accepts('invalid'));
    }
    public function testInvalidCategoryTypeIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new Category())->setType('invalid');
    }
}
