<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260723093000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Align index names with Doctrine naming convention';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` RENAME INDEX uniq_user_google_id TO UNIQ_8D93D64976F5C865');
        $this->addSql('ALTER TABLE password_reset_token RENAME INDEX uniq_password_reset_token_token TO UNIQ_6B7BA4B65F37A13B');
        $this->addSql('ALTER TABLE password_reset_token RENAME INDEX idx_password_reset_token_user TO IDX_6B7BA4B6A76ED395');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` RENAME INDEX UNIQ_8D93D64976F5C865 TO uniq_user_google_id');
        $this->addSql('ALTER TABLE password_reset_token RENAME INDEX UNIQ_6B7BA4B65F37A13B TO uniq_password_reset_token_token');
        $this->addSql('ALTER TABLE password_reset_token RENAME INDEX IDX_6B7BA4B6A76ED395 TO idx_password_reset_token_user');
    }
}
