#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose config --quiet
docker compose build backend frontend frontend-admin proxy
# Failed migrations leave the API stopped for explicit recovery.
docker compose stop backend
bash scripts/backup-databases.sh
docker compose run --rm --no-deps backend php bin/console doctrine:migrations:migrate --env=prod --no-interaction
docker compose up -d --no-deps --wait --wait-timeout 120 backend frontend frontend-admin proxy
docker compose exec -T backend curl --fail --silent http://127.0.0.1:8000/health
docker compose exec -T proxy nginx -t
for service in frontend frontend-admin; do
    docker compose exec -T "$service" wget -q -O /dev/null http://127.0.0.1/
done
echo 'Deployment checks passed. Run the public-site acceptance checks.'
