#!/bin/bash
set -euo pipefail
umask 077
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/../backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"
docker compose exec -T database sh -c 'exec mysqldump --single-transaction --no-tablespaces -uroot -p"$MYSQL_ROOT_PASSWORD" mybank' | gzip > "$BACKUP_DIR/mysql_${TIMESTAMP}.sql.gz"
docker compose exec -T mongodb sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db mybank_logs --archive' | gzip > "$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"
gzip -t "$BACKUP_DIR/mysql_${TIMESTAMP}.sql.gz" "$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"
echo "Backups checked: $BACKUP_DIR ($TIMESTAMP)"
