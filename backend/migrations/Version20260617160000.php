<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260617160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create notification table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notification (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message LONGTEXT NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            related_id INT DEFAULT NULL,
            INDEX IDX_BF5476CAA76ED395 (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');

        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_notification_user FOREIGN KEY (user_id) REFERENCES `user` (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_notification_user');
        $this->addSql('DROP TABLE notification');
    }
}
