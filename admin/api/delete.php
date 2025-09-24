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

$entity = $_POST['entity'] ?? '';
$catalog = cms_load_catalog();

try {
    switch ($entity) {
        case 'category':
            cms_catalog_delete_category($catalog, (string) ($_POST['category_slug'] ?? ''));
            cms_activity('category.deleted', ['category' => $_POST['category_slug'] ?? '']);
            break;
        case 'subcategory':
            cms_catalog_delete_subcategory(
                $catalog,
                (string) ($_POST['category_slug'] ?? ''),
                (string) ($_POST['subcategory_slug'] ?? '')
            );
            cms_activity('subcategory.deleted', [
                'category' => $_POST['category_slug'] ?? '',
                'subcategory' => $_POST['subcategory_slug'] ?? '',
            ]);
            break;
        case 'tool':
            cms_catalog_delete_tool(
                $catalog,
                (string) ($_POST['category_slug'] ?? ''),
                (string) ($_POST['subcategory_slug'] ?? ''),
                (string) ($_POST['tool_id'] ?? '')
            );
            cms_activity('tool.deleted', [
                'category' => $_POST['category_slug'] ?? '',
                'subcategory' => $_POST['subcategory_slug'] ?? '',
                'tool' => $_POST['tool_id'] ?? '',
            ]);
            break;
        default:
            cms_api_error('Nieznany typ encji.', 422);
    }

    cms_save_catalog($catalog);
    cms_api_response([
        'status' => 'ok',
        'catalog' => $catalog,
    ]);
} catch (InvalidArgumentException $e) {
    cms_api_error($e->getMessage(), 422);
}
