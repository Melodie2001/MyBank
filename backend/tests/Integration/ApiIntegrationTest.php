<?php

namespace App\Tests\Integration;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User;

class ApiIntegrationTest extends WebTestCase
{
    private $client;
    private static string $staticToken = '';

    protected function setUp(): void
    {
        $this->client = static::createClient();
    }

    // =====================
    // AUTH TESTS
    // =====================

    public function testRegisterUser(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'integration_test@test.com',
                'password' => 'password123',
                'firstName' => 'Integration',
                'lastName' => 'Test'
            ])
        );

        $response = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertResponseStatusCodeSame(201);
        $this->assertEquals('User created — waiting for admin approval', $response['message']);
        $this->assertEquals('integration_test@test.com', $response['user']['email']);
        $this->assertEquals('pending', $response['user']['status']);
    }

    public function testRegisterWithExistingEmail(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'duplicate@test.com',
                'password' => 'password123',
                'firstName' => 'Test',
                'lastName' => 'User'
            ])
        );

        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'duplicate@test.com',
                'password' => 'password123',
                'firstName' => 'Test',
                'lastName' => 'User'
            ])
        );

        $this->assertResponseStatusCodeSame(409);
    }

    public function testRegisterWithInvalidEmail(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'not-an-email',
                'password' => 'password123',
                'firstName' => 'Test',
                'lastName' => 'User'
            ])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testRegisterWithShortPassword(): void
    {
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'test@test.com',
                'password' => '123',
                'firstName' => 'Test',
                'lastName' => 'User'
            ])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    // =====================
    // CATEGORIES TESTS
    // =====================

    public function testGetCategoriesWithoutAuth(): void
    {
        $this->client->request('GET', '/api/categories');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetCategoriesWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/categories',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($response);
    }

    public function testGetMyCategoriesWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/my-categories',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($response);
    }

    // =====================
    // OPERATIONS TESTS
    // =====================

    public function testGetOperationsWithoutAuth(): void
    {
        $this->client->request('GET', '/api/operations');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetOperationsWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/operations',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($response);
    }

    public function testCreateOperationWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/categories',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $categories = json_decode($this->client->getResponse()->getContent(), true);

        if (empty($categories)) {
            $this->markTestSkipped('No categories available for testing');
        }

        $categoryId = $categories[0]['id'];

        $this->client->request(
            'POST',
            '/api/operations',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'label' => 'Test Operation',
                'amount' => 100.00,
                'date' => '2025-01-01',
                'type' => 'expense',
                'category_id' => $categoryId
            ])
        );

        $this->assertResponseStatusCodeSame(201);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Operation created', $response['message']);
        $this->assertEquals('Test Operation', $response['operation']['label']);
        $this->assertEquals(100.00, $response['operation']['amount']);
    }

    public function testCreateOperationWithoutAuth(): void
    {
        $this->client->request(
            'POST',
            '/api/operations',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'label' => 'Test',
                'amount' => 100,
                'date' => '2025-01-01',
                'type' => 'expense',
                'category_id' => 1
            ])
        );

        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetDashboardWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/dashboard',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('balance', $response);
        $this->assertArrayHasKey('income', $response);
        $this->assertArrayHasKey('expenses', $response);
        $this->assertArrayHasKey('recent_operations', $response);
    }

    // =====================
    // BUDGET TESTS
    // =====================

    public function testGetBudgetsWithoutAuth(): void
    {
        $this->client->request('GET', '/api/budgets');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetBudgetsWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/budgets',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($response);
    }

    public function testCreateBudgetWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/categories',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $categories = json_decode($this->client->getResponse()->getContent(), true);

        if (empty($categories)) {
            $this->markTestSkipped('No categories available for testing');
        }

        $categoryId = $categories[0]['id'];

        $this->client->request(
            'POST',
            '/api/budgets',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'category_id' => $categoryId,
                'monthly_limit' => 300.00
            ])
        );

        $statusCode = $this->client->getResponse()->getStatusCode();
        $this->assertContains($statusCode, [201, 409]);

        if ($statusCode === 201) {
            $response = json_decode($this->client->getResponse()->getContent(), true);
            $this->assertEquals('Budget created', $response['message']);
            $this->assertEquals(300.00, $response['budget']['monthly_limit']);
            $this->assertArrayHasKey('spent', $response['budget']);
            $this->assertArrayHasKey('remaining', $response['budget']);
            $this->assertArrayHasKey('percentage', $response['budget']);
        }
    }

    public function testCreateBudgetWithNegativeLimit(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'POST',
            '/api/budgets',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'category_id' => 1,
                'monthly_limit' => -100
            ])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreateBudgetWithoutCategory(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'POST',
            '/api/budgets',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'monthly_limit' => 200.00
            ])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testUpdateBudgetWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/budgets',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $budgets = json_decode($this->client->getResponse()->getContent(), true);

        if (empty($budgets)) {
            $this->markTestSkipped('No budgets available for testing');
        }

        $budgetId = $budgets[0]['id'];

        $this->client->request(
            'PUT',
            '/api/budgets/' . $budgetId,
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'monthly_limit' => 500.00
            ])
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Budget updated', $response['message']);
        $this->assertEquals(500.00, $response['budget']['monthly_limit']);
    }

    public function testDeleteBudgetWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/categories',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $categories = json_decode($this->client->getResponse()->getContent(), true);

        if (empty($categories)) {
            $this->markTestSkipped('No categories available for testing');
        }

        $this->client->request(
            'POST',
            '/api/budgets',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'category_id' => $categories[count($categories) - 1]['id'],
                'monthly_limit' => 100.00
            ])
        );

        $createResponse = json_decode($this->client->getResponse()->getContent(), true);

        if ($this->client->getResponse()->getStatusCode() !== 201) {
            $this->markTestSkipped('Could not create budget for delete test');
        }

        $budgetId = $createResponse['budget']['id'];

        $this->client->request(
            'DELETE',
            '/api/budgets/' . $budgetId,
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Budget deleted', $response['message']);
    }

    // =====================
    // PROFILE TESTS
    // =====================

    public function testGetMeWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/me',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('email', $response);
        $this->assertArrayHasKey('firstName', $response);
        $this->assertArrayHasKey('lastName', $response);
        $this->assertEquals('active_test@test.com', $response['email']);
    }

    public function testGetMeWithoutAuth(): void
    {
        $this->client->request('GET', '/api/me');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testUpdateProfileWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'PUT',
            '/api/me',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'firstName' => 'Updated',
                'lastName' => 'Name'
            ])
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Profile updated', $response['message']);
        $this->assertEquals('Updated', $response['user']['firstName']);
        $this->assertEquals('Name', $response['user']['lastName']);
    }

    public function testUpdateProfileWithInvalidEmail(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'PUT',
            '/api/me',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'email' => 'not-valid-email'
            ])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testUpdatePasswordWithWrongCurrentPassword(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'PUT',
            '/api/me/password',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'current_password' => 'wrongpassword',
                'new_password' => 'newpassword123'
            ])
        );

        $this->assertResponseStatusCodeSame(400);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Current password is incorrect', $response['message']);
    }

    public function testUpdatePasswordWithShortNewPassword(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'PUT',
            '/api/me/password',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'current_password' => 'password123',
                'new_password' => '123'
            ])
        );

        $this->assertResponseStatusCodeSame(400);
    }

    public function testUpdatePasswordWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'PUT',
            '/api/me/password',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ],
            json_encode([
                'current_password' => 'password123',
                'new_password' => 'newpassword123'
            ])
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertEquals('Password updated successfully', $response['message']);

        // Reset password back pour ne pas casser les autres tests
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $userRepo = $em->getRepository(User::class);
        $user = $userRepo->findOneBy(['email' => 'active_test@test.com']);
        $hasher = static::getContainer()->get('security.user_password_hasher');
        $user->setPassword($hasher->hashPassword($user, 'password123'));
        $em->flush();
        self::$staticToken = '';
    }

    // =====================
    // NOTIFICATIONS TESTS
    // =====================

    public function testGetNotificationsWithoutAuth(): void
    {
        $this->client->request('GET', '/api/notifications');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetNotificationsWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/notifications',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($response);
    }

    public function testGetUnreadCountWithAuth(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/notifications/unread-count',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('count', $response);
        $this->assertIsInt($response['count']);
    }

    public function testMarkAllNotificationsAsRead(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'PUT',
            '/api/notifications/read-all',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('message', $response);
    }

    public function testMarkSingleNotificationAsRead(): void
    {
        $token = $this->getAuthToken();

        $this->client->request(
            'GET',
            '/api/notifications',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $notifications = json_decode($this->client->getResponse()->getContent(), true);

        if (empty($notifications)) {
            $this->markTestSkipped('No notifications available for testing');
        }

        $notifId = $notifications[0]['id'];

        $this->client->request(
            'PUT',
            '/api/notifications/' . $notifId . '/read',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer ' . $token
            ]
        );

        $this->assertResponseStatusCodeSame(200);
        $response = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($response['notification']['isRead']);
    }

    // =====================
    // HELPER
    // =====================

    private function getAuthToken(): string
    {
        if (self::$staticToken !== '') {
            return self::$staticToken;
        }

        $em = static::getContainer()->get(EntityManagerInterface::class);
        $userRepo = $em->getRepository(User::class);
        $existingUser = $userRepo->findOneBy(['email' => 'active_test@test.com']);

        if (!$existingUser) {
            $hasher = static::getContainer()->get('security.user_password_hasher');
            $user = new User();
            $user->setEmail('active_test@test.com');
            $user->setFirstName('Active');
            $user->setLastName('Test');
            $user->setRoles(['ROLE_USER']);
            $user->setStatus('active');
            $user->setPassword($hasher->hashPassword($user, 'password123'));
            $em->persist($user);
            $em->flush();
        }

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'email' => 'active_test@test.com',
                'password' => 'password123'
            ])
        );

        $response = json_decode($this->client->getResponse()->getContent(), true);

        if (empty($response['token'])) {
            throw new \RuntimeException(
                'Could not retrieve JWT token. Login response: ' . json_encode($response)
            );
        }

        self::$staticToken = $response['token'];
        $this->client->restart();

        return self::$staticToken;
    }
}