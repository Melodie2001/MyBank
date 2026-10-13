<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260723090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Make user.password nullable and add user.google_id for Google OAuth accounts';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` CHANGE password password VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE `user` ADD google_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE `user` ADD UNIQUE INDEX UNIQ_user_google_id (google_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` DROP INDEX UNIQ_user_google_id');
        $this->addSql('ALTER TABLE `user` DROP google_id');
        $this->addSql('ALTER TABLE `user` CHANGE password password VARCHAR(255) NOT NULL');
    }
}
