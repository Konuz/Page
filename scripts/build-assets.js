#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const purgecss = require('@fullhuman/postcss-purgecss');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist', 'assets');

function ensureDist() {
  fs.mkdirSync(distDir, { recursive: true });
}

async function bundleJs() {
  await esbuild.build({
    entryPoints: [path.join(projectRoot, 'script.js')],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'iife',
    target: ['es2018'],
    outfile: path.join(distDir, 'script.min.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
      '__DEV__': 'false'
    }
  });
}

async function bundleCss() {
  const cssPath = path.join(projectRoot, 'style.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const purgePlugin = purgecss({
    content: [
      path.join(projectRoot, 'index.html'),
      path.join(projectRoot, 'category.html'),
      path.join(projectRoot, 'subcategory.html'),
      path.join(projectRoot, 'tool.html'),
      path.join(projectRoot, 'polityka-prywatnosci.html'),
      path.join(projectRoot, 'regulamin.html'),
      path.join(projectRoot, 'o-nas.html'),
      path.join(projectRoot, 'narzedzia/**/*.html'),
      path.join(projectRoot, 'script.js')
    ],
    safelist: {
      standard: [
        'active',
        'hidden',
        'sliding-out',
        'grid-scroll',
        'submenu-scrollable',
        'stagger-item',
        'animate',
        'highlighted',
        'loading',
        'loaded',
        'error',
        'disabled',
        'subpage'
      ],
      deep: [/^fa-/, /^swiper-/, /^splide-/, /^mobile-menu-/]
    },
    defaultExtractor: (content) => content.match(/[^\s"'`{}()<>:@]+/g) || []
  });

  const result = await postcss([
    purgePlugin,
    autoprefixer,
    cssnano({ preset: 'default' })
  ]).process(css, {
    from: cssPath,
    to: path.join(distDir, 'style.min.css'),
    map: { inline: false }
  });

  fs.writeFileSync(path.join(distDir, 'style.min.css'), result.css, 'utf8');
  if (result.map) {
    fs.writeFileSync(path.join(distDir, 'style.min.css.map'), result.map.toString(), 'utf8');
  }
}

(async () => {
  try {
    ensureDist();
    await Promise.all([bundleJs(), bundleCss()]);
    console.log('✓ Assets bundled to dist/assets');
  } catch (error) {
    console.error('Asset build failed:', error);
    process.exitCode = 1;
  }
})();
