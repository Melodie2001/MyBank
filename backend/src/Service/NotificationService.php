<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class NotificationService
{
    public function __construct(private readonly EntityManagerInterface $em) {}

    public function create(
        User $user,
        string $type,
        string $title,
        string $message,
        ?int $relatedId = null
    ): Notification {
        $notif = new Notification();
        $notif->setUser($user);
        $notif->setType($type);
        $notif->setTitle($title);
        $notif->setMessage($message);
        $notif->setRelatedId($relatedId);
        $this->em->persist($notif);
        return $notif;
    }
}
