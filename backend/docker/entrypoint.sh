#!/bin/sh
set -eu
mkdir -p var/cache var/log
chown -R www-data:www-data var
exec docker-php-entrypoint "$@"
