<?php

namespace App\Tests\Unit;

use App\Controller\CategoryController;
use App\Entity\Category;
use App\Entity\User;
use App\Entity\UserCategory;
use App\Repository\CategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorage;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;

final class PersonalCategoryTest extends TestCase
{
    private function user(int $id): User
    {
        $user = new User();
        (new \ReflectionProperty(User::class, 'id'))->setValue($user, $id);
        return $user;
    }

    public function testPrivateCategoryCannotBeUsedByAnotherUserOrBecomePublicAfterOwnerDeletion(): void
    {
        $alice = $this->user(1);
        $bob = $this->user(2);
        $category = (new Category())->setShared(false)->setOwner($alice);
        self::assertTrue($category->isAvailableTo($alice));
        self::assertFalse($category->isAvailableTo($bob));
        self::assertFalse($category->isAvailableTo(null));
        $category->setOwner(null);
        self::assertFalse($category->isAvailableTo($bob));
        $category->setShared(true);
        self::assertTrue($category->isAvailableTo($bob));
    }

    public function testCreationIgnoresForgedOwnershipAndAddsTheCategoryToOwnList(): void
    {
        $alice = $this->user(1);
        $storage = new TokenStorage();
        $storage->setToken(new UsernamePasswordToken($alice, 'api', ['ROLE_USER']));
        $container = new Container();
        $container->set('security.token_storage', $storage);
        $controller = new CategoryController();
        $controller->setContainer($container);
        $repository = $this->createMock(CategoryRepository::class);
        $repository->expects(self::once())->method('findOneBy')->with(['owner' => $alice, 'name' => 'Personal'])->willReturn(null);
        $em = $this->createMock(EntityManagerInterface::class);
        $saved = [];
        $em->expects(self::exactly(2))->method('persist')->willReturnCallback(function ($entity) use (&$saved): void { $saved[] = $entity; });
        $em->method('wrapInTransaction')->willReturnCallback(function (callable $callback) use ($em) { return $callback($em); });
        $response = $controller->createPersonal(new Request(content: json_encode(['name' => ' Personal ', 'color' => '#2563EB', 'owner_id' => 2, 'shared' => true])), $repository, $em);
        self::assertSame(201, $response->getStatusCode());
        self::assertInstanceOf(Category::class, $saved[0]);
        self::assertFalse($saved[0]->isShared());
        self::assertSame($alice, $saved[0]->getOwner());
        self::assertInstanceOf(UserCategory::class, $saved[1]);
        self::assertSame($alice, $saved[1]->getUser());
        self::assertSame($saved[0], $saved[1]->getCategory());
    }
}
