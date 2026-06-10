<?php

namespace App\Tests\Integration;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Doctrine\ORM\EntityManagerInterface;

class ApiIntegrationTest extends WebTestCase
{
    private $client;
    private string $token = '';

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
        // Premier enregistrement
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

        // Deuxième enregistrement avec le même email
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

        // Récupérer une catégorie existante
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

        // Créer une opération
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
    // HELPER
    // =====================

    private function getAuthToken(): string
    {
        if ($this->token) {
            return $this->token;
        }

        // Créer un user actif pour les tests
        $em = static::getContainer()->get(EntityManagerInterface::class);

        $userRepo = $em->getRepository(\App\Entity\User::class);
        $existingUser = $userRepo->findOneBy(['email' => 'active_test@test.com']);

        if (!$existingUser) {
            $hasher = static::getContainer()->get('security.user_password_hasher');
            $user = new \App\Entity\User();
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
        $this->token = $response['token'] ?? '';

        return $this->token;
    }
}