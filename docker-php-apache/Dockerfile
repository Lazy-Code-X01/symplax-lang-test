# Single-stage PHP on Apache, serving on port 80 (tests non-3000/8000 port detection).
FROM php:8.2-apache
WORKDIR /var/www/html
COPY . .
EXPOSE 80
CMD ["apache2-foreground"]
