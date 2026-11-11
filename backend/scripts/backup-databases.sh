#!/bin/bash
set -euo pipefail
umask 077
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/../backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
WORK_DIR="$(mktemp -d "$BACKUP_DIR/.backup-${TIMESTAMP}-XXXXXX")"
trap 'rm -rf -- "$WORK_DIR"' EXIT
cd "$PROJECT_DIR"
docker compose exec -T database sh -c 'export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"; exec mysqldump --single-transaction --no-tablespaces -uroot mybank' | gzip > "$WORK_DIR/mysql.sql.gz"
docker compose exec -T mongodb sh -c 'exec mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db mybank_logs --archive' | gzip > "$WORK_DIR/mongo.archive.gz"
gzip -t "$WORK_DIR/mysql.sql.gz" "$WORK_DIR/mongo.archive.gz"
mv "$WORK_DIR/mysql.sql.gz" "$BACKUP_DIR/mysql_${TIMESTAMP}.sql.gz"
mv "$WORK_DIR/mongo.archive.gz" "$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"
echo "Backups checked: $BACKUP_DIR ($TIMESTAMP)"
# Prune only recognised archive names, after a new complete backup succeeded.
find "$BACKUP_DIR" -maxdepth 1 -type f -mtime +29 \( -name 'mysql_????????_??????.sql.gz' -o -name 'mongo_????????_??????.archive.gz' \) -print -delete
