<?php

return [
    'app' => [
        'name' => 'ToolShare CMS',
        'base_url' => getenv('CMS_BASE_URL') ?: 'https://toolshare.com.pl',
        'session_name' => 'toolshare_admin',
    ],
    'security' => [
        // Uzupełnij hash silnym hasłem wygenerowanym przez password_hash().
        'admin_password_hash' => getenv('CMS_ADMIN_HASH') ?: '$2y$10$kdo7/bABKFt1Upt3w22Fx.65YLojyKlxoB4UCotZussBu9osvNXA2',
        'max_login_attempts' => 5,
        'login_cooldown_seconds' => 900,
    ],
    'paths' => [
        'root' => dirname(__DIR__),
        'data' => dirname(__DIR__) . '/data.json',
        'images' => dirname(__DIR__) . '/images',
        'storage' => dirname(__DIR__) . '/storage',
        'backups' => dirname(__DIR__) . '/storage/backups',
        'logs' => dirname(__DIR__) . '/storage/logs',
        'tmp' => dirname(__DIR__) . '/storage/tmp',
        'templates' => dirname(__DIR__) . '/templates-static',
        'public' => dirname(__DIR__),
    ],
];
