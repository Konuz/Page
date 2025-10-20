# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ToolShare (Sąsiedzka Wypożyczalnia Narzędzi) - A Polish tool rental website built as a static, data-driven single-page application. Non-commercial neighborhood initiative for sharing construction and garden tools.

## Build & Development Commands

**Development**:
- Development server: Use any static file server (e.g., Live Server on port 5500)
- No compilation needed for development - edit HTML/CSS/JS directly
- `builder.config.json` points to `http://127.0.0.1:5500/index.html`

**Production Build**:
```bash
npm run build:assets      # Bundle & minify JS/CSS to dist/assets/
npm run prerender          # Generate static HTML files + sitemap
npm run build:static       # Full production build (assets + prerender)
npm run generate:sitemap   # Generate sitemap.xml only

# Configure base URL for prerendering (default: https://toolshare.com.pl/)
BASE_URL=https://staging.toolshare.com.pl/ npm run prerender
```

**Build Output**:
- `dist/assets/script.min.js` - Bundled JS with esbuild (ES2018, IIFE format)
- `dist/assets/style.min.css` - Minified CSS with PurgeCSS, autoprefixer, cssnano
- `narzedzia/**/*.html` - Prerendered tool pages with SEO metadata
- `sitemap.xml` - Generated from data.json

## Core Architecture

### Data-Driven Router System

**Single Source of Truth**: `data.json` contains all tools, categories, subcategories, pricing, and images. This drives both dynamic rendering and static prerendering.

**Router Pattern** (`script.js`): Page type detection via unique DOM element presence:
- `#why-us` → Homepage
- `#category-title` → Category page
- `#subcategory-title` → Subcategory page
- `#tool-details-section` → Tool details page

Each page type triggers its dedicated render function that pulls data from `data.json`.

### Dual Rendering Strategy

**Development**: Client-side dynamic rendering using `script.js`
- Fetches `data.json`
- Detects page type via DOM elements
- Renders content dynamically with template functions

**Production**: Static prerendering via `scripts/prerender.js`
- Generates full HTML files in `narzedzia/` directory structure
- Pre-injects SEO metadata (title, meta tags, Open Graph, JSON-LD)
- Creates pretty URLs: `/narzedzia/[category]/[subcategory]/[tool-id]/index.html`
- Each file is self-contained with full SEO for crawlers

### URL Structure & Routing

**Pretty URLs**: Enabled on production hosting, fallback to query params in development
- Category: `/narzedzia/elektronarzedzia/`
- Subcategory: `/narzedzia/elektronarzedzia/bruzdownice/`
- Tool: `/narzedzia/elektronarzedzia/bruzdownice/bruzdownica-einhell/`

**Query Params** (development fallback):
- `category.html?cat=Elektronarzędzia`
- `subcategory.html?cat=Elektronarzędzia&sub=Bruzdownice`
- `tool.html?id=bruzdownica-einhell`

Function `canUsePrettyUrls()` detects environment and switches routing mode.

### Polish Typography System

**Orphan Prevention**: `fixPolishOrphans(text)` enforces Polish typography rules
- Replaces spaces before single-letter words/prepositions with non-breaking spaces
- Applied automatically to all dynamic content via `applyPolishTypography()`
- List of protected words: w, i, z, a, u, o, na, od, do, po, za, etc.

Must be called after any dynamic content rendering.

### SEO Architecture

**Dynamic SEO Manager** (`initializeSeoManager`):
- Updates title, meta description, Open Graph tags based on page type
- Injects JSON-LD structured data (BreadcrumbList, ItemList, Product)
- Manages canonical URLs with proper normalization
- Automatically called on page load for all page types

**Prerendered SEO**:
- `scripts/prerender.js` pre-generates SEO metadata in static HTML
- Reduces client-side processing for crawlers
- Ensures indexability even with JS disabled

### Analytics Integration

**Cookie Consent System**: `CookieManager` class with localStorage persistence
- GTM (Google Tag Manager): GTM-WLNRPMGP
- Facebook Pixel: 1469053347622952
- Microsoft Clarity: t5f2ixde6f

Scripts lazy-loaded only after consent granted. Consent banner in `cookie-popup.html`.

### Mobile Menu System

Complex multi-panel sliding navigation:
- Main panel → Tools submenu → Category-specific panels
- Managed by `initializeMobileMenu(toolCatalog)`
- State: `showMobileMenuPanel(panelId, animate)`
- Dynamically populated from `data.json` categories

## Key Technical Patterns

### DEV_MODE Detection
Automatic detection of development environment:
- Checks `window.location.hostname` for localhost/127.0.0.1/192.168.*
- Enables CORS error suppression for external scripts (Google Maps iframes)
- Affects URL routing strategy (pretty URLs vs query params)

### Search Functionality
Real-time search across all tools (`initializeSearch`):
- Normalizes diacritics for Polish characters
- Searches tool names and category names
- Results display with category breadcrumbs
- Updates URL with search query parameter

### GSAP Animations
`loadGsapLibrary()` loads GSAP from CDN, then `initScrollAnimations()` applies:
- Fade-in animations for grid items on scroll
- Stagger effects for tool cards
- Category card animations

### Tool Availability
Tools can be disabled via `"enabled": false` in `data.json`:
- `enabledTools(tools)` helper filters out disabled tools
- Prerendering skips disabled tools
- Dynamic rendering respects enabled flag

## Important Files

**Core Runtime**:
- `script.js` - All dynamic rendering logic (~2866 lines)
- `data.json` - Complete tool catalog and pricing
- `style.css` - All styling (beige/cream theme with orange accents)

**Build Scripts**:
- `scripts/build-assets.js` - esbuild + PostCSS pipeline
- `scripts/prerender.js` - Static HTML generation
- `scripts/generate-sitemap.js` - Sitemap.xml creation

**HTML Templates**:
- `index.html` - Homepage
- `category.html` - Category listing
- `subcategory.html` - Subcategory tools
- `tool.html` - Individual tool details

## Development Guidelines

### Adding New Tools
1. Edit `data.json` - add tool to appropriate category/subcategory
2. Add product image to `images/` (use `.webp` format)
3. Pricing structure:
   ```json
   "pricing": {
     "1-3 Dni": 50,              // numeric or "Zapytaj o cenę"
     "4-7 Dni": 40,
     "Sobota + Niedziela": 80,
     "Kaucja *": 150
   }
   ```
4. Run `npm run prerender` to generate static HTML
5. Polish orphans applied automatically

### Modifying Categories
Edit `data.json` structure. Categories/subcategories are nested arrays. Prerendering automatically creates directory structure matching slugified category names.

**Note**: The `slugify()` function handles Polish characters (ą→a, ć→c, etc.) and includes fallbacks for mojibake encoding artifacts that may appear in data.

### Styling Changes
- Edit `style.css` directly
- For production: `npm run build:assets` to minify with PurgeCSS
- CSS custom properties used extensively for theming
- Dark mode supported via `[data-theme="dark"]`
- **PurgeCSS safelist**: Classes like `active`, `hidden`, `sliding-out`, `stagger-item`, `animate`, `highlighted` are preserved, plus patterns `/^fa-/`, `/^swiper-/`, `/^splide-/`, `/^mobile-menu-/`

### SEO Updates
- Dynamic SEO: Edit `initializeSeoManager()` in `script.js`
- Static SEO: Edit prerendering logic in `scripts/prerender.js`
- Default meta tags and Open Graph images defined in prerender script

## Testing
Playwright tests available (`@playwright/test` in devDependencies)
