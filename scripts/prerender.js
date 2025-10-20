const fs = require('fs');
const path = require('path');

// Base URL (configurable for staging)
function getBaseUrl() {
  let base = process.env.BASE_URL || 'https://toolshare.com.pl/';
  if (!base.endsWith('/')) base += '/';
  return base;
}

// Absolute URL helper
function absoluteUrl(urlPath) {
  const base = getBaseUrl();
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

function setThemeColors(html) {
  let out = upsertMetaByName(html, 'theme-color', '#f4a261');
  out = upsertMetaByName(out, 'msapplication-TileColor', '#f4a261');
  return out;
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

function normalizePrice(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function enabledTools(tools = []) {
  return tools.filter(tool => tool && tool.enabled !== false);
}

function firstStringPrice(pricing) {
  if (!pricing || typeof pricing !== 'object') return null;
  for (const [label, value] of Object.entries(pricing)) {
    if (typeof value === 'string' && !label.toLowerCase().includes('kaucja')) {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function categoryToolStats(category) {
  let toolCount = 0;
  let minPrice = Infinity;
  (category.subcategories || []).forEach(sub => {
    enabledTools(sub.tools).forEach(tool => {
      toolCount += 1;
      const price = firstNumericPrice(tool.pricing);
      if (typeof price === 'number' && price < minPrice) {
        minPrice = price;
      }
    });
  });
  return {
    toolCount,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
  };
}

function subcategoryToolStats(subcategory) {
  const tools = enabledTools(subcategory.tools);
  let minPrice = Infinity;
  tools.forEach(tool => {
    const price = firstNumericPrice(tool.pricing);
    if (typeof price === 'number' && price < minPrice) {
      minPrice = price;
    }
  });
  return {
    toolCount: tools.length,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
  };
}

function buildCategoryDescription(name, stats) {
  const parts = [`Wypożycz ${name} w ToolShare Czernica.`];
  if (stats.toolCount > 0) {
    const countLabel = stats.toolCount === 1 ? 'narzędzie' : 'narzędzi';
    parts.push(`${stats.toolCount} ${countLabel} dostępnych od ręki.`);
  }
  if (stats.minPrice !== null) {
    parts.push(`Ceny od ${normalizePrice(stats.minPrice)} zł/dzień.`);
  }
  parts.push('Odbiór w Chrząstawie Wielkiej 7 dni w tygodniu.');
  return parts.join(' ');
}

function buildSubcategoryDescription(name, stats) {
  const parts = [`Sprawdź ${name} do wypożyczenia w ToolShare Czernica.`];
  if (stats.toolCount > 0) {
    const countLabel = stats.toolCount === 1 ? 'model' : 'modele';
    parts.push(`${stats.toolCount} ${countLabel} gotowe do odbioru.`);
  }
  if (stats.minPrice !== null) {
    parts.push(`Ceny startują od ${normalizePrice(stats.minPrice)} zł/dzień.`);
  }
  parts.push('Rezerwuj online i odbierz w Chrząstawie Wielkiej.');
  return parts.join(' ');
}

function buildToolDescription(toolName, catName, subName, price) {
  const parts = [`${toolName} do wynajęcia w ToolShare Czernica.`];
  if (price !== null) {
    parts.push(`Cena od ${normalizePrice(price)} zł za dobę.`);
  }
  parts.push(`Kategoria: ${catName} › ${subName}.`);
  parts.push('Odbiór w Chrząstawie Wielkiej 7 dni w tygodniu.');
  return parts.join(' ');
}

function readTemplate(file) {
  const p = path.join(projectRoot, file);
  return fs.readFileSync(p, 'utf8');
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

const projectRoot = path.resolve(__dirname, '..');
const outRoot = path.join(projectRoot, 'narzedzia');

// Build simple static navigation links (top-level categories only)
function buildStaticNavigation(catalog) {
  try {
    return (catalog || []).map(cat => {
      const name = String(cat.category).trim();
      const slug = slugify(name);
      return `                            <a href="/narzedzia/${slug}/" role="menuitem">${name}</a>`;
    }).join('\n');
  } catch (_) {
    return '';
  }
}

function injectStaticNavigation(html, catalog) {
  const nav = buildStaticNavigation(catalog);
  let out = html.replace('<!-- STATIC_NAVIGATION -->', nav);
  // Also handle templates without placeholder by targeting the nav container region
  out = out.replace(
    /(<div class=\"dropdown-content\" id=\"nav-categories\">)[\s\S]*?(<\/div>)/,
    (m, p1, p2) => `${p1}\n${nav}\n${p2}`
  );
  return out;
}

function jsonLdScript(obj) {
  return `    <script type=\"application/ld+json\">\n${JSON.stringify(obj)}\n    </script>`;
}

function injectBreadcrumbSchema(html, items) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url }))
  };
  let out = html.replace('<!-- BREADCRUMB_SCHEMA -->', jsonLdScript(schema));
  if (out === html) {
    // no placeholder; append before </head>
    out = html.replace(/<\/head>/i, match => `${jsonLdScript(schema)}\n${match}`);
  }
  return out;
}

function injectItemListSchema(html, entries, pageUrl) {
  const schema = {
    '@context': 'https://schema.org', '@type': 'ItemList', url: pageUrl,
    itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, url: e.url, name: e.name }))
  };
  if (html.includes('<!-- BREADCRUMB_SCHEMA -->')) {
    return html.replace('<!-- BREADCRUMB_SCHEMA -->', (m) => `${m}\n${jsonLdScript(schema)}`);
  }
  return html.replace(/<\/head>/i, match => `${jsonLdScript(schema)}\n${match}`);
}

function injectProductSchema(html, product) {
  if (html.includes('<!-- STRUCTURED_DATA -->')) {
    return html.replace('<!-- STRUCTURED_DATA -->', jsonLdScript(product));
  }
  return html.replace(/<\/head>/i, match => `${jsonLdScript(product)}\n${match}`);
}

function injectSubcategoryGrid(html, category, catSlug) {
  const cards = (category.subcategories || [])
    .map((sub) => {
      const subName = String(sub.name || '').trim();
      if (!subName) return null;
      const subSlug = slugify(subName);
      const subUrl = `/narzedzia/${catSlug}/${subSlug}/`;
      return [
        '                    <a href="' + subUrl + '" class="subcategory-card">',
        `                        <h3>${escapeHtml(subName)}</h3>`,
        '                    </a>'
      ].join('\n');
    })
    .filter(Boolean)
    .join('\n');

  const emptyState = '                    <p class="empty-state">Brak podkategorii do wyświetlenia.</p>';
  const content = cards || emptyState;
  return html.replace('<!-- Podkategorie będą dynamicznie wstawiane tutaj -->', content);
}

function injectToolsGrid(html, category, subcategory, catSlug, subSlug) {
  const tools = enabledTools(subcategory.tools);
  const cards = tools.map((tool) => {
    const toolName = String(tool.name || '').trim();
    const toolId = encodeURIComponent(String(tool.id || '').trim());
    const toolUrl = `/narzedzia/${catSlug}/${subSlug}/${toolId}/`;
    const imgRelative = tool.image ? `/${tool.image.replace(/^\//, '')}` : '/images/placeholder.webp';
    return [
      '                    <a href="' + toolUrl + '" class="tool-card">',
      '                        <div class="card-image-wrapper">',
      `                            <img src="${imgRelative}" alt="${escapeHtml(toolName)}" loading="lazy" width="300" height="200" decoding="async">`,
      '                        </div>',
      '                        <div class="tool-card-title">',
      `                            <h3>${escapeHtml(toolName)}</h3>`,
      '                        </div>',
      '                    </a>'
    ].join('\n');
  }).join('\n');

  const emptyState = '                    <p class="empty-state">Brak narzędzi w tej podkategorii.</p>';
  const content = cards || emptyState;
  return html.replace('<!-- Narzędzia z podkategorii będą wstawiane tutaj -->', content);
}

function buildPricingRows(pricing, explicitDeposit) {
  const rows = [];
  let depositValue = explicitDeposit;
  const entries = Object.entries(pricing || {});
  entries.forEach(([period, value]) => {
    const label = String(period || '').trim();
    if (!label) return;
    if (label.toLowerCase().includes('kaucja')) {
      if (depositValue === undefined) depositValue = value;
      return;
    }
    const priceDisplay = typeof value === 'number'
      ? `${normalizePrice(value)} zł / dzień`
      : escapeHtml(String(value));
    rows.push([
      '                                    <tr>',
      `                                        <td>${escapeHtml(label)}</td>`,
      `                                        <td>${priceDisplay}</td>`,
      '                                    </tr>'
    ].join('\n'));
  });

  if (!rows.length) {
    rows.push('                                    <tr><td colspan="2">Cennik dostępny wkrótce.</td></tr>');
  }

  if (depositValue !== undefined) {
    const depositDisplay = typeof depositValue === 'number'
      ? `${normalizePrice(depositValue)} zł`
      : escapeHtml(String(depositValue));
    rows.push([
      '                                    <tr>',
      '                                        <td>Kaucja <sup>**</sup></td>',
      `                                        <td>${depositDisplay}</td>`,
      '                                    </tr>'
    ].join('\n'));
  }

  return rows.join('\n');
}

function injectToolDetails(html, tool, category, subcategory, catSlug, subSlug, toolImgRelative) {
  let out = html;
  const toolName = String(tool.name || '').trim();
  const imageTag = `<img id="tool-image" src="${toolImgRelative}" alt="${escapeHtml(toolName)}" width="800" height="600" loading="eager" decoding="async" fetchpriority="high">`;
  out = out.replace(/<img id="tool-image"[^>]*>/, imageTag);

  const pricingRows = buildPricingRows(tool.pricing, tool.deposit);
  out = out.replace('                                    <!-- Cennik będzie wstawiany tutaj przez JS -->', pricingRows);

  return out;
}

function generate() {
  const dataPath = path.join(projectRoot, 'data.json');
  const tmplCategory = readTemplate('category.html');
  const tmplSubcategory = readTemplate('subcategory.html');
  const tmplTool = readTemplate('tool.html');
  let tmplHome = readTemplate('index.html');

  const raw = fs.readFileSync(dataPath, 'utf8');
  const catalog = JSON.parse(raw);

  catalog.forEach((category) => {
    const catName = String(category.category).trim();
    const catSlug = slugify(catName);
    const catUrl = absoluteUrl(`narzedzia/${catSlug}/`);
    const catImg = category.image ? absoluteUrl(category.image) : absoluteUrl('images/hero.webp');

    const catStats = categoryToolStats(category);
    const catDesc = buildCategoryDescription(catName, catStats);
    const catTitle = `${catName} – wynajem narzędzi | ToolShare Czernica`;

    // Category page
    let catHtml = cleanupFallback(tmplCategory);
    catHtml = replaceTitle(catHtml, catTitle);
    catHtml = upsertMetaByName(catHtml, 'description', catDesc);
    catHtml = setThemeColors(catHtml);
    catHtml = setRobots(catHtml, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    catHtml = setCanonical(catHtml, catUrl);
    catHtml = setHreflang(catHtml, { 'pl': catUrl, 'x-default': catUrl });
    catHtml = upsertMetaByProp(catHtml, 'og:type', 'CollectionPage');
    catHtml = upsertMetaByProp(catHtml, 'og:title', catTitle);
    catHtml = upsertMetaByProp(catHtml, 'og:description', catDesc);
    catHtml = upsertMetaByProp(catHtml, 'og:url', catUrl);
    catHtml = upsertMetaByProp(catHtml, 'og:image', catImg);
    catHtml = upsertMetaByProp(catHtml, 'og:image:alt', `${catName} - wypożyczalnia narzędzi ToolShare Czernica`);
    catHtml = upsertMetaByName(catHtml, 'twitter:title', catTitle);
    catHtml = upsertMetaByName(catHtml, 'twitter:description', catDesc);
    catHtml = upsertMetaByName(catHtml, 'twitter:image', catImg);
    catHtml = upsertMetaByName(catHtml, 'twitter:image:alt', `${catName} - wypożyczalnia narzędzi ToolShare Czernica`);
    catHtml = replacePlaceholders(catHtml, { 'CategoryName': catName });
    catHtml = setH1(catHtml, 'category-title', catName);
    catHtml = injectStaticNavigation(catHtml, catalog);
    catHtml = injectSubcategoryGrid(catHtml, category, catSlug);

    // Breadcrumb JSON-LD (SSR)
    catHtml = injectBreadcrumbSchema(catHtml, [
      { name: 'Strona główna', url: absoluteUrl('') },
      { name: catName, url: catUrl }
    ]);

    const catDir = path.join(outRoot, catSlug);
    ensureDir(catDir);
    fs.writeFileSync(path.join(catDir, 'index.html'), fixAssetPaths(catHtml), 'utf8');

    // Subcategories
    (category.subcategories || []).forEach((sub) => {
      const subName = String(sub.name).trim();
      const subSlug = slugify(subName);
      const subUrl = absoluteUrl(`narzedzia/${catSlug}/${subSlug}/`);
      // Prefer sub image from first tool else category
      const firstTool = (sub.tools || []).find(t => t && (t.enabled !== false));
      const subImg = firstTool?.image ? absoluteUrl(firstTool.image) : catImg;

      const subStats = subcategoryToolStats(sub);
      const subDesc = buildSubcategoryDescription(subName, subStats);
      const subTitle = `${subName} – wynajem narzędzi | ToolShare Czernica`;

      let subHtml = cleanupFallback(tmplSubcategory);
      subHtml = replaceTitle(subHtml, subTitle);
      subHtml = upsertMetaByName(subHtml, 'description', subDesc);
      subHtml = setThemeColors(subHtml);
      subHtml = setRobots(subHtml, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      subHtml = setCanonical(subHtml, subUrl);
      subHtml = setHreflang(subHtml, { 'pl': subUrl, 'x-default': subUrl });
      subHtml = upsertMetaByProp(subHtml, 'og:type', 'CollectionPage');
      subHtml = upsertMetaByProp(subHtml, 'og:title', subTitle);
      subHtml = upsertMetaByProp(subHtml, 'og:description', subDesc);
      subHtml = upsertMetaByProp(subHtml, 'og:url', subUrl);
      subHtml = upsertMetaByProp(subHtml, 'og:image', subImg);
      subHtml = upsertMetaByProp(subHtml, 'og:image:alt', `${subName} - ${catName} - wypożyczalnia ToolShare Czernica`);
      subHtml = upsertMetaByName(subHtml, 'twitter:title', subTitle);
      subHtml = upsertMetaByName(subHtml, 'twitter:description', subDesc);
      subHtml = upsertMetaByName(subHtml, 'twitter:image', subImg);
      subHtml = upsertMetaByName(subHtml, 'twitter:image:alt', `${subName} - ${catName} - wypożyczalnia ToolShare Czernica`);
      subHtml = replacePlaceholders(subHtml, { 'CategoryName': catName, 'SubcategoryName': subName });
      // Adjust breadcrumb category link to pretty URL
      subHtml = subHtml.replace('href="/narzedzia/"', `href="/narzedzia/${catSlug}/"`);
      subHtml = setH1(subHtml, 'subcategory-title', subName);
      subHtml = injectStaticNavigation(subHtml, catalog);
      subHtml = injectToolsGrid(subHtml, category, sub, catSlug, subSlug);

      // Inject Breadcrumb + ItemList JSON-LD (SSR)
      subHtml = injectBreadcrumbSchema(subHtml, [
        { name: 'Strona główna', url: absoluteUrl('') },
        { name: catName, url: catUrl },
        { name: subName, url: subUrl }
      ]);
      const toolsForList = (sub.tools || [])
        .filter(t => t && t.enabled !== false)
        .map(t => ({ name: String(t.name).trim(), url: absoluteUrl(`narzedzia/${catSlug}/${subSlug}/${encodeURIComponent(String(t.id))}/`) }));
      if (toolsForList.length) {
        subHtml = injectItemListSchema(subHtml, toolsForList, subUrl);
      }

      const subDir = path.join(catDir, subSlug);
      ensureDir(subDir);
      fs.writeFileSync(path.join(subDir, 'index.html'), fixAssetPaths(subHtml), 'utf8');

      // Tools
      (sub.tools || [])
        .filter((t) => t && (t.enabled !== false))
        .forEach((tool) => {
          const toolId = String(tool.id);
          const toolName = String(tool.name).trim();
          const toolUrl = absoluteUrl(`narzedzia/${catSlug}/${subSlug}/${encodeURIComponent(toolId)}/`);
          const toolImg = tool.image ? absoluteUrl(tool.image) : subImg;
          const toolImgRelative = tool.image ? `/${tool.image.replace(/^\//, '')}` : '/images/placeholder.webp';
          const priceValue = firstNumericPrice(tool.pricing);
          const normalizedPrice = normalizePrice(priceValue);
          const toolDesc = buildToolDescription(toolName, catName, subName, priceValue);

          let toolHtml = cleanupFallback(tmplTool);
          const toolTitle = `${toolName} – wynajem narzędzi | ToolShare Czernica`;
          toolHtml = replaceTitle(toolHtml, toolTitle);
          toolHtml = upsertMetaByName(toolHtml, 'description', toolDesc);
          toolHtml = setThemeColors(toolHtml);
          toolHtml = setRobots(toolHtml, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
          toolHtml = setCanonical(toolHtml, toolUrl);
          toolHtml = setHreflang(toolHtml, { 'pl': toolUrl, 'x-default': toolUrl });
          toolHtml = upsertMetaByProp(toolHtml, 'og:type', 'product');
          toolHtml = upsertMetaByProp(toolHtml, 'og:title', toolTitle);
          toolHtml = upsertMetaByProp(toolHtml, 'og:description', toolDesc);
          toolHtml = upsertMetaByProp(toolHtml, 'og:url', toolUrl);
          toolHtml = upsertMetaByProp(toolHtml, 'og:image', toolImg);
          toolHtml = upsertMetaByProp(toolHtml, 'og:image:alt', toolName);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:title', toolTitle);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:description', toolDesc);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:image', toolImg);
          toolHtml = upsertMetaByName(toolHtml, 'twitter:image:alt', toolName);
          toolHtml = replacePlaceholders(toolHtml, {
            'CategoryName': catName,
            'SubcategoryName': subName,
            'ToolName': toolName,
          });
          // Adjust breadcrumb links to pretty URLs (first: category, second: subcategory)
          toolHtml = toolHtml.replace('href="/narzedzia/"', `href="/narzedzia/${catSlug}/"`);
          toolHtml = toolHtml.replace('href="/narzedzia/"', `href="/narzedzia/${catSlug}/${subSlug}/"`);
          const toolH1 = normalizedPrice !== null
            ? `Wynajem ${toolName} – od ${normalizedPrice} zł/dzień | ToolShare Czernica`
            : `Wynajem ${toolName} | ToolShare Czernica`;
          toolHtml = toolHtml.replace(/(<h1[^>]*id=["']tool-name["'][^>]*>)[\s\S]*?(<\/h1>)/i, `$1${toolH1}$2`);

          // SSR Product + Breadcrumb JSON-LD and static nav
          try {
            const normalizedOfferPrice = normalizePrice(priceValue);
            const offer = {
              '@type': 'Offer',
              priceCurrency: 'PLN',
              availability: 'https://schema.org/InStock',
              url: toolUrl
            };
            if (normalizedOfferPrice !== null) {
              offer.price = normalizedOfferPrice;
            }
            const product = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: toolName,
              image: [toolImg],
              category: `${catName} > ${subName}`,
              url: toolUrl,
              description: toolDesc,
              offers: offer
            };
            toolHtml = injectProductSchema(toolHtml, product);
            toolHtml = injectBreadcrumbSchema(toolHtml, [
              { name: 'Strona główna', url: absoluteUrl('') },
              { name: catName, url: catUrl },
              { name: subName, url: subUrl },
              { name: toolName, url: toolUrl }
            ]);
          } catch (_) {}

          toolHtml = injectToolDetails(toolHtml, tool, category, sub, catSlug, subSlug, toolImgRelative);
          toolHtml = injectStaticNavigation(toolHtml, catalog);
          const toolDir = path.join(subDir, toolId);
          ensureDir(toolDir);
          fs.writeFileSync(path.join(toolDir, 'index.html'), fixAssetPaths(toolHtml), 'utf8');
        });
    });
  });

  // Inject SSR homepage categories and static nav
  try {
    // Static nav
    tmplHome = tmplHome.replace(
      /(<div class=\"dropdown-content\" id=\"nav-categories\">)[\s\S]*?(<\/div>)/,
      (m, p1, p2) => `${p1}\n${buildStaticNavigation(catalog)}\n${p2}`
    );
    // Category cards in #tools-grid
    const cards = (catalog || []).map(cat => {
      const name = String(cat.category).trim();
      const slug = slugify(name);
      const imgSrc = cat.image ? `/${cat.image}` : '/images/hero.webp';
      return [
        '                <a href="/narzedzia/' + slug + '/" class="category-card">',
        '                    <div class="card-image-wrapper">',
        `                        <img src="${imgSrc}" alt="${name}" loading="lazy" width="300" height="200" decoding="async">`,
        '                    </div>',
        '                    <div class="category-card-title">',
        `                        <h3>${name}</h3>`,
        '                    </div>',
        '                </a>'
      ].join('\n');
    }).join('\n');
    const markerStart = '<!-- HOME_TOOLS_GRID:START -->';
    const markerEnd = '<!-- HOME_TOOLS_GRID:END -->';
    const markerBlock = `                ${markerStart}\n${cards}\n                ${markerEnd}`;

    if (tmplHome.includes(markerStart) && tmplHome.includes(markerEnd)) {
      const markerRegex = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`);
      tmplHome = tmplHome.replace(markerRegex, markerBlock);
    } else if (tmplHome.includes('<!-- HOME_TOOLS_GRID -->')) {
      tmplHome = tmplHome.replace('<!-- HOME_TOOLS_GRID -->', `\n${markerBlock}\n                `);
    } else {
      const gridSectionRegex = /(<div id=\"tools-grid\" class=\"tools-grid\">)([\s\S]*?)(\s*<\/div>\s*<\/section>)/;
      if (gridSectionRegex.test(tmplHome)) {
        tmplHome = tmplHome.replace(gridSectionRegex, (match, opening, inner, closing) => `${opening}\n${markerBlock}\n${closing}`);
      }
    }
    fs.writeFileSync(path.join(projectRoot, 'index.html'), tmplHome, 'utf8');
  } catch (_) {}
}

function main() {
  ensureDir(outRoot);
  generate();
}

main();

// Remove fallback OG/Twitter blocks and duplicate fallback description meta
function cleanupFallback(html) {
  let out = html;
  // Remove fallback OG block
  out = out.replace(/<!--\s*Fallback OG tags[\s\S]*?(?=(?:\r?\n)?\s*<meta\s+name=\"twitter:card\"|(?:\r?\n)?\s*<script|(?:\r?\n)?\s*<link|(?:\r?\n)?\s*<noscript|(?:\r?\n)?\s*<\/head)/gi, '');
  // Remove fallback Twitter block
  out = out.replace(/<!--\s*Fallback Twitter tags[\s\S]*?(?=(?:\r?\n)?\s*<script|(?:\r?\n)?\s*<link|(?:\r?\n)?\s*<noscript|(?:\r?\n)?\s*<\/head)/gi, '');
  // Remove fallback meta description we injected for non-JS (keep the main description)
  out = out.replace(/<meta[^>]+id=["']meta-description-fallback["'][^>]*>\s*/ig, '');
  return out;
}

function fixAssetPaths(html) {
  let out = html;
  // CSS/JS
  out = out.replace(/href=\"(?:\/)?style\.css\"/g, 'href="/dist/assets/style.min.css"');
  out = out.replace(/src=\"(?:\/)?script\.js\"/g, 'src="/dist/assets/script.min.js"');
  // Images and icons
  out = out.replace(/(src|href)=\"images\//g, '$1="/images/');
  out = out.replace(/href=\"favicon\.png/g, 'href="/favicon.png');
  out = out.replace(/href=\"apple-touch-icon\"/g, 'href="/apple-touch-icon"');
  return out;
}
