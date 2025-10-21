<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function cms_activity(string $action, array $details = []): void
{
    $entry = [
        'action' => $action,
        'user' => $_SESSION[CMS_SESSION_KEY]['username'] ?? 'system',
        'ip' => cms_client_ip(),
        'details' => $details,
    ];

    cms_log('Activity event', $entry, 'activity');
}
