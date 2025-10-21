<?php

declare(strict_types=1);

if (!function_exists('cms_config')) {
    /**
     * Retrieve configuration value by dot-notated key.
     */
    function cms_config(?string $key = null, mixed $default = null): mixed
    {
        $config = $GLOBALS['CMS_CONFIG'] ?? [];
        if ($key === null) {
            return $config;
        }

        $value = $config;
        foreach (explode('.', $key) as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }
}

if (!function_exists('cms_path')) {
    /**
     * Resolve known project paths and append optional suffix.
     */
    function cms_path(string $key, ?string $suffix = null): string
    {
        $base = cms_config("paths.{$key}");
        if (!$base) {
            throw new RuntimeException("Unknown path key: {$key}");
        }
        if ($suffix) {
            $base .= '/' . ltrim($suffix, '/');
        }
        return $base;
    }
}

if (!function_exists('cms_now')) {
    function cms_now(): DateTimeImmutable
    {
        return new DateTimeImmutable('now');
    }
}

if (!function_exists('cms_log')) {
    /**
     * Append informational log entry to storage/logs directory.
     */
    function cms_log(string $message, array $context = [], string $channel = 'app'): void
    {
        $logDir = cms_path('logs');
        if (!is_dir($logDir)) {
            mkdir($logDir, 0750, true);
        }

        $filename = sprintf('%s/%s-%s.log', rtrim($logDir, '/'), $channel, cms_now()->format('Y-m-d'));
        $entry = [
            'time' => cms_now()->format(DateTimeInterface::ATOM),
            'message' => $message,
            'context' => $context,
        ];

        file_put_contents($filename, json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

if (!function_exists('cms_abort')) {
    function cms_abort(int $code = 403, string $message = 'Forbidden'): never
    {
        http_response_code($code);
        header('Content-Type: text/plain; charset=utf-8');
        echo $message;
        exit;
    }
}

if (!function_exists('cms_asset')) {
    function cms_asset(string $path): string
    {
        $publicRoot = rtrim(cms_config('paths.public', ''), '/');
        $fullPath = $publicRoot ? $publicRoot . '/' . ltrim($path, '/') : ltrim($path, '/');
        $version = file_exists($fullPath) ? filemtime($fullPath) : time();
        return '/' . ltrim($path, '/') . '?v=' . $version;
    }
}

if (!function_exists('cms_flash_set')) {
    function cms_flash_set(string $type, string $message): void
    {
        $_SESSION['cms_flash'] = compact('type', 'message');
    }
}

if (!function_exists('cms_flash_get')) {
    function cms_flash_get(): ?array
    {
        if (empty($_SESSION['cms_flash'])) {
            return null;
        }
        $flash = $_SESSION['cms_flash'];
        unset($_SESSION['cms_flash']);
        return $flash;
    }
}
