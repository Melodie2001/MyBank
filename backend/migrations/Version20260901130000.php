<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Create refresh_tokens (GesdinetJWTRefreshTokenBundle) and oauth_exchange_code
 * (one-time code for the OAuth callback flow).
 *
 * Index names and column definitions follow what the current Doctrine DBAL
 * emits, so doctrine:schema:validate stays clean for these tables.
 */
final class Version20260901130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create refresh_tokens and oauth_exchange_code tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE refresh_tokens (
            id INT AUTO_INCREMENT NOT NULL,
            refresh_token VARCHAR(128) NOT NULL,
            username VARCHAR(255) NOT NULL,
            valid DATETIME NOT NULL,
            UNIQUE INDEX UNIQ_9BACE7E1C74F2195 (refresh_token),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE oauth_exchange_code (
            id INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            code_hash VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL,
            used_at DATETIME DEFAULT NULL,
            UNIQUE INDEX UNIQ_D338C6CAE7530879 (code_hash),
            INDEX IDX_D338C6CAA76ED395 (user_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE oauth_exchange_code ADD CONSTRAINT FK_D338C6CAA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE oauth_exchange_code DROP FOREIGN KEY FK_D338C6CAA76ED395');
        $this->addSql('DROP TABLE oauth_exchange_code');
        $this->addSql('DROP TABLE refresh_tokens');
    }
}
