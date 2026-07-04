<?php
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'app' => 'docker-php-apache', 'php' => PHP_VERSION]);
