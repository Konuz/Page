<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/api.php';
require_once __DIR__ . '/../includes/catalog.php';
require_once __DIR__ . '/../includes/catalog-operations.php';
require_once __DIR__ . '/../includes/deploy.php';
require_once __DIR__ . '/../includes/activity.php';

cms_require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    cms_api_error('Method not allowed', 405);
}

cms_assert_csrf();

$action = $_POST['action'] ?? '';
$toolKeys = $_POST['tool_keys'] ?? [];
if (!is_array($toolKeys) || empty($toolKeys)) {
    cms_api_error('Brak zaznaczonych narzędzi.', 422);
}

$catalog = cms_load_catalog();

switch ($action) {
    case 'enable':
        cms_catalog_bulk_toggle($catalog, $toolKeys, true);
        cms_activity('bulk.enable', ['tools' => $toolKeys]);
        break;
    case 'disable':
        cms_catalog_bulk_toggle($catalog, $toolKeys, false);
        cms_activity('bulk.disable', ['tools' => $toolKeys]);
        break;
    case 'price-adjust':
        $delta = (float) ($_POST['delta'] ?? 0);
        cms_catalog_bulk_adjust_price($catalog, $toolKeys, $delta);
        cms_activity('bulk.price_adjust', ['tools' => $toolKeys, 'delta' => $delta]);
        break;
    default:
        cms_api_error('Nieobsługiwana akcja.', 422);
}

cms_save_catalog($catalog);
cms_run_generators();

cms_api_response([
    'status' => 'ok',
    'catalog' => $catalog,
]);
