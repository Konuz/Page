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

    require_once __DIR__ . '/helpers.php';
}
