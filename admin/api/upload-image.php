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

if (empty($_FILES['image']) || !is_uploaded_file($_FILES['image']['tmp_name'])) {
    cms_api_error('Nie przesłano pliku.', 422);
}

$file = $_FILES['image'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    cms_api_error('Wystąpił błąd podczas przesyłania pliku.', 422);
}

// Walidacja rozmiaru pliku (max 5MB)
$maxFileSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxFileSize) {
    cms_api_error('Plik jest zbyt duży. Maksymalny rozmiar to 5MB.', 422);
}

// Weryfikacja MIME type z pliku (bezpieczniejsze niż poleganie na nagłówku)
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowedMime = ['image/webp' => 'webp', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
if (!isset($allowedMime[$detectedMime])) {
    cms_api_error('Dozwolone są jedynie pliki WEBP, JPG lub PNG.', 422);
}

$extension = $allowedMime[$detectedMime];

// Sanityzacja nazwy pliku - zabezpieczenie przed Path Traversal
$baseName = pathinfo($file['name'], PATHINFO_FILENAME);
$baseName = preg_replace('/[^a-zA-Z0-9_-]/', '', $baseName); // Usuń niebezpieczne znaki
$slug = cms_slugify($baseName);
if ($slug === '' || strlen($slug) < 2) {
    $slug = 'upload';
}

$uploadsDir = cms_path('images');
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Dodanie losowego ciągu dla dodatkowego bezpieczeństwa
$randomSuffix = bin2hex(random_bytes(4));
$targetName = sprintf('%s-%s-%s.%s', $slug, date('YmdHis'), $randomSuffix, $extension);

// Bezpieczna konstrukcja ścieżki - zabezpieczenie przed Path Traversal
$realUploadsDir = realpath($uploadsDir);
if ($realUploadsDir === false) {
    cms_api_error('Katalog na obrazy nie istnieje.', 500);
}

$targetPath = $realUploadsDir . DIRECTORY_SEPARATOR . basename($targetName);

// Sprawdź czy docelowa ścieżka jest w dozwolonym katalogu
// Porównaj ścieżki przed zapisem pliku
$targetDir = dirname($targetPath);
if (realpath($targetDir) !== $realUploadsDir) {
    cms_api_error('Nieprawidłowa ścieżka pliku.', 422);
}

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    cms_api_error('Nie udało się zapisać pliku.', 500);
}

// Ustaw bezpieczne uprawnienia do pliku
chmod($targetPath, 0644);

cms_activity('image.uploaded', ['file' => $targetName, 'mime' => $detectedMime, 'size' => $file['size']]);

$publicPath = 'images/' . $targetName;

cms_api_response([
    'status' => 'ok',
    'path' => $publicPath,
]);
