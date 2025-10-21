<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const CMS_SESSION_KEY = 'cms_admin';
const CMS_LOGIN_ATTEMPTS_FILE = 'login-attempts.json';

function cms_is_logged_in(): bool
{
    return !empty($_SESSION[CMS_SESSION_KEY]['authenticated']);
}

function cms_require_login(): void
{
    if (!cms_is_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

function cms_logout(): void
{
    $username = $_SESSION[CMS_SESSION_KEY]['username'] ?? null;
    $_SESSION[CMS_SESSION_KEY] = [];
    session_regenerate_id(true);
    cms_log('User logged out', ['user' => $username], 'auth');
}

function cms_login(string $username, string $password): bool
{
    if (cms_is_login_locked()) {
        return false;
    }

    $hash = cms_config('security.admin_password_hash');
    if (!$hash || !password_verify($password, $hash)) {
        cms_register_login_attempt(false);
        cms_log('Failed login attempt', ['ip' => cms_client_ip(), 'user' => $username], 'auth');
        return false;
    }

    cms_register_login_attempt(true);

    session_regenerate_id(true);
    $_SESSION[CMS_SESSION_KEY] = [
        'authenticated' => true,
        'username' => $username ?: 'admin',
        'login_time' => cms_now()->format(DateTimeInterface::ATOM),
        'ip' => cms_client_ip(),
    ];

    cms_log('Successful login', ['user' => $_SESSION[CMS_SESSION_KEY]['username'], 'ip' => cms_client_ip()], 'auth');

    return true;
}

function cms_is_login_locked(): bool
{
    $attempts = cms_load_login_attempts();
    $ip = cms_client_ip();
    if (!isset($attempts[$ip])) {
        return false;
    }

    $data = $attempts[$ip];
    $maxAttempts = (int) cms_config('security.max_login_attempts', 5);
    $cooldown = (int) cms_config('security.login_cooldown_seconds', 900);

    if (($data['count'] ?? 0) < $maxAttempts) {
        return false;
    }

    $last = isset($data['last']) ? strtotime($data['last']) : 0;
    if (!$last) {
        return false;
    }

    return ($last + $cooldown) > time();
}

function cms_login_lock_remaining_seconds(): int
{
    $attempts = cms_load_login_attempts();
    $ip = cms_client_ip();
    if (!isset($attempts[$ip])) {
        return 0;
    }

    $data = $attempts[$ip];
    $cooldown = (int) cms_config('security.login_cooldown_seconds', 900);
    $last = isset($data['last']) ? strtotime($data['last']) : 0;

    $remaining = ($last + $cooldown) - time();
    return $remaining > 0 ? $remaining : 0;
}

function cms_register_login_attempt(bool $success): void
{
    $attempts = cms_load_login_attempts();
    $ip = cms_client_ip();

    if ($success) {
        unset($attempts[$ip]);
    } else {
        $record = $attempts[$ip] ?? ['count' => 0, 'last' => null];
        $record['count'] = ($record['count'] ?? 0) + 1;
        $record['last'] = cms_now()->format(DateTimeInterface::ATOM);
        $attempts[$ip] = $record;
    }

    cms_save_login_attempts($attempts);
}

function cms_client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function cms_load_login_attempts(): array
{
    $path = cms_path('tmp', CMS_LOGIN_ATTEMPTS_FILE);
    if (!file_exists($path)) {
        return [];
    }

    $json = file_get_contents($path);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function cms_save_login_attempts(array $attempts): void
{
    $path = cms_path('tmp', CMS_LOGIN_ATTEMPTS_FILE);
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }

    $fp = fopen($path, 'c+');
    if (!$fp) {
        throw new RuntimeException('Unable to persist login attempts');
    }

    try {
        if (!flock($fp, LOCK_EX)) {
            throw new RuntimeException('Unable to lock login attempts file');
        }
        ftruncate($fp, 0);
        fwrite($fp, json_encode($attempts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    } finally {
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}
