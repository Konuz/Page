<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/catalog.php';
require_once __DIR__ . '/includes/activity.php';

cms_require_login();

$catalog = cms_load_catalog();
$flash = cms_flash_get();
$title = 'Narzędzia';

include __DIR__ . '/templates/header.php';
include __DIR__ . '/templates/catalog-table.php';
include __DIR__ . '/templates/modals.php';
?>
<script>
    window.cmsCatalog = <?= json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
</script>
<?php
include __DIR__ . '/templates/footer.php';
