<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260529005535 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE operation ADD category_id INT NOT NULL, ADD user_id INT NOT NULL, CHANGE amount amount DOUBLE PRECISION NOT NULL');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66D12469DE2 FOREIGN KEY (category_id) REFERENCES category (id)');
        $this->addSql('ALTER TABLE operation ADD CONSTRAINT FK_1981A66DA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_1981A66D12469DE2 ON operation (category_id)');
        $this->addSql('CREATE INDEX IDX_1981A66DA76ED395 ON operation (user_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE operation DROP FOREIGN KEY FK_1981A66D12469DE2');
        $this->addSql('ALTER TABLE operation DROP FOREIGN KEY FK_1981A66DA76ED395');
        $this->addSql('DROP INDEX IDX_1981A66D12469DE2 ON operation');
        $this->addSql('DROP INDEX IDX_1981A66DA76ED395 ON operation');
        $this->addSql('ALTER TABLE operation DROP category_id, DROP user_id, CHANGE amount amount DATE NOT NULL');
    }
}
