<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260617120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add phone and birth_date columns to user table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` ADD phone VARCHAR(20) DEFAULT NULL, ADD birth_date DATE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` DROP phone, DROP birth_date');
    }
}
