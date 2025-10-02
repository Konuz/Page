<?php

declare(strict_types=1);

if (!defined('CMS_BOOTSTRAPPED')) {
    define('CMS_BOOTSTRAPPED', true);

    $configPath = dirname(__DIR__, 2) . '/config/config.php';
    if (!file_exists($configPath)) {
        throw new RuntimeException('Missing configuration file: config/config.php');
    }

    $GLOBALS['CMS_CONFIG'] = require $configPath;

    $sessionName = $GLOBALS['CMS_CONFIG']['app']['session_name'] ?? 'toolshare_admin';
    if (session_status() === PHP_SESSION_NONE) {
        session_name($sessionName);

        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        session_start();
    }

    // Ustaw bezpieczne nagłówki HTTP
    header("X-Frame-Options: DENY");
    header("X-Content-Type-Options: nosniff");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");
    header("Permissions-Policy: geolocation=(), microphone=(), camera=()");

    // Content Security Policy
    $csp = [
        "default-src 'self' blob:",
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ];
    header("Content-Security-Policy: " . implode("; ", $csp));

    require_once __DIR__ . '/helpers.php';
}
