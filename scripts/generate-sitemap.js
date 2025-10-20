const fs = require('fs');
const path = require('path');

function getBaseUrl() {
  let base = process.env.BASE_URL || 'https://toolshare.com.pl/';
  if (!base.endsWith('/')) base += '/';
  return base;
}

function absoluteUrl(urlPath) {
  const base = getBaseUrl();
  if (!urlPath) return base;
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  return new URL(urlPath, base).toString();
}

function slugify(input) {
  if (!input) return '';
  const map = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z',
    'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ż':'z','Ź':'z'
  };
  const replaced = String(input)
    .split('')
    .map(ch => map[ch] || ch)
    .join('');
  return replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function xmlEscape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatUrlWithAlternates(loc, alternates = [], lastmod = null, changefreq = 'weekly', priority = '0.6') {
  const safeLoc = xmlEscape(loc);
  const alt = alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${xmlEscape(a.href)}"/>`).join('\n');
  const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>\n    <loc>${safeLoc}</loc>${lm}\n${alt ? alt + '\n' : ''}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function main() {
  // Project root is one level up from this script directory
  const projectRoot = path.resolve(__dirname, '..');
  const dataPath = path.join(projectRoot, 'data.json');
  const sitemapIndexPath = path.join(projectRoot, 'sitemap.xml');
  const sitemapsDir = path.join(projectRoot, 'sitemaps');
  fs.mkdirSync(sitemapsDir, { recursive: true });

  const staticUrls = [
    { loc: absoluteUrl(''), changefreq: 'daily', priority: '1.0' },
    { loc: absoluteUrl('o-nas.html'), changefreq: 'monthly', priority: '0.3' },
    { loc: absoluteUrl('polityka-prywatnosci.html'), changefreq: 'yearly', priority: '0.1' },
    { loc: absoluteUrl('regulamin.html'), changefreq: 'yearly', priority: '0.1' },
  ];

  let dynamicUrls = [];
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    const catalog = JSON.parse(raw);

    catalog.forEach((category) => {
      const catSlug = `narzedzia/${slugify(category.category)}/`;
      const catUrl = absoluteUrl(catSlug);
      dynamicUrls.push({ loc: catUrl, changefreq: 'weekly', priority: '0.6' });

      (category.subcategories || []).forEach((sub) => {
        const subSlug = `narzedzia/${slugify(category.category)}/${slugify(sub.name)}/`;
        const subUrl = absoluteUrl(subSlug);
        dynamicUrls.push({ loc: subUrl, changefreq: 'weekly', priority: '0.6' });

        (sub.tools || [])
          .filter((t) => t.enabled !== false)
          .forEach((tool) => {
            const toolSlug = `narzedzia/${slugify(category.category)}/${slugify(sub.name)}/${encodeURIComponent(tool.id)}/`;
            const toolUrl = absoluteUrl(toolSlug);
            dynamicUrls.push({ loc: toolUrl, changefreq: 'weekly', priority: '0.6' });
          });
      });
    });
  } catch (e) {
    console.error('Failed to read data.json, generating minimal sitemap:', e.message);
  }

  const all = [...staticUrls, ...dynamicUrls];
  const today = new Date().toISOString().split('T')[0];

  const altFor = (url) => {
    const hasExt = /\.[a-z0-9]{2,5}$/i.test(url);
    const href = hasExt ? url : (url.endsWith('/') ? url : (url + '/'));
    return [
      { lang: 'pl', href },
      { lang: 'x-default', href }
    ];
  };

  const urlset = all
    .map((u) => formatUrlWithAlternates(u.loc, altFor(u.loc), today, u.changefreq, u.priority))
    .join('\n');

  const sitemapPl = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urlset}\n` +
    `</urlset>\n`;

  const sitemapPlPath = path.join(sitemapsDir, 'sitemap-pl.xml');
  fs.writeFileSync(sitemapPlPath, sitemapPl, 'utf8');

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <sitemap>\n    <loc>${xmlEscape(absoluteUrl('sitemaps/sitemap-pl.xml'))}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n` +
    `</sitemapindex>\n`;

  fs.writeFileSync(sitemapIndexPath, sitemapIndex, 'utf8');
}

main();
