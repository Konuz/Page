<?php

declare(strict_types=1);

require_once __DIR__ . '/../../admin/includes/catalog.php';
require_once __DIR__ . '/../../admin/includes/catalog-operations.php';

$catalog = [
    [
        'category' => 'Testowa',
        'image' => 'images/test.webp',
        'subcategories' => [
            [
                'name' => 'Podkategoria',
                'tools' => [
                    [
                        'id' => 'narzedzie-test',
                        'name' => 'Narzędzie testowe',
                        'image' => 'images/tool.webp',
                        'pricing' => ['1-3 Dni' => 10, 'Kaucja *' => 50],
                    ],
                ],
            ],
        ],
    ],
];

$errors = cms_validate_catalog($catalog);
if ($errors) {
    fwrite(STDERR, "Walidacja zakończyła się błędami\n");
    exit(1);
}

$catalogCopy = $catalog;
cms_catalog_upsert_tool($catalogCopy, [
    'category_slug' => 'testowa',
    'subcategory_slug' => 'podkategoria',
    'id' => 'narzedzie-test',
    'name' => 'Narzędzie testowe z opisem',
    'image' => 'images/tool.webp',
    'pricing' => ['1-3 Dni' => 12],
    'enabled' => '1',
]);

if ($catalogCopy[0]['subcategories'][0]['tools'][0]['pricing']['1-3 Dni'] !== 12) {
    fwrite(STDERR, "Aktualizacja narzędzia nie powiodła się\n");
    exit(1);
}

echo "Walidatory OK\n";
