# Repository Guidelines

## Project Structure & Module Organization
- Root static site with data‑driven pages.
- Key files: `index.html`, `category.html`, `subcategory.html`, `tool.html`, `style.css`, `script.js`, `data.json`.
- Generated pages: `narzedzia/<category>/index.html` (and nested) via prerender.
- Assets in `images/` (prefer `.webp`). Utility scripts in `scripts/`.

Example layout:
```
/ scripts/ (prerender, sitemap)  / images/  / narzedzia/  data.json  style.css  script.js
```

## Build, Test, and Development Commands
- `npm run prerender` — Generate category/subcategory/tool pages into `narzedzia/` and refresh meta tags.
- `npm run generate:sitemap` — Rebuild `sitemap.xml` from `data.json`.
- Local preview: `npx serve .` or `python3 -m http.server 8080` and open `http://localhost:8080/`.
- Optional E2E: `npx playwright test` (after `npm i` and `npx playwright install`).

## Coding Style & Naming Conventions
- Indentation: 4 spaces (HTML/CSS/JS). Keep lines readable (<120 chars where possible).
- HTML: semantic structure, descriptive `alt`, consistent meta; avoid inline styles.
- CSS: use custom properties (kebab‑case), mobile‑first; prefer utility classes already present.
- JS: plain ES modules/patterns in `script.js`; small functions, early returns, no global leaks.
- Data: stable `id` for each tool; image paths under `images/` with kebab‑case filenames (e.g., `szlifierka-mimosrodowa.webp`).
- Slugs: lowercase, hyphen‑separated; match output under `narzedzia/`.

## Testing Guidelines
- Framework: Playwright (`@playwright/test`) for optional E2E.
- Location: `tests/e2e/*.spec.ts` (create if needed).
- Conventions: one scenario per spec, deterministic selectors; include basic navigation checks for homepage → category → tool.
- Run locally: `npx playwright test` (headful: `--headed`).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, scopes like `(seo)`, `(mobile)`, `(css)`.
- Commits: small, focused; include context (e.g., affected page or component).
- PRs must include: clear description, before/after screenshots for UI, steps to test, note if `prerender`/`generate:sitemap` was run, and linked issue (if any).

## Security & Configuration Tips
- Do not commit secrets; keep `.env` local. Use `.env.example` as a template.
- Respect CSP set in HTML; host over HTTPS to avoid dev‑only console noise.
- Images should be optimized `.webp`; check lighthouse basics before merging.
