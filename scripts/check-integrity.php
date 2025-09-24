<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$dataPath = $root . '/data.json';
$logFile = $root . '/storage/logs/integrity-' . date('Y-m-d') . '.log';

$result = [
    'time' => date(DATE_ATOM),
    'data_exists' => file_exists($dataPath),
    'data_size' => file_exists($dataPath) ? filesize($dataPath) : 0,
    'data_valid' => false,
    'errors' => [],
];

if ($result['data_exists']) {
    try {
        $json = json_decode(file_get_contents($dataPath), true, 512, JSON_THROW_ON_ERROR);
        $result['data_valid'] = is_array($json);
    } catch (Throwable $e) {
        $result['errors'][] = $e->getMessage();
    }
}

$phpLog = ini_get('error_log');
if ($phpLog && file_exists($phpLog)) {
    $result['php_error_log_size'] = filesize($phpLog);
}

file_put_contents($logFile, json_encode($result, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND);
