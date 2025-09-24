<?php

declare(strict_types=1);

require_once __DIR__ . '/catalog.php';
require_once __DIR__ . '/validation.php';

function cms_catalog_export_json(array $catalog): string
{
    cms_validate_catalog($catalog);
    $json = json_encode($catalog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        throw new RuntimeException('Nie udało się zakodować danych katalogu.');
    }
    return $json;
}

function cms_catalog_import_json(string $json): array
{
    $data = json_decode($json, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Niepoprawny plik JSON.');
    }
    $errors = cms_validate_catalog($data);
    if (!empty($errors)) {
        throw new InvalidArgumentException('Zaimportowany katalog zawiera błędy: ' . json_encode($errors, JSON_UNESCAPED_UNICODE));
    }
    return $data;
}

function cms_catalog_bulk_toggle(array &$catalog, array $toolKeys, bool $enabled): void
{
    foreach ($catalog as &$category) {
        foreach ($category['subcategories'] as &$subcategory) {
            foreach ($subcategory['tools'] as &$tool) {
                $key = sprintf('%s/%s/%s', cms_slugify($category['category']), cms_slugify($subcategory['name']), $tool['id']);
                if (in_array($key, $toolKeys, true)) {
                    $tool['enabled'] = $enabled;
                }
            }
        }
    }
}

function cms_catalog_bulk_adjust_price(array &$catalog, array $toolKeys, float $delta): void
{
    foreach ($catalog as &$category) {
        foreach ($category['subcategories'] as &$subcategory) {
            foreach ($subcategory['tools'] as &$tool) {
                $key = sprintf('%s/%s/%s', cms_slugify($category['category']), cms_slugify($subcategory['name']), $tool['id']);
                if (!in_array($key, $toolKeys, true)) {
                    continue;
                }

                if (!isset($tool['pricing']) || !is_array($tool['pricing'])) {
                    continue;
                }

                foreach ($tool['pricing'] as $label => $price) {
                    if (is_numeric($price)) {
                        $newPrice = max(0, (float) $price + $delta);
                        $tool['pricing'][$label] = round($newPrice, 2);
                    }
                }
            }
        }
    }
}

function cms_catalog_upsert_category(array &$catalog, array $input): void
{
    $rules = [
        'category' => ['required', 'string', 'max:120'],
        'image' => ['required', 'string', 'max:255'],
    ];
    cms_assert_valid($input, $rules);

    $name = trim((string) $input['category']);
    $slug = cms_slugify($name);
    $original = $input['original_slug'] ?? null;

    $index = null;
    foreach ($catalog as $i => $category) {
        $currentSlug = cms_slugify($category['category']);
        if (($original && $currentSlug === $original) || (!$original && $currentSlug === $slug)) {
            $index = $i;
            break;
        }
    }

    if ($index !== null) {
        $catalog[$index]['category'] = $name;
        $catalog[$index]['image'] = trim((string) $input['image']);
    } else {
        $catalog[] = [
            'category' => $name,
            'image' => trim((string) $input['image']),
            'subcategories' => [],
        ];
    }
}

function cms_catalog_upsert_subcategory(array &$catalog, array $input): void
{
    $rules = [
        'category_slug' => ['required', 'string'],
        'name' => ['required', 'string', 'max:120'],
        'description' => ['nullable', 'string'],
    ];
    cms_assert_valid($input, $rules);

    $categorySlug = (string) $input['category_slug'];
    $name = trim((string) $input['name']);
    $slug = cms_slugify($name);
    $original = $input['original_slug'] ?? null;

    foreach ($catalog as &$category) {
        if (cms_slugify($category['category']) !== $categorySlug) {
            continue;
        }

        if (!isset($category['subcategories']) || !is_array($category['subcategories'])) {
            $category['subcategories'] = [];
        }

        $found = null;
        foreach ($category['subcategories'] as $index => $subcategory) {
            $currentSlug = cms_slugify($subcategory['name']);
            if (($original && $currentSlug === $original) || (!$original && $currentSlug === $slug)) {
                $found = $index;
                break;
            }
        }

        if ($found !== null) {
            $category['subcategories'][$found]['name'] = $name;
            if (array_key_exists('description', $input)) {
                $category['subcategories'][$found]['description'] = trim((string) $input['description']);
            }
        } else {
            $subcategory = ['name' => $name, 'tools' => []];
            if (!empty($input['description'])) {
                $subcategory['description'] = trim((string) $input['description']);
            }
            $category['subcategories'][] = $subcategory;
        }
        return;
    }

    throw new InvalidArgumentException('Nie znaleziono wskazanej kategorii.');
}

function cms_catalog_upsert_tool(array &$catalog, array $input): void
{
    $categorySlug = trim((string) ($input['category_slug'] ?? ''));
    $subcategorySlug = trim((string) ($input['subcategory_slug'] ?? ''));
    $toolId = trim((string) ($input['id'] ?? ''));
    $originalToolId = trim((string) ($input['tool_id'] ?? $toolId));

    $existingContext = $originalToolId !== '' ? cms_catalog_find_tool($catalog, $originalToolId) : null;
    $existingCatSlug = null;
    $existingSubSlug = null;

    if ($existingContext) {
        [$catIndex, $subIndex] = $existingContext;
        $existingCatSlug = cms_slugify($catalog[$catIndex]['category']);
        $existingSubSlug = cms_slugify($catalog[$catIndex]['subcategories'][$subIndex]['name']);
        if ($categorySlug === '') {
            $categorySlug = $existingCatSlug;
        }
        if ($subcategorySlug === '') {
            $subcategorySlug = $existingSubSlug;
        }
    }

    $input['category_slug'] = $categorySlug;
    $input['subcategory_slug'] = $subcategorySlug;
    $input['id'] = $toolId;

    $rules = [
        'category_slug' => ['required', 'string'],
        'subcategory_slug' => ['required', 'string'],
        'name' => ['required', 'string', 'max:160'],
        'id' => ['required', 'string', 'slug', 'max:160'],
        'image' => ['required', 'string', 'max:255'],
        'enabled' => ['nullable', 'in:0,1'],
    ];
    cms_assert_valid($input, $rules);

    $enabled = isset($input['enabled']) ? $input['enabled'] === '1' : true;

    foreach ($catalog as &$category) {
        if (cms_slugify($category['category']) !== $categorySlug) {
            continue;
        }
        foreach ($category['subcategories'] as &$subcategory) {
            if (cms_slugify($subcategory['name']) !== $subcategorySlug) {
                continue;
            }
            if (!isset($subcategory['tools']) || !is_array($subcategory['tools'])) {
                $subcategory['tools'] = [];
            }

            $found = null;
            foreach ($subcategory['tools'] as $index => $tool) {
                if ($tool['id'] === $toolId) {
                    $found = $index;
                    break;
                }
            }

            $pricingPayload = $input['pricing'] ?? [];
            if (is_string($pricingPayload)) {
                $decoded = json_decode($pricingPayload, true);
                if (is_array($decoded)) {
                    $pricingPayload = $decoded;
                }
            }
            if (!is_array($pricingPayload)) {
                throw new InvalidArgumentException('Niepoprawny format cennika.');
            }
            foreach ($pricingPayload as $label => $value) {
                if (!is_string($label) || trim($label) === '') {
                    throw new InvalidArgumentException('Klucze cennika muszą być tekstem.');
                }
                if (!is_string($value) && !is_numeric($value)) {
                    throw new InvalidArgumentException('Wartości cennika muszą być liczbą lub tekstem.');
                }
            }

            $payload = [
                'id' => $toolId,
                'name' => trim((string) $input['name']),
                'image' => trim((string) $input['image']),
                'pricing' => $pricingPayload,
                'enabled' => $enabled,
            ];

            if (!empty($input['description'])) {
                $payload['description'] = trim((string) $input['description']);
            }
            if (isset($input['deposit']) && $input['deposit'] !== '') {
                $payload['deposit'] = is_numeric($input['deposit']) ? (float) $input['deposit'] : trim((string) $input['deposit']);
            }

            if ($found !== null) {
                $subcategory['tools'][$found] = array_merge($subcategory['tools'][$found], $payload);
            } else {
                $shouldRemoveSource = false;
                if ($existingContext) {
                    $shouldRemoveSource = ($existingCatSlug !== null && $existingCatSlug !== $categorySlug)
                        || ($existingSubSlug !== null && $existingSubSlug !== $subcategorySlug)
                        || ($originalToolId !== '' && $originalToolId !== $toolId);
                } elseif ($originalToolId !== '' && $originalToolId !== $toolId) {
                    $shouldRemoveSource = true;
                }

                if ($shouldRemoveSource) {
                    cms_catalog_delete_tool_by_id($catalog, $originalToolId);
                }

                $subcategory['tools'][] = $payload;
            }
            return;
        }
    }

    throw new InvalidArgumentException('Nie znaleziono wskazanej podkategorii.');
}

function cms_catalog_find_tool(array &$catalog, string $toolId): ?array
{
    foreach ($catalog as $catIndex => $category) {
        foreach ($category['subcategories'] as $subIndex => $subcategory) {
            foreach ($subcategory['tools'] as $tool) {
                if (($tool['id'] ?? null) === $toolId) {
                    return [$catIndex, $subIndex];
                }
            }
        }
    }
    return null;
}

function cms_catalog_delete_tool_by_id(array &$catalog, string $toolId): void
{
    foreach ($catalog as &$category) {
        foreach ($category['subcategories'] as &$subcategory) {
            foreach ($subcategory['tools'] as $index => $tool) {
                if (($tool['id'] ?? null) === $toolId) {
                    array_splice($subcategory['tools'], $index, 1);
                    return;
                }
            }
        }
    }
}

function cms_catalog_delete_category(array &$catalog, string $slug): void
{
    foreach ($catalog as $index => $category) {
        if (cms_slugify($category['category']) === $slug) {
            array_splice($catalog, $index, 1);
            return;
        }
    }
    throw new InvalidArgumentException('Kategoria nie została znaleziona.');
}

function cms_catalog_delete_subcategory(array &$catalog, string $categorySlug, string $subSlug): void
{
    foreach ($catalog as &$category) {
        if (cms_slugify($category['category']) !== $categorySlug) {
            continue;
        }
        foreach ($category['subcategories'] as $index => $subcategory) {
            if (cms_slugify($subcategory['name']) === $subSlug) {
                array_splice($category['subcategories'], $index, 1);
                return;
            }
        }
        throw new InvalidArgumentException('Podkategoria nie została znaleziona.');
    }
    throw new InvalidArgumentException('Kategoria nie została znaleziona.');
}

function cms_catalog_delete_tool(array &$catalog, string $categorySlug, string $subSlug, string $toolId): void
{
    foreach ($catalog as &$category) {
        if (cms_slugify($category['category']) !== $categorySlug) {
            continue;
        }
        foreach ($category['subcategories'] as &$subcategory) {
            if (cms_slugify($subcategory['name']) !== $subSlug) {
                continue;
            }
            foreach ($subcategory['tools'] as $index => $tool) {
                if ($tool['id'] === $toolId) {
                    array_splice($subcategory['tools'], $index, 1);
                    return;
                }
            }
            throw new InvalidArgumentException('Narzędzie nie zostało znalezione.');
        }
        throw new InvalidArgumentException('Podkategoria nie została znaleziona.');
    }
    throw new InvalidArgumentException('Kategoria nie została znaleziona.');
}
