#!/bin/bash
set -euo pipefail

PROJECT_DIR="/root/MyBank/backend"
BACKUP_DIR="/root/backups"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Load credentials from .env without executing it (strip CR in case of CRLF line endings)
MYSQL_ROOT_PASSWORD=$(grep -m1 '^MYSQL_ROOT_PASSWORD=' "$PROJECT_DIR/.env" | cut -d= -f2- | tr -d '\r')
MONGO_ROOT_USERNAME=$(grep -m1 '^MONGO_ROOT_USERNAME=' "$PROJECT_DIR/.env" | cut -d= -f2- | tr -d '\r')
MONGO_ROOT_PASSWORD=$(grep -m1 '^MONGO_ROOT_PASSWORD=' "$PROJECT_DIR/.env" | cut -d= -f2- | tr -d '\r')

echo "[$TIMESTAMP] Starting backup..."

docker exec mybank_database sh -c "exec mysqldump -uroot -p'$MYSQL_ROOT_PASSWORD' mybank" \
  | gzip > "$BACKUP_DIR/mysql_${TIMESTAMP}.sql.gz"
echo "MySQL dump: $BACKUP_DIR/mysql_${TIMESTAMP}.sql.gz"

docker exec mybank_mongodb sh -c "exec mongodump --username '$MONGO_ROOT_USERNAME' --password '$MONGO_ROOT_PASSWORD' --authenticationDatabase admin --db mybank_logs --archive" \
  | gzip > "$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"
echo "MongoDB dump: $BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"

find "$BACKUP_DIR" -name "mysql_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "mongo_*.archive.gz" -mtime +$RETENTION_DAYS -delete

echo "[$TIMESTAMP] Backup done. Retention: ${RETENTION_DAYS} days."
