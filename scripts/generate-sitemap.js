const fs = require('fs');
const path = require('path');

function absoluteUrl(urlPath) {
  const base = 'https://toolshare.com.pl/';
  if (!urlPath) return base;
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  return new URL(urlPath, base).toString();
}

function xmlEscape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatUrl(loc, changefreq = 'weekly', priority = '0.6') {
  const safeLoc = xmlEscape(loc);
  return `  <url>\n    <loc>${safeLoc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function main() {
  // Project root is one level up from this script directory
  const projectRoot = path.resolve(__dirname, '..');
  const dataPath = path.join(projectRoot, 'data.json');
  const sitemapPath = path.join(projectRoot, 'sitemap.xml');

  const staticUrls = [
    { loc: absoluteUrl('index.html'), changefreq: 'daily', priority: '1.0' },
    { loc: absoluteUrl('o-nas.html'), changefreq: 'monthly', priority: '0.3' },
    { loc: absoluteUrl('polityka-prywatnosci.html'), changefreq: 'yearly', priority: '0.1' },
    { loc: absoluteUrl('regulamin.html'), changefreq: 'yearly', priority: '0.1' },
  ];

  let dynamicUrls = [];
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    const catalog = JSON.parse(raw);

    catalog.forEach((category) => {
      const catUrl = absoluteUrl(`category.html?category=${encodeURIComponent(category.category)}`);
      dynamicUrls.push({ loc: catUrl, changefreq: 'weekly', priority: '0.6' });

      (category.subcategories || []).forEach((sub) => {
        const subUrl = absoluteUrl(
          `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(sub.name)}`
        );
        dynamicUrls.push({ loc: subUrl, changefreq: 'weekly', priority: '0.6' });

        (sub.tools || [])
          .filter((t) => t.enabled !== false)
          .forEach((tool) => {
            const toolUrl = absoluteUrl(`tool.html?toolId=${encodeURIComponent(tool.id)}`);
            dynamicUrls.push({ loc: toolUrl, changefreq: 'weekly', priority: '0.6' });
          });
      });
    });
  } catch (e) {
    console.error('Failed to read data.json, generating minimal sitemap:', e.message);
  }

  const all = [...staticUrls, ...dynamicUrls];
  const body = all
    .map((u) => formatUrl(u.loc, u.changefreq, u.priority))
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Sitemap written to ${sitemapPath} with ${all.length} URLs.`);
}

main();


