<?php

namespace App\Entity;

use App\Repository\CategoryRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CategoryRepository::class)]
#[ORM\Index(name: 'IDX_CATEGORY_OWNER', fields: ['owner'])]
#[ORM\UniqueConstraint(name: 'UNIQ_CATEGORY_OWNER_NAME', fields: ['owner', 'name'])]
class Category
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(length: 255)]
    private ?string $icon = null;

    #[ORM\Column(length: 50)]
    private ?string $color = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $owner = null;

    #[ORM\Column(options: ['default' => true])]
    private bool $shared = true;

    #[ORM\Column(name: 'operation_type', length: 10, options: ['default' => 'expense'])]
    private string $type = 'expense';

    public function getType(): string { return $this->type; }
    public function setType(string $type): static
    {
        if (!in_array($type, ['income', 'expense', 'both'], true)) {
            throw new \InvalidArgumentException('Invalid category type');
        }
        $this->type = $type;
        return $this;
    }
    public function accepts(string $operationType): bool
    {
        return in_array($operationType, ['income', 'expense'], true) && ($this->type === 'both' || $this->type === $operationType);
    }

    public function getOwner(): ?User { return $this->owner; }
    public function setOwner(?User $owner): static { $this->owner = $owner; return $this; }
    public function isShared(): bool { return $this->shared; }
    public function setShared(bool $shared): static { $this->shared = $shared; return $this; }
    public function isAvailableTo(?User $user): bool
    {
        return $this->shared || ($user !== null && $this->owner !== null && $this->owner->getId() !== null && $this->owner->getId() === $user->getId());
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function setIcon(string $icon): static
    {
        $this->icon = $icon;
        return $this;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(string $color): static
    {
        $this->color = $color;
        return $this;
    }
}
