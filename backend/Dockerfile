FROM php:8.3-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev zip libssl-dev autoconf pkg-config nginx supervisor curl \
    && docker-php-ext-install intl pdo pdo_mysql zip opcache \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --optimize-autoloader --no-dev --no-scripts

COPY docker/nginx.conf /etc/nginx/sites-enabled/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/nexo.conf
COPY docker/entrypoint.sh /usr/local/bin/nexo-entrypoint
RUN chmod +x /usr/local/bin/nexo-entrypoint

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=3 CMD curl --fail --silent http://127.0.0.1:8000/health || exit 1
ENTRYPOINT ["/usr/local/bin/nexo-entrypoint"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]
