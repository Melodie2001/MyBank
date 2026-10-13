<?php

namespace App\DTO;

use App\Validator\StrongPassword;
use Symfony\Component\Validator\Constraints as Assert;

class ChangePasswordDTO
{
    #[Assert\NotBlank(message: 'Current password is required')]
    public string $currentPassword = '';

    #[StrongPassword]
    public string $newPassword = '';

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->currentPassword = (string) ($data['current_password'] ?? $data['currentPassword'] ?? '');
        $dto->newPassword = (string) ($data['new_password'] ?? $data['newPassword'] ?? '');

        return $dto;
    }
}
