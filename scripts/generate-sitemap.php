<?php

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', 'stderr');

$projectRoot = dirname(__DIR__);
$dataPath = $projectRoot . '/data.json';
$sitemapDir = $projectRoot . '/sitemaps';
$sitemapIndexPath = $projectRoot . '/sitemap.xml';

$baseUrl = rtrim(getenv('CMS_BASE_URL') ?: 'https://toolshare.com.pl', '/') . '/';

if (!file_exists($dataPath)) {
    fwrite(STDERR, "Brak pliku data.json\n");
    exit(1);
}

$catalog = json_decode(file_get_contents($dataPath), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($catalog)) {
    fwrite(STDERR, "Niepoprawny format data.json\n");
    exit(1);
}

$staticUrls = [
    ['loc' => $baseUrl, 'changefreq' => 'daily', 'priority' => '1.0'],
    ['loc' => $baseUrl . 'o-nas.html', 'changefreq' => 'monthly', 'priority' => '0.3'],
    ['loc' => $baseUrl . 'polityka-prywatnosci.html', 'changefreq' => 'yearly', 'priority' => '0.1'],
    ['loc' => $baseUrl . 'regulamin.html', 'changefreq' => 'yearly', 'priority' => '0.1'],
];

$dynamicUrls = [];
foreach ($catalog as $category) {
    $catSlug = slugify($category['category']);
    $dynamicUrls[] = urlEntry($baseUrl . 'narzedzia/' . $catSlug . '/');
    foreach ($category['subcategories'] as $subcategory) {
        $subSlug = slugify($subcategory['name']);
        $dynamicUrls[] = urlEntry($baseUrl . 'narzedzia/' . $catSlug . '/' . $subSlug . '/');
        foreach ($subcategory['tools'] as $tool) {
            if (isset($tool['enabled']) && $tool['enabled'] === false) {
                continue;
            }
            $dynamicUrls[] = urlEntry($baseUrl . 'narzedzia/' . $catSlug . '/' . $subSlug . '/' . rawurlencode($tool['id']) . '/');
        }
    }
}

$all = array_merge($staticUrls, $dynamicUrls);
$lastmod = gmdate('Y-m-d');

if (!is_dir($sitemapDir)) {
    mkdir($sitemapDir, 0755, true);
}

$entries = array_map(fn($entry) => renderUrl($entry, $lastmod), $all);
$body = implode(PHP_EOL, $entries);

$plSitemap = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
$body
</urlset>
XML;

file_put_contents($sitemapDir . '/sitemap-pl.xml', $plSitemap);

$index = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{$baseUrl}sitemaps/sitemap-pl.xml</loc>
    <lastmod>{$lastmod}</lastmod>
  </sitemap>
</sitemapindex>
XML;

file_put_contents($sitemapIndexPath, $index);

fwrite(STDOUT, "Sitemap wygenerowana.\n");

function urlEntry(string $loc, string $changefreq = 'weekly', string $priority = '0.6'): array
{
    return compact('loc', 'changefreq', 'priority');
}

function renderUrl(array $entry, string $lastmod): string
{
    $loc = htmlspecialchars($entry['loc'], ENT_QUOTES | ENT_XML1);
    $changefreq = $entry['changefreq'];
    $priority = $entry['priority'];
    return "  <url>\n    <loc>{$loc}</loc>\n    <lastmod>{$lastmod}</lastmod>\n    <changefreq>{$changefreq}</changefreq>\n    <priority>{$priority}</priority>\n  </url>";
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
