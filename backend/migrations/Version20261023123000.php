<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261023123000 extends AbstractMigration
{
    public function getDescription(): string { return 'Add private user-owned categories while retaining the shared catalog'; }
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE category ADD owner_id INT DEFAULT NULL, ADD shared TINYINT(1) DEFAULT 1 NOT NULL');
        $this->addSql('CREATE INDEX IDX_CATEGORY_OWNER ON category (owner_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_CATEGORY_OWNER_NAME ON category (owner_id, name)');
        $this->addSql('ALTER TABLE category ADD CONSTRAINT FK_CATEGORY_OWNER FOREIGN KEY (owner_id) REFERENCES user (id) ON DELETE SET NULL');
    }
    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigrationException('Removing category ownership would expose private categories.');
    }
}
