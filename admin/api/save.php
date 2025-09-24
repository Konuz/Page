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
$debugPayload = $_POST;
if (!empty($_FILES)) {
    $debugPayload['__files'] = array_keys($_FILES);
}
cms_log('api.save.request', ['entity' => $entity, 'post' => $debugPayload], 'api');
$catalog = cms_load_catalog();

if ($entity === 'catalog') {
    $payload = $_POST['catalog_json'] ?? '';
    if (!$payload) {
        cms_api_error('Brak danych katalogu.', 422);
    }
    $data = cms_catalog_import_json($payload);
    cms_catalog_storage()->write($data);
    cms_activity('catalog.imported', ['size' => strlen($payload)]);
    cms_run_generators();
    cms_api_response(['status' => 'ok', 'catalog' => $data]);
}

try {
    switch ($entity) {
        case 'category':
            cms_catalog_upsert_category($catalog, $_POST);
            cms_activity('category.saved', ['name' => $_POST['category'] ?? '']);
            break;
        case 'subcategory':
            cms_catalog_upsert_subcategory($catalog, $_POST);
            cms_activity('subcategory.saved', [
                'category' => $_POST['category_slug'] ?? '',
                'name' => $_POST['name'] ?? '',
            ]);
            break;
        case 'tool':
            $_POST['pricing'] = cms_parse_pricing($_POST);
            cms_catalog_upsert_tool($catalog, $_POST);
            cms_activity('tool.saved', [
                'category' => $_POST['category_slug'] ?? '',
                'subcategory' => $_POST['subcategory_slug'] ?? '',
                'id' => $_POST['id'] ?? '',
            ]);
            break;
        default:
            cms_api_error('Nieznany typ encji.', 422);
    }

    cms_save_catalog($catalog);
    cms_run_generators();
    cms_api_response([
        'status' => 'ok',
        'catalog' => $catalog,
    ]);
} catch (InvalidArgumentException $e) {
    cms_api_error($e->getMessage(), 422);
}

function cms_parse_pricing(array $data): array
{
    if (!empty($data['pricing_json'])) {
        $decoded = json_decode((string) $data['pricing_json'], true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    $labels = $data['pricing_label'] ?? [];
    $values = $data['pricing_value'] ?? [];
    if (is_array($labels) && is_array($values) && count($labels) === count($values)) {
        $pricing = [];
        foreach ($labels as $index => $label) {
            $label = trim((string) $label);
            $value = $values[$index] ?? '';
            if ($label === '') {
                continue;
            }
            $pricing[$label] = is_numeric($value) ? (float) $value : trim((string) $value);
        }
        return $pricing;
    }

    return $data['pricing'] ?? [];
}
