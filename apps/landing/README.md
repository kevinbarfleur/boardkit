# Boardkit Landing Page

The marketing website for Boardkit, built with Nuxt 3.

## Tech Stack

- **Framework**: Nuxt 3
- **Styling**: UnoCSS (consistent with main app)
- **Icons**: Lucide via @iconify-json/lucide
- **Fonts**: Inter via @nuxt/fonts
- **Deployment**: Static generation (SSG)

## Development

```bash
# From monorepo root
pnpm --filter @boardkit/landing dev

# Or from this directory
pnpm dev
```

## Build

```bash
# Generate static site
pnpm generate

# Preview production build
pnpm preview
```

## Design System

This landing page uses the same design tokens as the main Boardkit app:

- **Colors**: Primary blue (#3b82f6), dark backgrounds (#0a0a0a, #121212)
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Radius**: 8px default (--radius: 0.5rem)

See `uno.config.ts` for all design tokens and shortcuts.

## Structure

```
apps/landing/
├── assets/
│   └── css/
│       └── main.css      # Global styles & CSS variables
├── components/           # Vue components (if needed)
├── layouts/
│   └── default.vue       # Main layout with header & footer
├── pages/
│   └── index.vue         # Home page with all sections
├── public/
│   └── favicon.svg       # Site favicon
├── nuxt.config.ts        # Nuxt configuration
└── uno.config.ts         # UnoCSS configuration
```

## Deployment

The site is configured for static generation. Deploy the `.output/public` directory to any static hosting:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

```bash
pnpm generate
# Deploy .output/public/
```
