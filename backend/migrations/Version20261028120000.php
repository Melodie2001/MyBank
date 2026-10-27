<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261028120000 extends AbstractMigration
{
    public function getDescription(): string { return 'Classify catalog categories without changing historical operations or balances'; }
    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE category ADD operation_type VARCHAR(10) DEFAULT 'expense' NOT NULL");
        // Preserve unknown personal categories as mixed; classify the existing shared catalog.
        $this->addSql("UPDATE category SET operation_type = CASE WHEN LOWER(TRIM(name)) IN ('salaire', 'salary') THEN 'income' WHEN LOWER(TRIM(name)) IN ('autre', 'autres', 'other', 'others') THEN 'both' ELSE 'expense' END WHERE shared = 1");
        $this->addSql("UPDATE category SET operation_type = 'both' WHERE shared = 0");
    }
    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE category DROP operation_type');
    }
}
