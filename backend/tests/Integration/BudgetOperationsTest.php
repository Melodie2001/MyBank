<?php

namespace App\Tests\Integration;

use App\Entity\Category;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class BudgetOperationsTest extends WebTestCase
{
    private $client;
    private array $user;
    private array $categories;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->categories = [];
        foreach (['First', 'Second'] as $name) {
            $category = (new Category())->setName('Budget test '.$name)->setIcon('test')->setColor('#2563EB')->setType('both');
            $em->persist($category);
            $this->categories[] = $category;
        }
        $em->flush();
        $this->categories = array_map(fn(Category $category) => $category->getId(), $this->categories);
        $this->user = $this->user();
    }

    private function user(array $roles = ['ROLE_USER']): array
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $user = (new User())->setEmail('budget_'.bin2hex(random_bytes(8)).'@example.test')->setRoles($roles)->setStatus('active');
        $user->setPassword(static::getContainer()->get('security.user_password_hasher')->hashPassword($user, 'Password123!'));
        $em->persist($user); $em->flush();
        $email = $user->getEmail();
        [$status, $tokens] = $this->request('POST', '/api/login', ['email' => $email, 'password' => 'Password123!'], '');
        self::assertSame(200, $status);

        return $tokens;
    }

    private function request(string $method, string $path, ?array $body = null, ?string $token = null): array
    {
        $headers = ['CONTENT_TYPE' => 'application/json'];
        $jwt = $token ?? ($this->user['token'] ?? '');
        if ($jwt !== '') $headers['HTTP_AUTHORIZATION'] = 'Bearer '.$jwt;
        $this->client->request($method, $path, [], [], $headers, $body === null ? null : json_encode($body));

        return [$this->client->getResponse()->getStatusCode(), json_decode($this->client->getResponse()->getContent(), true)];
    }

    private function budget(int $category = 0, float $limit = 100): int
    {
        [$status, $body] = $this->request('POST', '/api/budgets', ['category_id' => $this->categories[$category], 'monthly_limit' => $limit]);
        self::assertSame(201, $status);
        return $body['budget']['id'];
    }

    private function operation(float $amount, string $date = '2026-01-15', int $category = 0, string $type = 'expense'): int
    {
        [$status, $body] = $this->request('POST', '/api/operations', ['label' => 'Budget scenario', 'amount' => $amount, 'date' => $date, 'type' => $type, 'category_id' => $this->categories[$category]]);
        self::assertSame(201, $status);
        return $body['operation']['id'];
    }

    private function update(int $id, array $body, ?string $token = null): void
    {
        self::assertSame(200, $this->request('PUT', '/api/operations/'.$id, $body, $token)[0]);
    }

    private function alerts(string $type): array
    {
        [$status, $rows] = $this->request('GET', '/api/notifications');
        self::assertSame(200, $status);
        return array_values(array_filter($rows, fn(array $row) => $row['type'] === $type));
    }

    private function spent(string $month, int $category = 0): float
    {
        [$status, $rows] = $this->request('GET', '/api/budgets?month='.$month);
        self::assertSame(200, $status);
        $budget = array_values(array_filter($rows, fn(array $row) => $row['category']['id'] === $this->categories[$category]))[0];
        self::assertSame($month, $budget['month']);
        return (float) $budget['spent'];
    }

    public function testExactThresholdsAndUnchangedEditDoNotDuplicateAlerts(): void
    {
        $this->budget();
        $id = $this->operation(79.99);
        self::assertCount(0, $this->alerts('budget_warning'));
        $this->operation(0.01);
        self::assertCount(1, $this->alerts('budget_warning'));
        $createdAt = $this->alerts('budget_warning')[0]['createdAt'];
        self::assertMatchesRegularExpression('/T\\d{2}:\\d{2}:\\d{2}[+-]\\d{2}:\\d{2}$/', $createdAt);
        self::assertLessThan(60, abs(time() - (new \DateTimeImmutable($createdAt))->getTimestamp()));
        $this->operation(19.99);
        self::assertCount(0, $this->alerts('budget_exceeded'));
        $this->operation(0.01);
        self::assertCount(1, $this->alerts('budget_exceeded'));
        $this->update($id, ['label' => 'New label']);
        self::assertCount(1, $this->alerts('budget_warning'));
        self::assertCount(1, $this->alerts('budget_exceeded'));
        self::assertSame(100.0, $this->spent('2026-01'));
    }

    public function testAmountChangesTriggerCrossingsAndCanCrossAgainAfterReduction(): void
    {
        $this->budget();
        $id = $this->operation(70);
        $this->update($id, ['amount' => 80]);
        self::assertCount(1, $this->alerts('budget_warning'));
        $this->update($id, ['amount' => 120]);
        self::assertCount(1, $this->alerts('budget_exceeded'));
        $this->update($id, ['amount' => 110]);
        self::assertCount(1, $this->alerts('budget_exceeded'));
        $this->update($id, ['amount' => 60]);
        $this->update($id, ['amount' => 90]);
        self::assertCount(2, $this->alerts('budget_warning'));
    }

    public function testHistoricalAndFutureOperationsDoNotRetriggerCurrentMonth(): void
    {
        $this->budget();
        $this->operation(90, date('Y-m-d'));
        $this->operation(30, (new \DateTimeImmutable('first day of last month'))->format('Y-m-d'));
        $this->operation(30, (new \DateTimeImmutable('first day of next month'))->format('Y-m-d'));
        self::assertCount(1, $this->alerts('budget_warning'));
        self::assertSame(90.0, $this->spent(date('Y-m')));
    }

    public function testCategoryMoveUsesDestinationBudgetAndRemovesSourceContribution(): void
    {
        $first = $this->budget();
        $second = $this->budget(1);
        $id = $this->operation(40);
        $this->operation(40);
        $this->operation(50, '2026-01-15', 1);
        $this->update($id, ['category_id' => $this->categories[1]]);
        self::assertSame(40.0, $this->spent('2026-01'));
        self::assertSame(90.0, $this->spent('2026-01', 1));
        $alerts = $this->alerts('budget_warning');
        self::assertCount(2, $alerts);
        self::assertEqualsCanonicalizing([$first, $second], array_column($alerts, 'relatedId'));
    }

    public function testMonthMoveUpdatesBothMonthsAndNamesTheDestinationMonth(): void
    {
        $this->budget();
        $id = $this->operation(60);
        $this->operation(30, '2026-02-01');
        $this->update($id, ['date' => '2026-02-28']);
        self::assertSame(0.0, $this->spent('2026-01'));
        self::assertSame(90.0, $this->spent('2026-02'));
        $alerts = $this->alerts('budget_warning');
        self::assertCount(1, $alerts);
        self::assertStringContainsString('2026-02', $alerts[0]['message']);
    }

    public function testIncomeExpenseConversionAffectsBudgetAndAlerts(): void
    {
        $this->budget();
        $id = $this->operation(90, '2026-01-15', 0, 'income');
        self::assertSame(0.0, $this->spent('2026-01'));
        self::assertCount(0, $this->alerts('budget_warning'));
        $this->update($id, ['type' => 'expense']);
        self::assertSame(90.0, $this->spent('2026-01'));
        self::assertCount(1, $this->alerts('budget_warning'));
        $this->update($id, ['type' => 'income']);
        self::assertSame(0.0, $this->spent('2026-01'));
        self::assertCount(1, $this->alerts('budget_warning'));
    }

    public function testAdminEditSendsAlertToOwner(): void
    {
        $this->budget();
        $id = $this->operation(70);
        $admin = $this->user(['ROLE_ADMIN']);
        $this->update($id, ['amount' => 90], $admin['token']);
        self::assertCount(1, $this->alerts('budget_warning'));
        [$status, $notifications] = $this->request('GET', '/api/notifications', null, $admin['token']);
        self::assertSame(200, $status);
        self::assertSame([], $notifications);
    }

    public function testDeletionRestoresAvailableBudgetAndAllowsNewCrossing(): void
    {
        $this->budget();
        $id = $this->operation(100);
        self::assertSame(200, $this->request('DELETE', '/api/operations/'.$id)[0]);
        self::assertSame(0.0, $this->spent('2026-01'));
        $this->operation(80);
        self::assertCount(1, $this->alerts('budget_warning'));
        self::assertCount(1, $this->alerts('budget_exceeded'));
    }

    public function testSmallBudgetDoesNotRoundUpAnEarlyWarning(): void
    {
        $this->budget(0, 0.03);
        $this->operation(0.02);
        self::assertCount(0, $this->alerts('budget_warning'));
        $this->operation(0.01);
        self::assertCount(1, $this->alerts('budget_exceeded'));
    }

    public function testInvalidMonthIsRejected(): void
    {
        foreach (['2026-13', '2026-00', '2026-2', '0000-01', 'invalid'] as $month) {
            self::assertSame(400, $this->request('GET', '/api/budgets?month='.$month)[0]);
        }
    }
}
