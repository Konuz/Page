<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/activity.php';

function cms_run_generators(): void
{
    $commands = [
        [PHP_BINARY, dirname(__DIR__, 2) . '/scripts/build-static.php'],
        [PHP_BINARY, dirname(__DIR__, 2) . '/scripts/generate-sitemap.php'],
    ];

    foreach ($commands as $command) {
        $descriptorSpec = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = proc_open($command, $descriptorSpec, $pipes, dirname(__DIR__, 2));
        if (!is_resource($process)) {
            cms_log('Nie udało się uruchomić generatora', ['command' => $command], 'build');
            continue;
        }

        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        foreach ($pipes as $pipe) {
            fclose($pipe);
        }
        $status = proc_close($process);

        cms_log('Generator zakończony', [
            'command' => implode(' ', $command),
            'status' => $status,
            'output' => trim($output),
            'error' => trim($error),
        ], 'build');

        if ($status !== 0) {
            throw new RuntimeException('Generator zakończył się błędem: ' . implode(' ', $command));
        }
    }

    cms_activity('static.regenerated');
}
