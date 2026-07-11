<?php

namespace App\Tests\Unit;

use Nelmio\CorsBundle\DependencyInjection\NelmioCorsExtension;
use PHPUnit\Framework\TestCase;
use Symfony\Bundle\FrameworkBundle\DependencyInjection\Configuration as FrameworkConfiguration;
use Symfony\Component\Config\Definition\Processor;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Yaml\Yaml;

final class HttpsConfigurationTest extends TestCase
{
    public function testCorsAllowsOnlyExpectedProductionAndDevelopmentOrigins(): void
    {
        $rawConfig = Yaml::parseFile(dirname(__DIR__, 2).'/config/packages/nelmio_cors.yaml')['nelmio_cors'];
        $container = new ContainerBuilder();
        (new NelmioCorsExtension())->load([$rawConfig], $container);

        $patterns = $container->getParameter('nelmio_cors.defaults')['allow_origin'];

        foreach ([
            'https://nexo-finance.duckdns.org',
            'https://nexo-finance-admin.duckdns.org',
            'http://localhost:5173',
            'http://127.0.0.1:5174',
        ] as $origin) {
            self::assertTrue($this->matchesOnePattern($origin, $patterns), sprintf('Expected "%s" to be allowed.', $origin));
        }

        foreach ([
            'http://nexo-finance.duckdns.org',
            'https://nexo-finance-api.duckdns.org',
            'https://nexo-finance.duckdns.org.evil.example',
            'http://49.13.95.73:5173',
        ] as $origin) {
            self::assertFalse($this->matchesOnePattern($origin, $patterns), sprintf('Expected "%s" to be rejected.', $origin));
        }
    }

    public function testDockerProxyHeadersAreTrusted(): void
    {
        $rawConfig = Yaml::parseFile(dirname(__DIR__, 2).'/config/packages/framework.yaml')['framework'];
        $config = (new Processor())->processConfiguration(new FrameworkConfiguration(true), [$rawConfig]);

        self::assertStringContainsString('172.16.0.0/12', $config['trusted_proxies']);
        self::assertSame(
            ['x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port'],
            $config['trusted_headers'],
        );
    }

    public function testComposePublishesOnlyTheReverseProxy(): void
    {
        $compose = Yaml::parseFile(dirname(__DIR__, 2).'/docker-compose.yaml')['services'];

        self::assertSame(['80:80', '443:443'], $compose['proxy']['ports']);
        self::assertSame('nexo-finance.duckdns.org', $compose['proxy']['environment']['USER_DOMAIN']);
        self::assertSame('nexo-finance-admin.duckdns.org', $compose['proxy']['environment']['ADMIN_DOMAIN']);
        self::assertSame('nexo-finance-api.duckdns.org', $compose['proxy']['environment']['API_DOMAIN']);
        self::assertSame(
            'https://nexo-finance-api.duckdns.org',
            $compose['backend']['environment']['DEFAULT_URI'],
        );
        self::assertSame(
            ['./.env:/var/www/html/.env:ro', './config/jwt:/var/www/html/config/jwt:ro'],
            $compose['backend']['volumes'],
        );

        foreach (['backend', 'frontend', 'frontend-admin', 'database', 'phpmyadmin', 'mongodb', 'mongo-express'] as $service) {
            foreach ($compose[$service]['ports'] as $port) {
                self::assertStringStartsWith('127.0.0.1:', $port, sprintf('%s must not bind a public host port.', $service));
            }
        }
    }

    public function testDockerBuildContextExcludesRuntimeSecrets(): void
    {
        $patterns = file(
            dirname(__DIR__, 2).'/.dockerignore',
            FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES,
        );

        self::assertContains('.env*', $patterns);
        self::assertContains('config/jwt/*.pem', $patterns);
        self::assertContains('certbot', $patterns);
    }

    /** @param list<string> $patterns */
    private function matchesOnePattern(string $origin, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (1 === preg_match('{'.$pattern.'}i', $origin)) {
                return true;
            }
        }

        return false;
    }
}
