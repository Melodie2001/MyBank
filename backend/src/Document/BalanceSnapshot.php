<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'balance_snapshots')]
#[ODM\Index(keys: ['userId' => 'asc', 'snapshotDate' => 'desc'])]
class BalanceSnapshot
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'int')]
    private int $userId = 0;

    #[ODM\Field(type: 'float')]
    private float $balance = 0.0;

    #[ODM\Field(type: 'float')]
    private float $totalIncome = 0.0;

    #[ODM\Field(type: 'float')]
    private float $totalExpenses = 0.0;

    #[ODM\Field(type: 'date_immutable')]
    private \DateTimeImmutable $snapshotDate;

    public function __construct()
    {
        $this->snapshotDate = new \DateTimeImmutable();
    }

    public function getId(): ?string { return $this->id; }

    public function getUserId(): int { return $this->userId; }
    public function setUserId(int $userId): static { $this->userId = $userId; return $this; }

    public function getBalance(): float { return $this->balance; }
    public function setBalance(float $balance): static { $this->balance = $balance; return $this; }

    public function getTotalIncome(): float { return $this->totalIncome; }
    public function setTotalIncome(float $totalIncome): static { $this->totalIncome = $totalIncome; return $this; }

    public function getTotalExpenses(): float { return $this->totalExpenses; }
    public function setTotalExpenses(float $totalExpenses): static { $this->totalExpenses = $totalExpenses; return $this; }

    public function getSnapshotDate(): \DateTimeImmutable { return $this->snapshotDate; }
    public function setSnapshotDate(\DateTimeImmutable $snapshotDate): static { $this->snapshotDate = $snapshotDate; return $this; }
}
