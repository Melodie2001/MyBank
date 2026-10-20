<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261020143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Restore missing accents in the initial health and education category names';
    }

    public function up(Schema $schema): void
    {
        // Match only the malformed seeded labels; preserve category IDs and links.
        // UTF-8 bytes keep the repair independent of terminal character encoding.
        $this->addSql("UPDATE category SET name = CONCAT('Sant', CONVERT(0xC3A9 USING utf8mb4)) WHERE BINARY name = 'Sant' AND icon = 'healthcare.png'");
        $this->addSql("UPDATE category SET name = CONCAT(CONVERT(0xC389 USING utf8mb4), 'tudes') WHERE BINARY name = 'tudes' AND icon = 'books.png'");
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Correct category names must not be reverted to malformed labels.');
    }
}
