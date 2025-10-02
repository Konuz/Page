<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

class JsonStorage
{
    public function __construct(private readonly string $path)
    {
    }

    public function read(): array
    {
        if (!file_exists($this->path)) {
            return [];
        }

        $contents = file_get_contents($this->path);
        $data = json_decode($contents, true);
        if (!is_array($data)) {
            throw new RuntimeException('Niepoprawny format pliku danych.');
        }

        return $data;
    }

    public function write(array $data, bool $createBackup = true): void
    {
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }

        if ($createBackup && file_exists($this->path)) {
            cms_create_backup($this->path);
        }

        $tmpFile = tempnam(cms_path('tmp'), 'json');
        if ($tmpFile === false) {
            throw new RuntimeException('Nie udało się utworzyć pliku tymczasowego.');
        }

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            throw new RuntimeException('Nie udało się zakodować danych JSON.');
        }

        file_put_contents($tmpFile, $json, LOCK_EX);
        if (!rename($tmpFile, $this->path)) {
            // Cleanup temp file z logowaniem błędów
            $unlinkResult = @unlink($tmpFile);
            if (!$unlinkResult) {
                $error = error_get_last();
                cms_log('Błąd usuwania pliku tymczasowego', [
                    'file' => $tmpFile,
                    'error' => $error ? $error['message'] : 'Unknown error',
                ], 'error');
            }
            throw new RuntimeException('Nie udało się zapisać pliku JSON.');
        }
    }
}

function cms_create_backup(string $sourcePath): string
{
    $backupDir = cms_path('backups');
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0750, true);
    }

    $timestamp = cms_now()->format('Ymd-His');
    $target = sprintf('%s/data-%s.json', rtrim($backupDir, '/'), $timestamp);

    if (!copy($sourcePath, $target)) {
        throw new RuntimeException('Nie udało się utworzyć kopii zapasowej.');
    }

    return $target;
}

function cms_slugify(string $value): string
{
    $map = [
        'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ó' => 'o', 'ś' => 's', 'ż' => 'z', 'ź' => 'z',
        'Ą' => 'a', 'Ć' => 'c', 'Ę' => 'e', 'Ł' => 'l', 'Ń' => 'n', 'Ó' => 'o', 'Ś' => 's', 'Ż' => 'z', 'Ź' => 'z',
    ];

    $normalized = strtr($value, $map);
    $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized) ?: $normalized;
    $normalized = strtolower($normalized);
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized);
    $normalized = trim((string) $normalized, '-');

    return $normalized;
}
