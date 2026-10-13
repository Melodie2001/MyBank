<?php

namespace App\Tests\Integration;

use App\Document\BalanceSnapshot;
use App\Entity\User;
use Doctrine\ODM\MongoDB\DocumentManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AnalyticsHistoryTest extends WebTestCase
{
    public function testHistoryKeepsLatestNinetySnapshotsInChronologicalOrder(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $dm = static::getContainer()->get(DocumentManager::class);
        $user = (new User())->setEmail('history_'.bin2hex(random_bytes(8)).'@example.test')->setStatus('active')->setRoles(['ROLE_USER']);
        $em->persist($user); $em->flush(); $id = $user->getId();
        try {
            for ($i=100; $i>=1; --$i) {
                $dm->persist((new BalanceSnapshot())->setUserId($id)->setBalance($i)->setSnapshotDate(new \DateTimeImmutable('-'.$i.' days')));
            }
            $dm->flush();
            $token = static::getContainer()->get('lexik_jwt_authentication.jwt_manager')->create($user);
            $client->request('GET','/api/balance-history',[],[],['HTTP_AUTHORIZATION'=>'Bearer '.$token]);
            self::assertResponseIsSuccessful();
            $data = json_decode($client->getResponse()->getContent(),true);
            self::assertCount(90,$data);
            self::assertSame((new \DateTimeImmutable('-90 days'))->format('Y-m-d'),$data[0]['date']);
            self::assertSame((new \DateTimeImmutable('-1 day'))->format('Y-m-d'),$data[89]['date']);
        } finally {
            $dm->createQueryBuilder(BalanceSnapshot::class)->remove()->field('userId')->equals($id)->getQuery()->execute();
            $em->getConnection()->delete('user',['id'=>$id]);
        }
    }
}
