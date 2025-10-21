<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/catalog.php';
require_once __DIR__ . '/../includes/catalog-operations.php';
require_once __DIR__ . '/../includes/deploy.php';
require_once __DIR__ . '/../includes/activity.php';

cms_require_login();

$backupDir = cms_path('backups');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $files = [];
    if (is_dir($backupDir)) {
        foreach (scandir($backupDir) ?: [] as $file) {
            if (in_array($file, ['.', '..'], true)) {
                continue;
            }
            $path = $backupDir . '/' . $file;
            if (!is_file($path)) {
                continue;
            }
            $files[] = [
                'name' => $file,
                'size' => filesize($path),
                'mtime' => filemtime($path),
            ];
        }
    }
    usort($files, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
    cms_api_response(['status' => 'ok', 'files' => $files]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    cms_assert_csrf();
    $action = $_POST['action'] ?? '';

    switch ($action) {
        case 'create':
            $dataFile = cms_path('data');
            if (!file_exists($dataFile)) {
                cms_api_error('Brak pliku danych do zbackupowania.', 404);
            }
            $backup = cms_create_backup($dataFile);
            cms_activity('backup.created', ['file' => basename($backup)]);
            cms_api_response(['status' => 'ok', 'backup' => basename($backup)]);
            break;
        case 'restore':
            $filename = basename((string) ($_POST['filename'] ?? ''));
            $path = $backupDir . '/' . $filename;
            if (!is_file($path)) {
                cms_api_error('Backup nie istnieje.', 404);
            }
            $json = file_get_contents($path);
            $data = cms_catalog_import_json($json);
            cms_create_backup(cms_path('data'));
            cms_catalog_storage()->write($data, false);
            cms_activity('backup.restored', ['file' => $filename]);
            cms_api_response(['status' => 'ok', 'catalog' => $data]);
            break;
        default:
            cms_api_error('Nieobsługiwana akcja.', 422);
    }
}

cms_api_error('Method not allowed', 405);
