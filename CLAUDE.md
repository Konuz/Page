# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Polish tool rental website (ToolShare - Sąsiedzka Wypożyczalnia Narzędzi) built as a static one-page application. It's a non-commercial neighborhood tool rental initiative that helps locals access construction tools without purchasing them.

## Key Architecture

### Data-Driven Structure
- **`data.json`**: Central data source for all tools, categories, and pricing
- **Dynamic rendering**: All tool content is generated from `data.json` using JavaScript
- **No backend**: Pure client-side application with static hosting

### JavaScript Architecture
- **`script.js`**: Main application logic with router-based page detection
- **Router pattern**: Detects page type using unique DOM elements:
  - `#why-us` → Homepage
  - `#category-title` → Category page
  - `#subcategory-title` → Subcategory page
  - `#tool-details-section` → Tool details page
- **Modular functions**: Each page type has dedicated render functions
- **GSAP animations**: Uses GSAP for smooth scroll animations and UI effects

### CSS Architecture
- **CSS Custom Properties**: Extensive use of CSS variables for theming
- **Theme system**: Light/dark mode support with `[data-theme="dark"]`
- **Responsive design**: Mobile-first approach with media queries
- **Component-based**: Modular CSS classes for reusable components

## Core Development Tasks

### Adding New Tools
1. Edit `data.json` to add new tools to appropriate categories/subcategories
2. Add product images to `images/` directory (use .webp format)
3. Follow the existing data structure:
   ```json
   {
     "id": "unique-tool-id",
     "name": "Tool Name",
     "image": "images/tool_image.webp",
     "pricing": {
       "1-3 Dni": "price or 'Dodaj cenę'",
       "4-7 Dni": "price or 'Dodaj cenę'",
       "Sobota + Niedziela": "price or 'Dodaj cenę'",
       "Kaucja *": "price or 'Dodaj cenę'"
     }
   }
   ```

### Styling Guidelines
- Use CSS custom properties for consistent theming
- Follow the existing beige/cream color scheme with orange accents
- Maintain mobile-first responsive design
- Use the existing neumorphic design patterns

### JavaScript Development
- All dynamic content rendering happens in `script.js`
- Use `fixPolishOrphans()` function for proper Polish typography
- Maintain the existing router pattern for page detection
- Use GSAP for animations (already loaded via CDN)

## File Structure

```
/
├── index.html              # Main homepage
├── category.html           # Category listing page
├── subcategory.html        # Subcategory page
├── tool.html              # Individual tool details
├── polityka-prywatnosci.html # Privacy policy
├── data.json              # Central data source (IMPORTANT)
├── script.js              # Main application logic
├── style.css              # All styling
└── images/                # Product images (use .webp)
```

## Important Notes

- **Polish language**: All content is in Polish, maintain language consistency
- **Typography**: Use `fixPolishOrphans()` for proper Polish typography rules
- **Performance**: Images are optimized as .webp format
- **No build process**: Direct file editing, no compilation needed
- **Accessibility**: Maintain aria-labels and semantic HTML structure

## Development Commands

Since this is a static site, there are no build commands. Simply:
1. Edit files directly
2. Test by opening `index.html` in a browser
3. For local development, use any static file server

## Theme System

The site supports light/dark modes through CSS custom properties:
- Light theme: Default root variables
- Dark theme: `[data-theme="dark"]` overrides
- Theme switching handled by `initializeThemeSwitcher()` in `script.js`

## Mobile Menu System

Complex mobile navigation with multi-level panels:
- Main menu panel
- Tools submenu panel  
- Category-specific panels
- Managed by `initializeMobileMenu()` function

## Search Functionality

- Real-time search across all tools
- Search by tool name and category
- Results display with category breadcrumbs
- Implemented in `initializeSearch()` function