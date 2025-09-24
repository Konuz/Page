<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/validation.php';

function cms_catalog_storage(): JsonStorage
{
    return new JsonStorage(cms_path('data'));
}

function cms_load_catalog(): array
{
    return cms_catalog_storage()->read();
}

function cms_save_catalog(array $catalog): void
{
    $errors = cms_validate_catalog($catalog);
    if (!empty($errors)) {
        throw new InvalidArgumentException('Nieprawidłowa struktura danych: ' . json_encode($errors, JSON_UNESCAPED_UNICODE));
    }

    cms_catalog_storage()->write($catalog);
}

function cms_validate_catalog(array $catalog): array
{
    $errors = [];
    if (!is_array($catalog)) {
        return ['root' => ['Struktura katalogu musi być tablicą.']];
    }

    $categorySlugs = [];

    foreach ($catalog as $cIndex => $category) {
        if (!is_array($category)) {
            $errors["category.{$cIndex}"][] = 'Kategoria musi być tablicą.';
            continue;
        }

        $name = trim((string) ($category['category'] ?? ''));
        if ($name === '') {
            $errors["category.{$cIndex}.category"][] = 'Nazwa kategorii jest wymagana.';
        }

        $slug = cms_slugify($name);
        if ($slug === '') {
            $errors["category.{$cIndex}.category"][] = 'Nie udało się wygenerować sluga kategorii.';
        } elseif (in_array($slug, $categorySlugs, true)) {
            $errors["category.{$cIndex}.category"][] = 'Slug kategorii musi być unikalny.';
        } else {
            $categorySlugs[] = $slug;
        }

        if (empty($category['image']) || !is_string($category['image'])) {
            $errors["category.{$cIndex}.image"][] = 'Ścieżka do obrazu kategorii jest wymagana.';
        }

        $subcategories = $category['subcategories'] ?? [];
        if (!is_array($subcategories)) {
            $errors["category.{$cIndex}.subcategories"][] = 'Podkategorie muszą być tablicą.';
            continue;
        }

        $subcategorySlugs = [];
        foreach ($subcategories as $sIndex => $subcategory) {
            if (!is_array($subcategory)) {
                $errors["category.{$cIndex}.subcategory.{$sIndex}"][] = 'Podkategoria musi być tablicą.';
                continue;
            }

            $subName = trim((string) ($subcategory['name'] ?? ''));
            if ($subName === '') {
                $errors["category.{$cIndex}.subcategory.{$sIndex}.name"][] = 'Nazwa podkategorii jest wymagana.';
            }

            $subSlug = cms_slugify($subName);
            if ($subSlug === '') {
                $errors["category.{$cIndex}.subcategory.{$sIndex}.name"][] = 'Nie udało się wygenerować sluga podkategorii.';
            } elseif (in_array($subSlug, $subcategorySlugs, true)) {
                $errors["category.{$cIndex}.subcategory.{$sIndex}.name"][] = 'Slug podkategorii musi być unikalny w kategorii.';
            } else {
                $subcategorySlugs[] = $subSlug;
            }

            $tools = $subcategory['tools'] ?? [];
            if (!is_array($tools)) {
                $errors["category.{$cIndex}.subcategory.{$sIndex}.tools"][] = 'Lista narzędzi musi być tablicą.';
                continue;
            }

            $toolIds = [];
            foreach ($tools as $tIndex => $tool) {
                if (!is_array($tool)) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}"][] = 'Narzędzie musi być tablicą.';
                    continue;
                }

                $toolId = trim((string) ($tool['id'] ?? ''));
                if ($toolId === '') {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.id"][] = 'ID narzędzia jest wymagane.';
                } elseif (!preg_match('/^[a-z0-9-]+$/', $toolId)) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.id"][] = 'ID może zawierać jedynie małe litery, cyfry i myślniki.';
                } elseif (in_array($toolId, $toolIds, true)) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.id"][] = 'ID musi być unikalne w ramach podkategorii.';
                } else {
                    $toolIds[] = $toolId;
                }

                if (empty($tool['name']) || !is_string($tool['name'])) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.name"][] = 'Nazwa narzędzia jest wymagana.';
                }

                if (empty($tool['image']) || !is_string($tool['image'])) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.image"][] = 'Ścieżka do obrazu narzędzia jest wymagana.';
                }

                if (!isset($tool['pricing']) || !is_array($tool['pricing'])) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.pricing"][] = 'Cennik musi być tablicą asocjacyjną.';
                } else {
                    foreach ($tool['pricing'] as $label => $price) {
                        if (!is_string($label) || trim($label) === '') {
                            $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.pricing"][] = 'Klucze w cenniku muszą być niepustymi tekstami.';
                        }
                        if (!is_string($price) && !is_numeric($price)) {
                            $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.pricing"][] = 'Wartości w cenniku muszą być liczbą lub tekstem.';
                        }
                    }
                }

                if (isset($tool['enabled']) && !is_bool($tool['enabled'])) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.enabled"][] = 'Pole enabled musi być wartością logiczną.';
                }

                if (isset($tool['deposit']) && !is_numeric($tool['deposit']) && !is_string($tool['deposit'])) {
                    $errors["category.{$cIndex}.subcategory.{$sIndex}.tool.{$tIndex}.deposit"][] = 'Pole deposit musi być liczbą lub tekstem.';
                }
            }
        }
    }

    return $errors;
}
