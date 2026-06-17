<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class NotificationController extends AbstractController
{
    #[Route('/api/notifications', methods: ['GET'])]
    public function index(NotificationRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $notifications = $repository->findBy(
            ['user' => $user],
            ['createdAt' => 'DESC']
        );

        return $this->json(array_map([$this, 'format'], $notifications));
    }

    #[Route('/api/notifications/unread-count', methods: ['GET'])]
    public function unreadCount(NotificationRepository $repository): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $count = $repository->count(['user' => $user, 'isRead' => false]);

        return $this->json(['count' => $count]);
    }

    #[Route('/api/notifications/read-all', methods: ['PUT'])]
    public function readAll(NotificationRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $notifications = $repository->findBy(['user' => $user, 'isRead' => false]);
        foreach ($notifications as $notif) {
            $notif->setIsRead(true);
        }
        $em->flush();

        return $this->json(['message' => 'All notifications marked as read']);
    }

    #[Route('/api/notifications/{id}/read', methods: ['PUT'])]
    public function markRead(int $id, NotificationRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $notif = $repository->find($id);

        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Not found'], 404);
        }

        $notif->setIsRead(true);
        $em->flush();

        return $this->json($this->format($notif));
    }

    #[Route('/api/notifications/{id}', methods: ['DELETE'])]
    public function delete(int $id, NotificationRepository $repository, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $notif = $repository->find($id);

        if (!$notif || $notif->getUser()->getId() !== $user->getId()) {
            return $this->json(['message' => 'Not found'], 404);
        }

        $em->remove($notif);
        $em->flush();

        return $this->json(['message' => 'Deleted']);
    }

    private function format(Notification $n): array
    {
        return [
            'id'        => $n->getId(),
            'type'      => $n->getType(),
            'title'     => $n->getTitle(),
            'message'   => $n->getMessage(),
            'isRead'    => $n->isRead(),
            'createdAt' => $n->getCreatedAt()->format('Y-m-d H:i:s'),
            'relatedId' => $n->getRelatedId(),
        ];
    }
}
