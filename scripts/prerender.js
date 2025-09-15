const fs = require('fs');
const path = require('path');

// Absolute URL helper
function absoluteUrl(urlPath) {
  const base = 'https://toolshare.com.pl/';
  if (!urlPath) return base;
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  return new URL(urlPath, base).toString();
}

// Slugify compatible with existing sitemap/script logic
function slugify(input) {
  if (!input) return '';
  // Keep this map aligned with existing project behavior (handles mojibake forms)
  const map = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z',
    // Mojibake fallbacks seen in repo
    '�\u0007':'a','��':'c','�t':'e','�\'':'l','�"':'n','ƈ':'o','�>':'s','��':'z','��':'z',
    '�"':'a','��':'c','�?':'e','�?':'l','�?':'n','�"':'o','��':'s','��':'z','��':'z'
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

// HTML helpers
function replaceTitle(html, title) {
  if (!title) return html;
  const re = /<title[^>]*>[\s\S]*?<\/title>/i;
  if (re.test(html)) return html.replace(re, `<title>${title}</title>`);
  return html.replace(/<head[^>]*>/i, match => `${match}\n    <title>${title}<\/title>`);
}

function upsertMetaByName(html, name, content) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  if (re.test(html)) {
    return html.replace(re, (tag) => tag.replace(/content=["'][^"']*["']/, `content="${content}"`));
  }
  return html.replace(/<head[^>]*>/i, m => `${m}\n    <meta name="${name}" content="${content}">`);
}

function upsertMetaByProp(html, property, content) {
  const re = new RegExp(`<meta[^>]+property=["']${property}["'][^>]*>`, 'i');
  if (re.test(html)) {
    return html.replace(re, (tag) => tag.replace(/content=["'][^"']*["']/, `content="${content}"`));
  }
  return html.replace(/<head[^>]*>/i, m => `${m}\n    <meta property="${property}" content="${content}">`);
}

function setCanonical(html, url) {
  // Remove any existing canonical
  html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/ig, '');
  return html.replace(/<head[^>]*>/i, m => `${m}\n    <link rel="canonical" href="${url}">`);
}

function setRobots(html, value) {
  return upsertMetaByName(html, 'robots', value);
}

// Insert hreflang alternates (removes existing alternates first)
function setHreflang(html, map) {
  let out = html.replace(/<link[^>]+rel=["']alternate["'][^>]*>\s*/ig, '');
  const tags = Object.entries(map)
    .map(([lang, href]) => `    <link rel="alternate" hreflang="${lang}" href="${href}">`)
    .join('\n');
  return out.replace(/<head[^>]*>/i, m => `${m}\n${tags}`);
}

function replacePlaceholders(html, map) {
  let out = html;
  Object.entries(map).forEach(([k, v]) => {
    const re = new RegExp(`\\[${k}\\]`, 'g');
    out = out.replace(re, v);
  });
  return out;
}

function setH1(html, id, text) {
  const re = new RegExp(`<h1[^>]*id=["']${id}["'][^>]*>[\\s\\S]*?<\\/h1>`, 'i');
  if (re.test(html)) return html.replace(re, (m) => m.replace(/>([\s\S]*?)<\/h1>/i, `>${text}<\/h1>`));
  return html;
}

function firstNumericPrice(pricing) {
  if (!pricing) return null;
  let vals = Object.values(pricing).filter(v => typeof v === 'number');
  if (!vals.length) return null;
  return Math.min(...vals);
}

function readTemplate(file) {
  const p = path.join(projectRoot, file);
  return fs.readFileSync(p, 'utf8');
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

const projectRoot = path.resolve(__dirname, '..');
const outRoot = path.join(projectRoot, 'narzedzia');

function generate() {
  const dataPath = path.join(projectRoot, 'data.json');
  const tmplCategory = readTemplate('category.html');
  const tmplSubcategory = readTemplate('subcategory.html');
  const tmplTool = readTemplate('tool.html');

  const raw = fs.readFileSync(dataPath, 'utf8');
  const catalog = JSON.parse(raw);

  catalog.forEach((category) => {
    const catName = String(category.category).trim();
    const catSlug = slugify(catName);
    const catUrl = absoluteUrl(`narzedzia/${catSlug}`);
    const catImg = category.image ? absoluteUrl(category.image) : absoluteUrl('images/hero.webp');

    // Category page
    let catHtml = tmplCategory;
    catHtml = replaceTitle(catHtml, `Wypożyczalnia narzędzi – ${catName} | ToolShare`);
    catHtml = upsertMetaByName(catHtml, 'description', `Lista narzędzi w kategorii ${catName}. Kliknij, aby zobaczyć szczegóły i ceny wynajmu.`);
    catHtml = setRobots(catHtml, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    catHtml = setCanonical(catHtml, catUrl);
    catHtml = setHreflang(catHtml, { 'pl': catUrl + '/', 'x-default': absoluteUrl('') });
    catHtml = upsertMetaByProp(catHtml, 'og:type', 'website');
    catHtml = upsertMetaByProp(catHtml, 'og:title', `Wypożyczalnia narzędzi – ${catName} | ToolShare`);
    catHtml = upsertMetaByProp(catHtml, 'og:description', `Lista narzędzi w kategorii ${catName}. Sprawdź dostępność i ceny wynajmu.`);
    catHtml = upsertMetaByProp(catHtml, 'og:url', catUrl);
    catHtml = upsertMetaByProp(catHtml, 'og:image', catImg);
    catHtml = upsertMetaByName(catHtml, 'twitter:title', `Wypożyczalnia narzędzi – ${catName} | ToolShare`);
    catHtml = upsertMetaByName(catHtml, 'twitter:description', `Lista narzędzi w kategorii ${catName}. Sprawdź dostępność i ceny wynajmu.`);
    catHtml = upsertMetaByName(catHtml, 'twitter:image', catImg);
    catHtml = replacePlaceholders(catHtml, { 'CategoryName': catName });
    catHtml = setH1(catHtml, 'category-title', catName);

    // Cleanup fallback duplicate blocks
    catHtml = cleanupFallback(catHtml);

    const catDir = path.join(outRoot, catSlug);
    ensureDir(catDir);
    fs.writeFileSync(path.join(catDir, 'index.html'), fixAssetPaths(catHtml), 'utf8');

    // Subcategories
    (category.subcategories || []).forEach((sub) => {
      const subName = String(sub.name).trim();
      const subSlug = slugify(subName);
      const subUrl = absoluteUrl(`narzedzia/${catSlug}/${subSlug}`);
      // Prefer sub image from first tool else category
      const firstTool = (sub.tools || []).find(t => t && (t.enabled !== false));
      const subImg = firstTool?.image ? absoluteUrl(firstTool.image) : catImg;

      let subHtml = tmplSubcategory;
      subHtml = replaceTitle(subHtml, `Wypożyczalnia narzędzi – ${subName} | ToolShare`);
      subHtml = upsertMetaByName(subHtml, 'description', `Lista narzędzi w podkategorii ${subName}. Kliknij, aby zobaczyć szczegóły i ceny wynajmu.`);
      subHtml = setRobots(subHtml, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      subHtml = setCanonical(subHtml, subUrl);
      subHtml = setHreflang(subHtml, { 'pl': subUrl + '/', 'x-default': absoluteUrl('') });
      subHtml = upsertMetaByProp(subHtml, 'og:type', 'website');
      subHtml = upsertMetaByProp(subHtml, 'og:title', `Wypożyczalnia narzędzi – ${subName} | ToolShare`);
      subHtml = upsertMetaByProp(subHtml, 'og:description', `Lista narzędzi w podkategorii ${subName}. Sprawdź dostępność i ceny wynajmu.`);
      subHtml = upsertMetaByProp(subHtml, 'og:url', subUrl);
      subHtml = upsertMetaByProp(subHtml, 'og:image', subImg);
      subHtml = upsertMetaByName(subHtml, 'twitter:title', `Wypożyczalnia narzędzi – ${subName} | ToolShare`);
      subHtml = upsertMetaByName(subHtml, 'twitter:description', `Lista narzędzi w podkategorii ${subName}. Sprawdź dostępność i ceny wynajmu.`);
      subHtml = upsertMetaByName(subHtml, 'twitter:image', subImg);
      subHtml = replacePlaceholders(subHtml, { 'CategoryName': catName, 'SubcategoryName': subName });
      // Adjust breadcrumb category link to pretty URL
      subHtml = subHtml.replace('href="/narzedzia/"', `href="/narzedzia/${catSlug}/"`);
      subHtml = setH1(subHtml, 'subcategory-title', subName);

      subHtml = cleanupFallback(subHtml);

      const subDir = path.join(catDir, subSlug);
      ensureDir(subDir);
      fs.writeFileSync(path.join(subDir, 'index.html'), fixAssetPaths(subHtml), 'utf8');

      // Tools
      (sub.tools || [])
        .filter((t) => t && (t.enabled !== false))
        .forEach((tool) => {
          const toolId = String(tool.id);
          const toolName = String(tool.name).trim();
          const toolUrl = absoluteUrl(`narzedzia/${catSlug}/${subSlug}/${encodeURIComponent(toolId)}`);
          const toolImg = tool.image ? absoluteUrl(tool.image) : subImg;
          const price = firstNumericPrice(tool.pricing);
          const toolDescBase = `Informacje o narzędziu ${toolName}. ${catName} – ${subName}. Odbiór w Chrzęstawie Wielkiej, elastyczne godziny.`;
          const toolDesc = price ? `${toolDescBase} Ceny od ${price} zł/dzień.` : toolDescBase;

          let toolHtml = tmplTool;
          toolHtml = replaceTitle(toolHtml, `${toolName} – wynajem | ToolShare`);
          toolHtml = upsertMetaByName(toolHtml, 'description', toolDesc);
          toolHtml = setRobots(toolHtml, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
          toolHtml = setCanonical(toolHtml, toolUrl);
          toolHtml = setHreflang(toolHtml, { 'pl': toolUrl + '/', 'x-default': absoluteUrl('') });
          toolHtml = upsertMetaByProp(toolHtml, 'og:type', 'product');
          toolHtml = upsertMetaByProp(toolHtml, 'og:title', `${toolName} – wynajem | ToolShare`);
          toolHtml = upsertMetaByProp(toolHtml, 'og:description', toolDesc);
          toolHtml = upsertMetaByProp(toolHtml, 'og:url', toolUrl);
          toolHtml = upsertMetaByProp(toolHtml, 'og:image', toolImg);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:title', `${toolName} – wynajem | ToolShare`);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:description', toolDesc);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:image', toolImg);
          toolHtml = replacePlaceholders(toolHtml, {
            'CategoryName': catName,
            'SubcategoryName': subName,
            'ToolName': toolName,
          });
          // Adjust breadcrumb links to pretty URLs (first: category, second: subcategory)
          toolHtml = toolHtml.replace('href="/narzedzia/"', `href="/narzedzia/${catSlug}/"`);
          toolHtml = toolHtml.replace('href="/narzedzia/"', `href="/narzedzia/${catSlug}/${subSlug}/"`);
          // Ensure H1 if present follows toolName
          toolHtml = toolHtml.replace(/(<h1[^>]*id=["']tool-name["'][^>]*>)[\s\S]*?(<\/h1>)/i, `$1${toolName}$2`);

          toolHtml = cleanupFallback(toolHtml);

          const toolDir = path.join(subDir, toolId);
          ensureDir(toolDir);
          fs.writeFileSync(path.join(toolDir, 'index.html'), fixAssetPaths(toolHtml), 'utf8');
        });
    });
  });
}

function main() {
  ensureDir(outRoot);
  generate();
  console.log('Prerender complete. Static pages generated under /narzedzia');
}

main();

// Remove fallback OG/Twitter blocks and duplicate fallback description meta
function cleanupFallback(html) {
  let out = html;
  // Remove fallback OG block
  out = out.replace(/<!--\s*Fallback OG tags[\s\S]*?(?=\n\s*<meta\s+name=\"twitter:card\"|\n\s*<script|\n\s*<link|\n\s*<noscript|\n\s*<\/head)/i, '');
  // Remove fallback Twitter block
  out = out.replace(/<!--\s*Fallback Twitter tags[\s\S]*?(?=\n\s*<script|\n\s*<link|\n\s*<noscript|\n\s*<\/head)/i, '');
  // Remove fallback meta description we injected for non-JS (keep the main description)
  out = out.replace(/<meta[^>]+id=["']meta-description-fallback["'][^>]*>\s*/ig, '');
  return out;
}

function fixAssetPaths(html) {
  let out = html;
  // CSS/JS
  out = out.replace(/href=\"style\.css\"/g, 'href="/style.css"');
  out = out.replace(/src=\"script\.js\"/g, 'src="/script.js"');
  // Images and icons
  out = out.replace(/(src|href)=\"images\//g, '$1="/images/');
  out = out.replace(/href=\"favicon\.png/g, 'href="/favicon.png');
  out = out.replace(/href=\"apple-touch-icon\"/g, 'href="/apple-touch-icon"');
  return out;
}
