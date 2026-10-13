<?php

namespace App\DTO;

use App\Validator\StrongPassword;
use Symfony\Component\Validator\Constraints as Assert;

class RegisterDTO
{
    #[Assert\NotBlank(message: 'Email is required')]
    #[Assert\Email(message: 'Email is invalid')]
    public string $email = '';

    #[StrongPassword]
    public string $password = '';

    public ?string $firstName = null;

    public ?string $lastName = null;

    public ?string $phone = null;

    public ?string $birthDate = null;

    #[Assert\Choice(
        choices: ['male', 'female', 'non-binary', 'prefer_not_to_say'],
        message: 'Invalid gender'
    )]
    public ?string $gender = null;

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : '';
        $dto->password = (string) ($data['password'] ?? '');
        $dto->firstName = !empty($data['firstName']) ? trim((string) $data['firstName']) : null;
        $dto->lastName = !empty($data['lastName']) ? trim((string) $data['lastName']) : null;
        $dto->phone = !empty($data['phone']) ? trim((string) $data['phone']) : null;
        $dto->birthDate = !empty($data['birthDate']) ? (string) $data['birthDate'] : null;
        $dto->gender = !empty($data['gender']) ? (string) $data['gender'] : null;

        return $dto;
    }
}
