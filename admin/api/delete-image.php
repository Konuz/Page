<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/activity.php';
require_once __DIR__ . '/../includes/storage.php';

cms_require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    cms_api_error('Method not allowed', 405);
}

cms_assert_csrf();

$input = json_decode(file_get_contents('php://input'), true);
$imagePath = $input['path'] ?? '';

if (empty($imagePath)) {
    cms_api_error('Nie podano ścieżki do pliku.', 422);
}

// Usuń prefix 'images/' jeśli istnieje
$imagePath = preg_replace('#^images/#', '', $imagePath);

// Sanityzacja - tylko dozwolone znaki w nazwie pliku
if (!preg_match('/^[a-zA-Z0-9_-]+\.(webp|jpg|png)$/', $imagePath)) {
    cms_api_error('Nieprawidłowa nazwa pliku.', 422);
}

$uploadsDir = cms_path('images');
$realUploadsDir = realpath($uploadsDir);

if ($realUploadsDir === false) {
    cms_api_error('Katalog na obrazy nie istnieje.', 500);
}

// Bezpieczna konstrukcja ścieżki - zabezpieczenie przed Path Traversal
$targetPath = $realUploadsDir . DIRECTORY_SEPARATOR . basename($imagePath);

// Sprawdź czy docelowa ścieżka jest w dozwolonym katalogu
$targetDir = dirname($targetPath);
if (realpath($targetDir) !== $realUploadsDir) {
    cms_api_error('Nieprawidłowa ścieżka pliku.', 422);
}

// Sprawdź czy plik istnieje
if (!file_exists($targetPath)) {
    cms_api_error('Plik nie istnieje.', 404);
}

// Usuń plik z logowaniem błędów
$unlinkResult = @unlink($targetPath);
if (!$unlinkResult) {
    $error = error_get_last();
    cms_log('Błąd usuwania obrazu', [
        'file' => $targetPath,
        'error' => $error ? $error['message'] : 'Unknown error',
        'permissions' => substr(sprintf('%o', fileperms(dirname($targetPath))), -4),
    ], 'error');
    cms_api_error('Nie udało się usunąć pliku.', 500);
}

cms_activity('image.deleted', ['file' => $imagePath]);

cms_api_response([
    'status' => 'ok',
    'message' => 'Plik został usunięty.',
]);
