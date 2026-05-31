FROM php:8.3-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev zip \
    && docker-php-ext-install intl pdo pdo_mysql zip opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --optimize-autoloader --no-dev

RUN php bin/console cache:clear --env=prod && \
    php bin/console cache:warmup --env=prod

EXPOSE 8000

CMD php -S 0.0.0.0:8000 -t public