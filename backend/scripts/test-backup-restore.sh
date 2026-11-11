#!/bin/bash
# Restore only into disposable, network-isolated containers. Never targets Compose services.
set -euo pipefail
umask 077
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/../backups}"
TIMESTAMP="${1:?Usage: bash scripts/test-backup-restore.sh YYYYMMDD_HHMMSS}"
[[ "$TIMESTAMP" =~ ^[0-9]{8}_[0-9]{6}$ ]] || { echo 'Invalid backup timestamp' >&2; exit 1; }
MYSQL_BACKUP="$BACKUP_DIR/mysql_${TIMESTAMP}.sql.gz"
MONGO_BACKUP="$BACKUP_DIR/mongo_${TIMESTAMP}.archive.gz"
gzip -t "$MYSQL_BACKUP" "$MONGO_BACKUP"
MYSQL_IMAGE="${MYSQL_RESTORE_IMAGE:-mysql:8.0}"
MONGO_IMAGE="${MONGO_RESTORE_IMAGE:-mongo:7}"
# Fetch before starting containers so a failed pull cannot leave a partial test running.
docker image inspect "$MYSQL_IMAGE" >/dev/null 2>&1 || docker pull "$MYSQL_IMAGE"
docker image inspect "$MONGO_IMAGE" >/dev/null 2>&1 || docker pull "$MONGO_IMAGE"
MYSQL_ID=''
MONGO_ID=''
cleanup() {
    if [ -n "$MYSQL_ID" ]; then docker rm -fv "$MYSQL_ID" >/dev/null; fi
    if [ -n "$MONGO_ID" ]; then docker rm -fv "$MONGO_ID" >/dev/null; fi
}
trap cleanup EXIT
MYSQL_ID="$(docker run -d --network none --env MYSQL_ALLOW_EMPTY_PASSWORD=yes --env MYSQL_DATABASE=mybank "$MYSQL_IMAGE")"
MONGO_ID="$(docker run -d --network none "$MONGO_IMAGE" --bind_ip 127.0.0.1)"
ready=false
for ((attempt=0; attempt<120; attempt++)); do
    if docker exec "$MYSQL_ID" sh -c '[ "$(cat /proc/1/comm)" = mysqld ]' >/dev/null 2>&1 &&
       docker exec "$MYSQL_ID" mysql -uroot -Nse 'SELECT 1' mybank >/dev/null 2>&1 &&
       docker exec "$MONGO_ID" mongosh --quiet --eval 'quit(db.adminCommand({ping:1}).ok === 1 ? 0 : 1)' >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 2
done
"$ready" || { echo 'Temporary databases did not become ready' >&2; exit 1; }
gzip -dc "$MYSQL_BACKUP" | docker exec -i "$MYSQL_ID" mysql -uroot mybank
gzip -dc "$MONGO_BACKUP" | docker exec -i "$MONGO_ID" mongorestore --archive --nsInclude='mybank_logs.*'
TABLE_COUNT="$(docker exec "$MYSQL_ID" mysql -uroot -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='mybank' AND table_type='BASE TABLE'")"
[[ "$TABLE_COUNT" =~ ^[0-9]+$ ]] && ((TABLE_COUNT > 0)) || { echo 'MySQL restore contains no tables' >&2; exit 1; }
CHECK_SQL="$(docker exec "$MYSQL_ID" mysql -uroot -Nse "SELECT CONCAT('CHECK TABLE ', CHAR(96), 'mybank', CHAR(96), '.', CHAR(96), REPLACE(table_name, CHAR(96), CONCAT(CHAR(96), CHAR(96))), CHAR(96), ';') FROM information_schema.tables WHERE table_schema='mybank' AND table_type='BASE TABLE'")"
docker exec "$MYSQL_ID" mysql -uroot -Nse "$CHECK_SQL" | awk -F '\t' '
    { print }
    $3 == "error" || ($3 == "status" && $4 != "OK") { failed = 1 }
    $3 == "status" { checked++ }
    END { if (failed || checked == 0) exit 1 }
'
docker exec "$MONGO_ID" mongosh --quiet mybank_logs --eval 'for (const name of db.getCollectionNames()) { const result = db.runCommand({validate:name}); if (!result.ok || !result.valid) { throw new Error("Invalid collection: " + name); } print(name + ": " + db.getCollection(name).countDocuments({}) + " documents"); }'
echo "Restore test passed: $TIMESTAMP ($TABLE_COUNT MySQL tables). Temporary databases will be removed."
