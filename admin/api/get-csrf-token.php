<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/api.php';

cms_require_login();

// Wygeneruj nowy token CSRF
$token = cms_csrf_token();

cms_api_response([
    'status' => 'ok',
    'token' => $token,
]);
