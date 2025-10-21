<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/csrf.php';

function cms_api_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function cms_api_error(string $message, int $status = 400, array $context = []): never
{
    cms_log('API error', ['message' => $message, 'context' => $context], 'api');
    cms_api_response([
        'status' => 'error',
        'message' => $message,
        'context' => $context,
    ], $status);
}

set_exception_handler(function (Throwable $e) {
    cms_log('Unhandled API exception', [
        'type' => get_class($e),
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ], 'api');

    $status = $e instanceof InvalidArgumentException ? 422 : 500;
    cms_api_response([
        'status' => 'error',
        'message' => 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.',
    ], $status);
});
