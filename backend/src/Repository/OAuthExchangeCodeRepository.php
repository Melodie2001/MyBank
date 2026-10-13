<?php

namespace App\Repository;

use App\Entity\OAuthExchangeCode;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<OAuthExchangeCode>
 */
class OAuthExchangeCodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OAuthExchangeCode::class);
    }
}
