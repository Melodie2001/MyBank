#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ -f certbot/duckdns.ini ]; then
    certbot_service=certbot-dns
else
    certbot_service=certbot
fi

docker compose run --rm "$certbot_service" renew --quiet
docker compose exec -T proxy nginx -t
docker compose kill -s HUP proxy
