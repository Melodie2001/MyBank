<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'activity_logs')]
#[ODM\Index(keys: ['userId' => 'asc', 'createdAt' => 'desc'])]
class ActivityLog
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'int')]
    private int $userId = 0;

    #[ODM\Field(type: 'string')]
    private string $userEmail = '';

    #[ODM\Field(type: 'string')]
    private string $actionType = '';

    #[ODM\Field(type: 'raw')]
    private array $details = [];

    #[ODM\Field(type: 'date_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?string { return $this->id; }

    public function getUserId(): int { return $this->userId; }
    public function setUserId(int $userId): static { $this->userId = $userId; return $this; }

    public function getUserEmail(): string { return $this->userEmail; }
    public function setUserEmail(string $userEmail): static { $this->userEmail = $userEmail; return $this; }

    public function getActionType(): string { return $this->actionType; }
    public function setActionType(string $actionType): static { $this->actionType = $actionType; return $this; }

    public function getDetails(): array { return $this->details; }
    public function setDetails(array $details): static { $this->details = $details; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
}
