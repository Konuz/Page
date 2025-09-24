<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const CMS_CSRF_SESSION_KEY = 'cms_csrf_tokens';
const CMS_CSRF_TOKEN_LENGTH = 32;
const CMS_CSRF_TTL = 7200; // 2 godziny

function cms_csrf_token(): string
{
    if (!isset($_SESSION[CMS_CSRF_SESSION_KEY])) {
        $_SESSION[CMS_CSRF_SESSION_KEY] = [];
    }

    $token = bin2hex(random_bytes(CMS_CSRF_TOKEN_LENGTH));
    $_SESSION[CMS_CSRF_SESSION_KEY][$token] = time();

    // Usuń przedawnione tokeny
    foreach ($_SESSION[CMS_CSRF_SESSION_KEY] as $storedToken => $createdAt) {
        if ($createdAt + CMS_CSRF_TTL < time()) {
            unset($_SESSION[CMS_CSRF_SESSION_KEY][$storedToken]);
        }
    }

    return $token;
}

function cms_csrf_verify(?string $token): bool
{
    if (!$token || !isset($_SESSION[CMS_CSRF_SESSION_KEY][$token])) {
        return false;
    }

    $createdAt = $_SESSION[CMS_CSRF_SESSION_KEY][$token];
    unset($_SESSION[CMS_CSRF_SESSION_KEY][$token]);

    return ($createdAt + CMS_CSRF_TTL) >= time();
}

function cms_csrf_field(): string
{
    $token = cms_csrf_token();
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars($token, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '">';
}

function cms_assert_csrf(): void
{
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    if (!cms_csrf_verify(is_string($token) ? $token : null)) {
        cms_log('CSRF token validation failed', ['ip' => cms_client_ip()], 'security');
        cms_abort(419, 'CSRF token mismatch');
    }
}
