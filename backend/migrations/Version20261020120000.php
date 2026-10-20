<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261020120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Activate accounts still awaiting approval when switching to immediate registration';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("UPDATE user SET status = 'active' WHERE status = 'pending'");
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Previously pending accounts cannot be distinguished from other active accounts.');
    }
}
