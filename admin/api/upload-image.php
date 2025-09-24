<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/activity.php';

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

$allowedMime = ['image/webp' => 'webp', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
$mime = mime_content_type($file['tmp_name']) ?: $file['type'];
if (!isset($allowedMime[$mime])) {
    cms_api_error('Dozwolone są jedynie pliki WEBP, JPG lub PNG.', 422);
}

$extension = $allowedMime[$mime];
$baseName = pathinfo($file['name'], PATHINFO_FILENAME);
$slug = cms_slugify($baseName);
if ($slug === '') {
    $slug = 'upload';
}

$uploadsDir = cms_path('images', 'uploads');
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

$targetName = sprintf('%s-%s.%s', $slug, date('YmdHis'), $extension);
$targetPath = $uploadsDir . '/' . $targetName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    cms_api_error('Nie udało się zapisać pliku.', 500);
}

cms_activity('image.uploaded', ['file' => $targetName, 'mime' => $mime]);

$publicPath = 'images/uploads/' . $targetName;

cms_api_response([
    'status' => 'ok',
    'path' => $publicPath,
]);
