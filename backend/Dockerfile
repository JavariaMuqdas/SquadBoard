   FROM serversideup/php:8.3-fpm-nginx
# Speed up PHP, and on every start: cache config/routes/views + run migrations
ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true

COPY --chown=www-data:www-data . /var/www/html

RUN composer install --no-dev --optimize-autoloader --no-interaction