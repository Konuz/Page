<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/catalog.php';

cms_require_login();

$catalog = cms_load_catalog();
$flash = cms_flash_get();
$title = 'Kategorie';

include __DIR__ . '/templates/header.php';
include __DIR__ . '/templates/categories-table.php';
include __DIR__ . '/templates/footer.php';
