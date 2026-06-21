FROM php:8.3-cli

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev zip libssl-dev autoconf pkg-config \
    && docker-php-ext-install intl pdo pdo_mysql zip opcache \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

RUN composer install --optimize-autoloader --no-dev --no-scripts

EXPOSE 8000

CMD php -S 0.0.0.0:8000 -t public
