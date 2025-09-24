<?php

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', 'stderr');

$projectRoot = dirname(__DIR__);
$dataPath = $projectRoot . '/data.json';
$outRoot = $projectRoot . '/narzedzia';

if (!file_exists($dataPath)) {
    fwrite(STDERR, "Brak pliku data.json\n");
    exit(1);
}

$catalog = json_decode(file_get_contents($dataPath), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($catalog)) {
    fwrite(STDERR, "Niepoprawny format data.json\n");
    exit(1);
}

$templates = [
    'category' => loadTemplate('category', '/category.html', $projectRoot),
    'subcategory' => loadTemplate('subcategory', '/subcategory.html', $projectRoot),
    'tool' => loadTemplate('tool', '/tool.html', $projectRoot),
    'index' => loadTemplate('index', '/index.html', $projectRoot),
];

$navigation = buildNavigation($catalog);

renderHomepage($templates['index'], $catalog, $projectRoot, $navigation);

foreach ($catalog as $category) {
    $catSlug = slugify($category['category']);
    $catDir = $outRoot . '/' . $catSlug;
    ensureDir($catDir);

    $categoryHtml = renderCategory($templates['category'], $category, $catalog, $navigation);
    file_put_contents($catDir . '/index.html', $categoryHtml);

    foreach ($category['subcategories'] as $subcategory) {
        $subSlug = slugify($subcategory['name']);
        $subDir = $catDir . '/' . $subSlug;
        ensureDir($subDir);

        $subcategoryHtml = renderSubcategory($templates['subcategory'], $category, $subcategory, $catalog, $navigation);
        file_put_contents($subDir . '/index.html', $subcategoryHtml);

        foreach ($subcategory['tools'] as $tool) {
            if (isset($tool['enabled']) && $tool['enabled'] === false) {
                continue;
            }
            $toolDir = $subDir . '/' . rawurlencode($tool['id']);
            ensureDir($toolDir);

            $toolHtml = renderTool($templates['tool'], $category, $subcategory, $tool, $catalog, $navigation);
            file_put_contents($toolDir . '/index.html', $toolHtml);
        }
    }
}

fwrite(STDOUT, "Static pages generated successfully.\n");

function loadTemplate(string $name, string $fallback, string $root): string
{
    $templatePath = $root . '/templates-static/' . $name . '.php';
    if (file_exists($templatePath)) {
        return file_get_contents($templatePath);
    }
    return file_get_contents($root . $fallback);
}

function renderHomepage(string $template, array $catalog, string $root, string $navigation): void
{
    $cards = buildCategoryCards($catalog);
    $html = injectNavigation($template, $navigation);
    $html = rewriteAssetPaths($html);

        $grid_html = '<div id="tools-grid" class="tools-grid">' . PHP_EOL . $cards . PHP_EOL . '</div>';
    $html = str_replace('<!-- CATEGORY_GRID_PLACEHOLDER -->', $grid_html, $html);
    file_put_contents($root . '/index.html', $html);
}

function renderCategory(string $template, array $category, array $catalog, string $navigation): string
{
    $slug = slugify($category['category']);
    $url = '/narzedzia/' . $slug . '/';
    $subcards = buildSubcategoryCards($category);

    $html = injectNavigation($template, $navigation);
    $html = rewriteAssetPaths($html);
    $html = str_replace(['[CategoryName]', 'Nazwa Kategorii'], $category['category'], $html);
    $html = preg_replace('/<link rel="canonical" href="[^"]*"/', '<link rel="canonical" href="https://toolshare.com.pl' . $url . '"', $html);
    $html = preg_replace('/<meta property="og:url" content="[^"]*"/', '<meta property="og:url" content="https://toolshare.com.pl' . $url . '"', $html);
    $html = preg_replace('/<meta name="twitter:title" content="[^"]*" id="twitter-title">/', '<meta name="twitter:title" content="Wypożyczalnia narzędzi – ' . htmlspecialchars($category['category']) . ' | ToolShare" id="twitter-title">', $html);
    $html = preg_replace('/(<div id=\"subcategory-grid\" class=\"tools-grid\">)[\s\S]*?(<\/div>)/', '$1' . PHP_EOL . $subcards . PHP_EOL . '$2', $html);

    $breadcrumbs = buildBreadcrumbJson([
        ['name' => 'Strona główna', 'url' => 'https://toolshare.com.pl/'],
        ['name' => $category['category'], 'url' => 'https://toolshare.com.pl' . $url],
    ]);
    $html = injectJsonLd($html, $breadcrumbs);

    return $html;
}

function renderSubcategory(string $template, array $category, array $subcategory, array $catalog, string $navigation): string
{
    $catSlug = slugify($category['category']);
    $subSlug = slugify($subcategory['name']);
    $url = '/narzedzia/' . $catSlug . '/' . $subSlug . '/';

    $toolCards = buildToolCards($category, $subcategory);

    $html = injectNavigation($template, $navigation);
    $html = rewriteAssetPaths($html);
    $html = str_replace(['[CategoryName]', '[SubcategoryName]', 'Nazwa Podkategorii'], [$category['category'], $subcategory['name'], $subcategory['name']], $html);
    $html = preg_replace('/<link rel="canonical" href="[^"]*"/', '<link rel="canonical" href="https://toolshare.com.pl' . $url . '"', $html);
    $html = preg_replace('/<meta property="og:url" content="[^"]*"/', '<meta property="og:url" content="https://toolshare.com.pl' . $url . '"', $html);
    $html = preg_replace('/(<div id=\"tools-grid\" class=\"tools-grid\">)[\s\S]*?(<\/div>)/', '$1' . PHP_EOL . $toolCards . PHP_EOL . '$2', $html);

    $itemList = buildBreadcrumbJson([
        ['name' => 'Strona główna', 'url' => 'https://toolshare.com.pl/'],
        ['name' => $category['category'], 'url' => 'https://toolshare.com.pl/narzedzia/' . $catSlug . '/'],
        ['name' => $subcategory['name'], 'url' => 'https://toolshare.com.pl' . $url],
    ]);
    $html = injectJsonLd($html, $itemList);

    return $html;
}

function renderTool(string $template, array $category, array $subcategory, array $tool, array $catalog, string $navigation): string
{
    $catSlug = slugify($category['category']);
    $subSlug = slugify($subcategory['name']);
    $url = '/narzedzia/' . $catSlug . '/' . $subSlug . '/' . rawurlencode($tool['id']) . '/';

    $pricingRows = buildPricingRows($tool);

    $html = injectNavigation($template, $navigation);
    $html = rewriteAssetPaths($html);
    $html = str_replace(['[CategoryName]', '[SubcategoryName]', '[ToolName]'], [$category['category'], $subcategory['name'], $tool['name']], $html);
    $html = preg_replace('/<link rel="canonical" href="[^"]*"/', '<link rel="canonical" href="https://toolshare.com.pl' . $url . '"', $html);
    $html = preg_replace('/<meta property="og:url" content="[^"]*"/', '<meta property="og:url" content="https://toolshare.com.pl' . $url . '"', $html);
    $html = preg_replace('/(<tbody>)[\s\S]*?(<\/tbody>)/', '$1' . PHP_EOL . $pricingRows . PHP_EOL . '$2', $html);
    $html = preg_replace('/<img id="tool-image"[^>]*>/', '<img id="tool-image" src="/' . htmlspecialchars($tool['image']) . '" alt="' . htmlspecialchars($tool['name']) . '" fetchpriority="high">', $html);
    $title = htmlspecialchars($tool['name'] . ' – wynajem | ToolShare');
    $html = preg_replace('/<title[^>]*>[^<]*<\/title>/', '<title>' . $title . '</title>', $html);

    $breadcrumbs = buildBreadcrumbJson([
        ['name' => 'Strona główna', 'url' => 'https://toolshare.com.pl/'],
        ['name' => $category['category'], 'url' => 'https://toolshare.com.pl/narzedzia/' . $catSlug . '/'],
        ['name' => $subcategory['name'], 'url' => 'https://toolshare.com.pl/narzedzia/' . $catSlug . '/' . $subSlug . '/'],
        ['name' => $tool['name'], 'url' => 'https://toolshare.com.pl' . $url],
    ]);
    $html = injectJsonLd($html, $breadcrumbs);

    return $html;
}

function buildNavigation(array $catalog): string
{
    $links = [];
    foreach ($catalog as $category) {
        $links[] = sprintf('<a href="/narzedzia/%s/" role="menuitem">%s</a>', slugify($category['category']), htmlspecialchars($category['category']));
    }
    return implode(PHP_EOL, $links);
}

function buildCategoryCards(array $catalog): string
{
    $cards = [];
    foreach ($catalog as $category) {
        $cards[] = sprintf(
            '<a href="/narzedzia/%s/" class="category-card">
                <div class="card-image-wrapper">
                    <img src="/%s" alt="%s" loading="lazy" width="300" height="200" decoding="async">
                </div>
                <div class="category-card-title"><h3>%s</h3></div>
            </a>',
            slugify($category['category']),
            ltrim($category['image'], '/'),
            htmlspecialchars($category['category']),
            htmlspecialchars($category['category'])
        );
    }
    return implode(PHP_EOL, $cards);
}

function buildSubcategoryCards(array $category): string
{
    $cards = [];
    foreach ($category['subcategories'] as $subcategory) {
        $cards[] = sprintf(
            '<a href="/narzedzia/%s/%s/" class="subcategory-card">
                <h3>%s</h3>
            </a>',
            slugify($category['category']),
            slugify($subcategory['name']),
            htmlspecialchars($subcategory['name'])
        );
    }
    return implode(PHP_EOL, $cards);
}

function buildToolCards(array $category, array $subcategory): string
{
    $cards = [];
    foreach ($subcategory['tools'] as $tool) {
        if (isset($tool['enabled']) && $tool['enabled'] === false) {
            continue;
        }
        $cards[] = sprintf(
            '<a href="/narzedzia/%s/%s/%s/" class="tool-card">
                <div class="card-image-wrapper">
                    <img src="/%s" alt="%s" class="tool-card-img" loading="lazy">
                </div>
                <div class="tool-card-title"><h3>%s</h3></div>
            </a>',
            slugify($category['category']),
            slugify($subcategory['name']),
            rawurlencode($tool['id']),
            ltrim($tool['image'], '/'),
            htmlspecialchars($tool['name']),
            htmlspecialchars($tool['name'])
        );
    }
    return implode(PHP_EOL, $cards);
}

function buildPricingRows(array $tool): string
{
    $rows = [];
    foreach ($tool['pricing'] as $label => $price) {
        if (stripos($label, 'kaucja') !== false) {
            continue;
        }
        $rows[] = sprintf('<tr><td>%s</td><td>%s</td></tr>', htmlspecialchars($label), formatPrice($price));
    }

    foreach ($tool['pricing'] as $label => $price) {
        if (stripos($label, 'kaucja') !== false) {
            $rows[] = sprintf('<tr class="deposit-row"><td>Kaucja <sup>**</sup></td><td>%s</td></tr>', formatPrice($price, true));
        }
    }

    if (!$rows) {
        $rows[] = '<tr><td colspan="2">Cennik dostępny telefonicznie.</td></tr>';
    }

    return implode(PHP_EOL, $rows);
}

function formatPrice(string|float|int $value, bool $deposit = false): string
{
    if (is_numeric($value)) {
        $value = $deposit ? ((float) $value) . ' zł' : ((float) $value) . ' zł / dzień';
    }
    return htmlspecialchars((string) $value);
}

function injectNavigation(string $html, string $navigation): string
{
    $html = str_replace('<!-- STATIC_NAVIGATION -->', $navigation, $html);
    return preg_replace(
        '/(<div class="dropdown-content" id="nav-categories">)[\s\S]*?(<\/div>)/',
        '$1' . PHP_EOL . $navigation . PHP_EOL . '$2',
        $html
    );
}

function rewriteAssetPaths(string $html): string
{
    $patterns = [
        '/href=\"\.\/style\.css\"/' => 'href="/style.css"',
        '/href=\"style\.css\"/' => 'href="/style.css"',
        '/src=\"\.\/script\.js\"/' => 'src="/script.js"',
        '/src=\"script\.js\"/' => 'src="/script.js"',
        '/href=\"\.\/favicon\.png/' => 'href="/favicon.png',
        '/src=\"\.\/favicon\.png/' => 'src="/favicon.png',
    ];
    foreach ($patterns as $pattern => $replacement) {
        $html = preg_replace($pattern, $replacement, $html);
    }
    return $html;
}

function injectJsonLd(string $html, string $jsonLd): string
{
    if (str_contains($html, '<!-- STRUCTURED_DATA -->')) {
        return str_replace('<!-- STRUCTURED_DATA -->', $jsonLd, $html);
    }
    return preg_replace('/<\/head>/', $jsonLd . PHP_EOL . '</head>', $html, 1);
}

function buildBreadcrumbJson(array $items): string
{
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => [],
    ];
    foreach ($items as $index => $item) {
        $schema['itemListElement'][] = [
            '@type' => 'ListItem',
            'position' => $index + 1,
            'name' => $item['name'],
            'item' => $item['url'],
        ];
    }
    return '<script type="application/ld+json">' . json_encode($schema, JSON_UNESCAPED_UNICODE) . '</script>';
}

function slugify(string $value): string
{
    $map = [
        'ą' => 'a', 'ć' => 'c', 'ę' => 'e', 'ł' => 'l', 'ń' => 'n', 'ó' => 'o', 'ś' => 's', 'ż' => 'z', 'ź' => 'z',
        'Ą' => 'a', 'Ć' => 'c', 'Ę' => 'e', 'Ł' => 'l', 'Ń' => 'n', 'Ó' => 'o', 'Ś' => 's', 'Ż' => 'z', 'Ź' => 'z',
    ];
    $normalized = strtr($value, $map);
    $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized) ?: $normalized;
    $normalized = strtolower($normalized);
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized);
    return trim((string) $normalized, '-');
}

function ensureDir(string $path): void
{
    if (!is_dir($path)) {
        mkdir($path, 0755, true);
    }
}
