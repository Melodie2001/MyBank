<?php

namespace App\Tests\Unit;

use App\Entity\User;
use App\Repository\OperationRepository;
use App\Service\ActivityLogService;
use App\Service\BalanceSnapshotService;
use Doctrine\ODM\MongoDB\DocumentManager;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

final class PersistenceFailureTest extends TestCase
{
    public function testLogFailureIsReportedWithoutLeakingTheExceptionMessage(): void
    {
        $dm = $this->createStub(DocumentManager::class);
        $dm->method('persist')->willThrowException(new \RuntimeException('Sensitive connection details'));
        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects(self::once())->method('error')->with('Activity log persistence failed', ['user_id'=>1,'action'=>'test','error_type'=>\RuntimeException::class]);
        (new ActivityLogService($dm,$logger))->log(1,'fiction@example.test','test');
    }
    public function testSnapshotFailureIsReportedAndDoesNotInterruptTheOperation(): void
    {
        $dm = $this->createStub(DocumentManager::class);
        $repository = $this->createStub(OperationRepository::class);
        $repository->method('findBy')->willThrowException(new \RuntimeException('Sensitive connection details'));
        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects(self::once())->method('error')->with('Balance snapshot persistence failed', ['user_id'=>null,'error_type'=>\RuntimeException::class]);
        (new BalanceSnapshotService($dm,$repository,$logger))->snapshot(new User());
    }
}
