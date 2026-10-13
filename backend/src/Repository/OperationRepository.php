<?php

namespace App\Repository;

use App\Entity\Operation;
use App\Entity\Category;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Operation>
 */
class OperationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Operation::class);
    }

    public function monthlyExpenses(User $user, Category $category, \DateTimeImmutable $monthStart): float
    {
        return round((float) $this->createQueryBuilder('o')
            ->select('COALESCE(SUM(o.amount), 0)')
            ->where('o.user = :user AND o.category = :category AND o.type = :type')
            ->andWhere('o.date >= :start AND o.date < :end')
            ->setParameter('user', $user)->setParameter('category', $category)
            ->setParameter('type', 'expense')->setParameter('start', $monthStart)
            ->setParameter('end', $monthStart->modify('+1 month'))
            ->getQuery()->getSingleScalarResult(), 2);
    }

//    /**
//     * @return Operation[] Returns an array of Operation objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('o.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Operation
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
