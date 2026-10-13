<?php

namespace App\DTO;

use App\Validator\StrongPassword;
use Symfony\Component\Validator\Constraints as Assert;

class ResetPasswordDTO
{
    #[Assert\NotBlank(message: 'Token is required')]
    public string $token = '';

    #[StrongPassword]
    public string $newPassword = '';

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->token = (string) ($data['token'] ?? '');
        $dto->newPassword = (string) ($data['newPassword'] ?? '');

        return $dto;
    }
}
