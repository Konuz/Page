<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/activity.php';

function cms_run_generators(bool $force = false): void
{
    $lockFile = cms_path('tmp', 'generators.lock');
    $lockDir = dirname($lockFile);
    if (!is_dir($lockDir)) {
        mkdir($lockDir, 0750, true);
    }

    // Otwórz plik lock dla prawdziwego file locking (zapobiega race conditions)
    $lockHandle = fopen($lockFile, 'c+');
    if ($lockHandle === false) {
        cms_log('Nie można otworzyć pliku lock', ['file' => $lockFile], 'build');
        throw new RuntimeException('Nie można otworzyć pliku lock dla generatorów');
    }

    // Spróbuj uzyskać exclusive lock (non-blocking)
    if (!flock($lockHandle, LOCK_EX | LOCK_NB)) {
        fclose($lockHandle);
        cms_log('Generator już uruchomiony - inny proces posiada lock', [], 'build');
        return;
    }

    try {
        // Debouncing - sprawdź czy generatory nie były uruchamiane w ciągu ostatnich 10 sekund
        if (!$force) {
            // Odczytaj timestamp z lock file
            rewind($lockHandle);
            $lastRunTimestamp = (int)fgets($lockHandle);

            if ($lastRunTimestamp > 0) {
                $timeSinceLastRun = time() - $lastRunTimestamp;

                // Jeśli generatory były uruchamiane w ciągu ostatnich 10 sekund, pomiń
                if ($timeSinceLastRun < 10) {
                    cms_log('Generator pomięty (debouncing)', ['time_since_last' => $timeSinceLastRun], 'build');
                    return;
                }
            }
        }

        // Zaktualizuj timestamp lock file
        ftruncate($lockHandle, 0);
        rewind($lockHandle);
        fwrite($lockHandle, (string)time());

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
    } finally {
        // Zwolnij lock i zamknij plik
        flock($lockHandle, LOCK_UN);
        fclose($lockHandle);
    }
}
