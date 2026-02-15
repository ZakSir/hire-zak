# 🚀 hire-zak

> **A data-driven, animated resume website powered by `resume.json`, built with React 19, TypeScript, Vite 7, and D3 — deployed to Azure Static Web Apps.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)
[![Azure Static Web Apps](https://img.shields.io/badge/Azure-Static_Web_Apps-0078D4?logo=microsoft-azure)](https://azure.microsoft.com/products/app-service/static)

---

## Table of Contents

- [Overview](#overview)
- [Live Site](#live-site)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Building for Production](#building-for-production)
  - [Previewing the Build](#previewing-the-build)
- [The `resume.json` Data Model](#the-resumejson-data-model)
  - [Schema Overview](#schema-overview)
  - [Validation](#validation)
  - [Extending the Schema](#extending-the-schema)
- [Pages & Routing](#pages--routing)
- [Component Reference](#component-reference)
- [Library Modules](#library-modules)
- [Styling & Theming](#styling--theming)
- [Visual Effects & Animations](#visual-effects--animations)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [Legacy CSS Layer](#legacy-css-layer)
- [Configuration](#configuration)
- [NPM Scripts](#npm-scripts)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

**hire-zak** is Zak Fargo's personal resume website. Rather than a static HTML page, the entire site is driven by a single `resume.json` file — a structured JSON document that describes personal info, executive summary, proficiencies, and work experience. The React app fetches this file at runtime, validates it against a Zod schema, and renders two completely different views:

1. **Splash Page (`/`)** — An immersive, scroll-driven, cinematic experience with animated blobs, matrix rain, D3 visualizations, parallax effects, and a terminal simulator.
2. **Standard Page (`/standard`)** — A clean, print-friendly, traditional resume layout optimized for PDF export and recruiter consumption.

The philosophy is **"data in, resume out"**: update `resume.json` and the entire site rebuilds itself — no component editing required.

---

## Live Site

| URL | Description |
|-----|-------------|
| `https://hirezak.com` | Production (Azure Static Web Apps) |

---

## Features

### 🎨 Splash Page (Immersive Experience)
- **Animated hero section** with parallax scrolling and floating blob background
- **Matrix rain canvas** — katakana-style falling characters (toggleable, respects `prefers-reduced-motion`)
- **Parallax swoosh field** — mouse-tracking gradient swooshes that respond to cursor position and scroll depth
- **Immersive job timeline** — alternating left/right full-width job cards with floating logos, stat cards, and accomplishment highlights
- **Metric extraction** — automatically parses percentages, multipliers, time units, and dollar amounts from accomplishment text and renders them as highlighted inline metrics
- **D3-powered skill visualizations** — three interchangeable modes:
  - **Skill Bars** — animated progress bars grouped by category with particle intro effects
  - **Skill Wheel** — radial mastery map with elastic node animations
  - **Skill Cloud** — floating tag cloud of hero skills
- **Skill Constellation** — force-directed D3 graph with drag interaction, group-based coloring, and camera parallax
- **MacTerminal simulator** — a realistic macOS terminal component that types out commands and shows output, cycling through demo scenarios (git log, gh pr, kubectl, pytest, etc.)
- **Sticky navigation rail** — vertical dot navigation that highlights the current section via `IntersectionObserver`
- **Metrics banner** — D3-rendered arc gauges with animated number counting and gradient fills
- **"Let's Talk" call-to-action** — contact section with gradient orb visual
- **Smooth scroll-linked animations** — fade-in sections, stagger children, reveal lines

### 📄 Standard Page (Print-Friendly)
- Clean white-background layout at 920px max-width
- Profile photo, name, title, and contact info header
- Executive summary in a 2-column grid
- Work experience with dates, teams, and bulleted accomplishments
- Skills grouped by category with level and years of experience
- Hobbies section
- One-click **Print / Save PDF** button
- Print-optimized CSS with `@media print` rules hiding navigation and non-essential elements

### 🛡️ Data Validation
- Runtime Zod schema validation of `resume.json` with friendly error display
- JSON parse error recovery with line/column/snippet context
- Pre-build validation script (`check-resume-json.mjs`)
- Graceful loading and error states for both pages

### ♿ Accessibility
- Respects `prefers-reduced-motion` — disables all canvas animations, particle effects, and transitions
- Respects `prefers-color-scheme` — automatic dark/light theme switching
- Semantic HTML with ARIA labels on interactive visualizations
- Keyboard-navigable sticky nav rail

### 🌗 Theming
- Full dark mode and light mode support
- CSS custom properties for all colors, driven by `data-theme` attribute
- Theme-aware logo resolution — supports separate dark/light/invariant logo variants per company

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (SPA)                          │
│                                                          │
│  ┌─────────────┐    ┌──────────────────────────────────┐ │
│  │  main.tsx    │───▶│  BrowserRouter                   │ │
│  │  (entry)     │    │                                  │ │
│  └─────────────┘    │  ┌────────────────────────────┐  │ │
│                      │  │  SiteShell (layout)        │  │ │
│                      │  │  ├─ MatrixBackground       │  │ │
│                      │  │  ├─ SwooshField            │  │ │
│                      │  │  ├─ Top Nav (Splash/Std)   │  │ │
│                      │  │  └─ <Outlet />             │  │ │
│                      │  └────────────────────────────┘  │ │
│                      │          │                        │ │
│                      │    ┌─────┴──────┐                │ │
│                      │    │            │                │ │
│                      │  ┌─▼──┐    ┌───▼────┐           │ │
│                      │  │ /  │    │/standard│           │ │
│                      │  │Splash│  │Standard │           │ │
│                      │  │Page │   │Page     │           │ │
│                      │  └────┘    └────────┘           │ │
│                      └──────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────┐    ┌─────────────────────────┐ │
│  │  resume.json (fetch) │───▶│  Zod validation          │ │
│  │  /public/resume.json │    │  (resume.ts)             │ │
│  └──────────────────────┘    └─────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

Deployment:
  Vite build → dist/ → Azure Static Web Apps
  staticwebapp.config.json → SPA fallback routing
```

---

## Project Structure

```
hire-zak/
├── README.md                          # ← You are here
├── LICENSE                            # MIT License
├── package.json                       # Root workspace scripts (proxy to src/site)
├── resume.json                        # Source-of-truth resume data (root copy)
├── buildInfo.json                     # Legacy build metadata
├── compilerconfig.json                # Legacy LESS compiler config
│
├── css/                               # Legacy CSS (pre-React site)
│   ├── site.less                      # Legacy LESS source
│   ├── site.css                       # Compiled output
│   ├── font/                          # Icon fonts & Cascadia Code
│   └── min/                           # Minified legacy CSS
│
├── docs/                              # 📚 Extended documentation
│   ├── resume-json-schema.md          # Full resume.json schema reference
│   ├── components.md                  # Component API reference
│   ├── theming.md                     # Theming & CSS custom properties guide
│   └── deployment.md                  # Azure Static Web Apps deployment guide
│
└── src/
    └── site/                          # ⚛️ React + Vite application
        ├── package.json               # App dependencies
        ├── index.html                 # Vite HTML entry point
        ├── vite.config.ts             # Vite configuration
        ├── tsconfig.json              # TypeScript project references
        ├── tsconfig.app.json          # App TS config (ES2022, React JSX)
        ├── tsconfig.node.json         # Node scripts TS config (ES2023)
        ├── eslint.config.js           # Flat ESLint config (TS + React)
        ├── staticwebapp.config.json   # Azure SWA routing config
        │
        ├── public/                    # Static assets (served as-is by Vite)
        │   ├── resume.json            # Runtime resume data (fetched by app)
        │   └── assets/                # Images organized by theme
        │       ├── dark-mode/         # Dark theme logos
        │       ├── light-mode/        # Light theme logos
        │       ├── invariant/         # Theme-independent logos
        │       └── photos/            # Profile and misc photos
        │
        ├── scripts/
        │   └── check-resume-json.mjs  # Pre-build JSON validation script
        │
        └── src/                       # Application source code
            ├── main.tsx               # React entry point + router setup
            ├── App.tsx                # (Unused — routing handled in main.tsx)
            ├── App.css                # Default Vite template CSS (unused)
            ├── index.css              # Default Vite template CSS (unused)
            │
            ├── components/            # React components
            │   ├── SiteShell.tsx       # Root layout (nav + backgrounds + Outlet)
            │   ├── MacTerminal.tsx     # Animated terminal simulator
            │   ├── MatrixBackground.tsx # Canvas-based matrix rain effect
            │   ├── MetricsBanner.tsx   # D3 arc gauge + bar metrics display
            │   ├── SkillConstellation.tsx # D3 force-directed skill graph
            │   ├── SkillShowcase.tsx   # Skill bars, wheel, and cloud (3 modes)
            │   ├── StickyNavRail.tsx   # Vertical dot navigation sidebar
            │   └── SwooshField.tsx     # Parallax gradient swoosh overlay
            │
            ├── lib/                   # Shared utilities and hooks
            │   ├── resume.ts          # Resume types, Zod schemas, fetch + validation
            │   ├── config.ts          # Feature toggles (matrix, blobs, skill mode)
            │   ├── logo.ts            # Theme-aware logo URL resolution
            │   ├── metrics.ts         # Metric extraction from accomplishment text
            │   ├── useInView.ts       # IntersectionObserver hook for scroll reveals
            │   └── useTheme.ts        # System theme detection hook (dark/light)
            │
            ├── pages/                 # Route-level page components
            │   ├── SplashPage.tsx     # Immersive animated resume (/)
            │   └── StandardPage.tsx   # Print-friendly resume (/standard)
            │
            └── styles/                # Global CSS
                ├── global.css         # Design system, animations, layouts (~1900 lines)
                └── standard.css       # Print/standard page-specific styles
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | ≥ 18.x | JavaScript runtime |
| [npm](https://www.npmjs.com/) | ≥ 9.x | Package manager (ships with Node) |

### Installation

```bash
# Clone the repository
git clone https://github.com/ZakSir/hire-zak.git
cd hire-zak

# Install root dependencies (gulp for legacy CSS — optional)
npm install

# Install site dependencies
cd src/site
npm install
cd ../..
```

### Development

```bash
# Start the Vite dev server with HMR (from repo root)
npm run site:dev

# Or from src/site directly
cd src/site && npm run dev
```

The dev server starts at `http://localhost:5173` with hot module replacement.

### Building for Production

```bash
# TypeScript compilation + Vite production build
npm run site:build

# Output goes to: src/site/dist/
```

### Previewing the Build

```bash
# Serve the production build locally
npm run site:preview
```

---

## The `resume.json` Data Model

The entire site is driven by a single `resume.json` file located at `src/site/public/resume.json`. The app fetches this file at runtime via `fetch()`, parses it, validates it against a Zod schema, and renders the content.

There is also a root-level `resume.json` that serves as the source-of-truth for version control.

### Schema Overview

```
ResumeJson
├── personalInfo
│   └── person
│       ├── givenName: string (required)
│       ├── surname: string (required)
│       ├── picture?: LogoVariant (theme-aware image)
│       ├── email?: string
│       ├── location?: string
│       ├── title?: string
│       └── hobbies?: string[]
│
├── executiveSummary?
│   ├── title?: string
│   └── items?: Array<{ title: string, body: string }>
│
├── proficiencies?: Array<SkillCategory>
│   ├── skillCategoryName?: string
│   ├── skillNames: string[] (min 1)
│   ├── level?: string
│   ├── yearsOfExperience?: number (0–80)
│   └── favoriteActivities?: string[]
│
└── experience?: Array<Experience>
    ├── company: { displayName: string, logo?: LogoVariant }
    ├── contractorTo?: string
    ├── title: string (required)
    ├── team?: string
    ├── startDate: { year: number, month: number }
    ├── endDate: { year, month } | null (null = "Present")
    ├── dutiesAndAccomplishments: string[] (min 1)
    │
    │   ── Extended fields (optional, visualization-friendly) ──
    ├── tagline?: string
    ├── highlights?: string[]
    ├── themes?: string[]
    ├── signals?: Record<string, number> (0–1 range)
    ├── impactMetrics?: Array<{ label, value, unit?, context? }>
    ├── initiatives?: Array<{ name, problem, approach, outcome }>
    └── stack?: { methods?, libraries?, cloud?, data?, integrations? }
```

### Logo Variants

Company logos and the profile picture support theme-aware resolution:

```json
{
  "picture": {
    "light": "/assets/light-mode/logo.png",
    "dark": "/assets/dark-mode/logo.png",
    "invariant": "/assets/invariant/logo.png",
    "altText": "Company Logo"
  }
}
```

Or a simple URI:

```json
{
  "picture": {
    "uri": "https://example.com/photo.png",
    "altText": "Profile photo"
  }
}
```

The `logo.ts` module resolves the correct URL based on the current system theme.

### Validation

The app validates `resume.json` at two levels:

1. **Runtime (browser)** — `resume.ts` uses Zod schemas to validate the parsed JSON. If validation fails, the site displays a friendly error panel showing each issue's JSON path and message. Up to 30 errors are shown.

2. **Pre-build (CI/dev)** — The `check-resume-json.mjs` script validates the JSON file on disk:
   ```bash
   npm run site:check:resume
   ```

JSON parse errors include line/column context and a code snippet showing the error location.

### Extending the Schema

To add new fields to `resume.json`:

1. Add the TypeScript type to the `ResumeJson` type in `src/site/src/lib/resume.ts`
2. Add the corresponding Zod schema field (use `.optional()` for backward compatibility)
3. Update the component(s) that consume the data
4. Update `resume.json` with the new data

> 📖 See [`docs/resume-json-schema.md`](docs/resume-json-schema.md) for the complete schema reference.

---

## Pages & Routing

The app uses **React Router v7** with `BrowserRouter` and the following route structure:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `SplashPage` | Immersive animated resume experience |
| `/standard` | `StandardPage` | Clean, print-optimized traditional resume |
| `*` (catch-all) | `Navigate to /` | Redirects unknown routes to splash |

All routes are wrapped in `SiteShell`, which provides:
- The top navigation bar (Splash / Standard toggle)
- `MatrixBackground` canvas (disabled on `/standard`)
- `SwooshField` parallax overlay (disabled on `/standard`)
- The `<Outlet />` for child route rendering

### SPA Routing on Azure

The `staticwebapp.config.json` configures Azure Static Web Apps with a navigation fallback:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/resume.json", "/*.css", "/*.js", "/*.ico", "/*.png", "/*.jpg", "/*.svg"]
  }
}
```

This ensures that direct navigation to `/standard` or any client-side route serves `index.html`, while static assets are served directly.

---

## Component Reference

### `SiteShell` — Root Layout
The outermost layout component. Renders the top navigation bar with "Splash" and "Standard / Print" links, and conditionally enables background effects based on the current route. Uses React Router's `<Outlet />` to render child pages.

### `MatrixBackground` — Canvas Animation
A full-viewport `<canvas>` element rendering falling katakana characters in the style of *The Matrix*. Features:
- Theme-aware colors (pink/cyan on dark, purple/cyan on light)
- Fixed-cadence animation loop (24fps) for consistent cinematic feel
- DPR-aware rendering for crisp display on retina screens
- Configurable via `siteConfig.enableMatrixAnimation`
- Automatically disabled when `prefers-reduced-motion: reduce` is set

### `SwooshField` — Parallax Gradients
Four gradient "swoosh" elements that respond to mouse position and scroll depth via CSS custom properties driven by JavaScript. Uses critically-damped spring physics for smooth cursor following. Includes a sparkle dust overlay.

### `MacTerminal` — Terminal Simulator
A pixel-perfect macOS terminal window that cycles through demo commands:
- `git log`, `gh pr list`, `npm info`, `az cognitiveservices`, `docker images`, `pytest`, `kubectl`
- Realistic character-by-character typing with variable speed
- Staggered output line rendering
- Blinking cursor animation
- Color-coded output (success/info/warn/standard)

### `MetricsBanner` — D3 Gauge Metrics
Displays extracted metrics as animated D3 arc gauges (first 3 metrics) and progress bars (remaining metrics). Features:
- `easeElasticOut` arc transitions with gradient fills and glow filters
- Animated number counting with `easeOutExpo` easing
- Intersection Observer-triggered animations (play once when scrolled into view)
- Background particle effects

### `SkillShowcase` — Multi-Mode Skill Display
Three interchangeable visualization modes, selectable via `siteConfig`:

1. **`SkillBars`** (default) — Grouped progress bars with:
   - Particle intro burst effect
   - Staggered category card fly-in animations
   - Per-bar shimmer effects
   - Star indicators for hero skills
   - Category color coding

2. **`SkillWheel`** — Radial D3 layout where:
   - Skills radiate from center at distances proportional to mastery level
   - Elastic node entrance animations
   - Hero skill labels shown by default
   - Color-coded by category with legend

3. **`SkillCloud`** — Floating tag cloud of master/hero skills with CSS animations

### `SkillConstellation` — Force-Directed Graph
A D3 force simulation rendering skills as nodes connected by edges:
- Group-based coloring (cyan/pink/purple/yellow)
- Alphabetical and group-based link generation
- Drag interaction with alpha reheat
- Pointer-tracking camera parallax
- Hover highlighting with link dimming
- Responsive resize handling

### `StickyNavRail` — Vertical Navigation
A fixed-position vertical dot navigation sidebar:
- Main section dots (Summary, Experience, Skills, Let's Talk)
- Nested job dots under Experience with date labels
- `IntersectionObserver`-based active section tracking
- Smooth scroll-to-section on click

> 📖 See [`docs/components.md`](docs/components.md) for the full component API reference with props and usage examples.

---

## Library Modules

### `resume.ts` — Data Layer
The core data module providing:
- **TypeScript types** — `ResumeJson`, `ResumeExperience`, `ResumeSkillCategory`, etc.
- **Zod schemas** — Full validation including cross-field checks (e.g., `endDate` must be after `startDate`)
- **`loadResume()`** — Async function that fetches, parses (with error context), and validates `resume.json`
- **`validateResumeJson()`** — Synchronous validation with error/warning separation
- **`fullName()`** / **`formatMonthYear()`** — Formatting helpers

### `config.ts` — Feature Flags
Central feature toggle configuration:
```typescript
export const siteConfig = {
  enableMatrixAnimation: false,    // Matrix rain canvas
  enableBlobBackground: true,      // Floating gradient blobs
  enableSwooshField: true,         // Parallax swoosh gradients
  maxTagsPerJob: 12,               // Max initiative/theme/stack tags per job
  showSkillWheel: false,           // Radial skill wheel
  showSkillBars: true,             // Animated skill bars (default)
  showSkillCloud: false,           // Floating skill cloud
}
```

### `logo.ts` — Theme-Aware Logo Resolution
Resolves logo URLs based on the current theme:
- Supports `{ uri }` (simple) and `{ light, dark, invariant }` (theme-variant) formats
- Path normalization for flexible asset references
- Falls back through invariant → themed → opposite theme → undefined

### `metrics.ts` — Metric Extraction Engine
Parses accomplishment text for contextual numbers:
- **Matched patterns**: percentages, multipliers, time units, dollar amounts, counts with units
- **Context extraction**: looks before/after the number for descriptive words
- **`highlightMetrics()`**: splits text into metric/non-metric parts for inline highlighting
- Bare numbers without context are intentionally not matched

### `useInView.ts` — Scroll Reveal Hook
Custom React hook wrapping `IntersectionObserver`:
- Returns `{ ref, visible }` for declarative fade-in animations
- Configurable threshold (default 0.15)
- Disconnects after first intersection (one-shot reveal)
- Immediately reveals if `prefers-reduced-motion: reduce` is set

### `useTheme.ts` — System Theme Hook
Detects and tracks the system color scheme:
- Returns `{ theme }` as `'dark' | 'light'`
- Sets `data-theme` attribute on `<html>` for CSS targeting
- Listens for `matchMedia` changes (with legacy `addListener` fallback)

---

## Styling & Theming

### CSS Architecture

The app uses two global CSS files (no CSS modules or CSS-in-JS):

| File | Lines | Purpose |
|------|-------|---------|
| `global.css` | ~1,900 | Full design system: variables, layout, cards, animations, blobs, swooshes, skills, metrics, terminal, nav rail, immersive job cards |
| `standard.css` | ~214 | Print-friendly standard page: white background, clean typography, print media queries |

### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Backgrounds */
  --bg: #07010f;        --bg2: #02040f;
  
  /* Cards & borders */
  --card: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.14);
  
  /* Text */
  --text: rgba(255,255,255,0.93);
  --muted: rgba(255,255,255,0.72);
  --muted2: rgba(255,255,255,0.58);
  
  /* Brand palette (bi/pan-inspired, blue-forward) */
  --cyan: #22d3ee;      --blue: #1d4ed8;
  --pink: #ff2bd6;      --purple: #8b5cf6;
  --yellow: #ffd21f;    --deepBlue: #0b102a;
  
  /* Semantic aliases */
  --brand: var(--cyan);
  --brand2: var(--pink);
  --brand3: var(--purple);
  
  /* Layout */
  --radius: 18px;       --max: 1120px;
}
```

Light mode overrides these values via `[data-theme="light"]` selectors in `global.css`.

> 📖 See [`docs/theming.md`](docs/theming.md) for the complete theming guide.

---

## Visual Effects & Animations

| Effect | Implementation | Trigger | Reduced Motion Behavior |
|--------|---------------|---------|------------------------|
| Matrix rain | `<canvas>` + `requestAnimationFrame` | Always (if enabled) | Disabled entirely |
| Blob background | CSS `radial-gradient` + JS time-based wobble | Always | Static position |
| Swoosh parallax | CSS gradients + JS pointer/scroll tracking | Pointer movement + scroll | Disabled entirely |
| Section fade-in | CSS `opacity`/`transform` + `IntersectionObserver` | Scroll into view | Immediate reveal |
| Skill bar animation | CSS `width` transition + `IntersectionObserver` | Scroll into view | Instant fill |
| D3 arc gauges | SVG `<path>` + D3 transitions | Scroll into view | Instant render |
| Terminal typing | `setTimeout` + character-by-character state | Continuous loop | Still runs (text only) |
| Parallax hero | CSS `transform: translateY()` via scroll position | Scroll | No movement |
| Sparkle dust | CSS `@keyframes` | Always | Disabled |
| Stat card counters | `requestAnimationFrame` + easing | Scroll into view | Instant value |

---

## Accessibility

- **`prefers-reduced-motion`** — All canvas animations, parallax effects, particle systems, and CSS transitions are disabled. Content is revealed immediately.
- **`prefers-color-scheme`** — The site follows the system dark/light preference automatically.
- **ARIA labels** — The terminal is marked `role="img"` with descriptive `aria-label`. Decorative elements use `aria-hidden="true"`.
- **Semantic HTML** — Sections use `<section>`, `<nav>`, `<header>`, `<main>`, `<footer>` elements.
- **Keyboard navigation** — The sticky nav rail buttons are focusable and clickable.
- **Print accessibility** — The standard page hides all decorative elements and navigation for clean PDF output.

---

## Deployment

The site is deployed to **Azure Static Web Apps**.

### Azure SWA Configuration

The `staticwebapp.config.json` in `src/site/` configures SPA routing:
- All unmatched routes rewrite to `/index.html` (client-side routing)
- Static assets (images, CSS, JS, JSON) are excluded from the fallback

### Build Output

```bash
npm run site:build
# Output: src/site/dist/
```

The `dist/` folder contains:
- `index.html` — Single HTML entry point
- `assets/` — Hashed JS/CSS bundles
- `resume.json` — Copied from `public/`
- `assets/` — Static images (dark-mode, light-mode, invariant, photos)

> 📖 See [`docs/deployment.md`](docs/deployment.md) for the full Azure deployment guide.

---

## Legacy CSS Layer

The root `css/` directory contains the **pre-React legacy site** styles:
- `site.less` → compiled to `site.css` via Gulp + `gulp-less`
- Icon fonts (Fontello) and Cascadia Code web font
- Minified output in `css/min/`
- Controlled by `compilerconfig.json`

This layer is **not used by the React site** and exists for historical reference. The root `package.json` includes `gulp` and `gulp-less` dependencies for this legacy pipeline.

---

## Configuration

### `siteConfig` (Feature Flags)

Edit `src/site/src/lib/config.ts` to toggle visual features:

| Flag | Default | Description |
|------|---------|-------------|
| `enableMatrixAnimation` | `false` | Show matrix rain canvas background |
| `enableBlobBackground` | `true` | Show floating gradient blobs |
| `enableSwooshField` | `true` | Show parallax swoosh overlays |
| `maxTagsPerJob` | `12` | Max tags (initiatives + themes + stack) per job card |
| `showSkillWheel` | `false` | Show radial skill wheel visualization |
| `showSkillBars` | `true` | Show animated skill progress bars |
| `showSkillCloud` | `false` | Show floating skill tag cloud |

### TypeScript Configuration

The project uses TypeScript 5.9 with **project references**:
- `tsconfig.app.json` — Browser code (ES2022, React JSX, bundler module resolution, strict mode)
- `tsconfig.node.json` — Node scripts (ES2023, Node types)
- `tsconfig.json` — Parent project reference file

### ESLint Configuration

Flat ESLint config (`eslint.config.js`) with:
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` recommended rules
- `eslint-plugin-react-refresh` Vite rules
- Targets `**/*.{ts,tsx}` files
- Ignores `dist/` directory

---

## NPM Scripts

### Root (`package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `site:dev` | `npm --prefix src/site run dev` | Start Vite dev server with HMR |
| `site:build` | `npm --prefix src/site run build` | TypeScript check + Vite production build |
| `site:preview` | `npm --prefix src/site run preview` | Preview production build locally |
| `site:check:resume` | `npm --prefix src/site run check:resume` | Validate `resume.json` syntax |

### Site (`src/site/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server |
| `build` | `tsc -b && vite build` | Compile TypeScript then bundle |
| `preview` | `vite preview` | Serve production build |
| `lint` | `eslint .` | Run ESLint across all TS/TSX files |
| `check:resume` | `node scripts/check-resume-json.mjs` | Validate `public/resume.json` |

---

## Tech Stack

### Core

| Technology | Version | Purpose |
|-----------|---------|---------|
| [React](https://react.dev/) | 19.2 | UI component library |
| [React DOM](https://react.dev/) | 19.2 | DOM rendering |
| [React Router](https://reactrouter.com/) | 7.12 | Client-side routing |
| [D3](https://d3js.org/) | 7.9 | Data-driven visualizations (arcs, force graphs, transitions) |
| [Zod](https://zod.dev/) | — | Runtime schema validation (bundled in resume.ts) |

### Build & Dev

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Vite](https://vite.dev/) | 7.2 | Build tool + dev server + HMR |
| [TypeScript](https://www.typescriptlang.org/) | 5.9 | Type safety |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 5.1 | React Fast Refresh for Vite |
| [ESLint](https://eslint.org/) | 9.39 | Linting |

### Hosting

| Service | Purpose |
|---------|---------|
| [Azure Static Web Apps](https://azure.microsoft.com/products/app-service/static) | Hosting + SPA routing |
| [Azure Blob Storage](https://azure.microsoft.com/products/storage/blobs/) | External image hosting (company logos, profile photo) |

---

## Documentation

Extended documentation lives in the [`docs/`](docs/) folder:

| Document | Description |
|----------|-------------|
| [`docs/resume-json-schema.md`](docs/resume-json-schema.md) | Complete `resume.json` schema reference with all fields, types, constraints, and examples |
| [`docs/components.md`](docs/components.md) | Detailed component API reference with props, behavior, and usage patterns |
| [`docs/theming.md`](docs/theming.md) | CSS custom properties, dark/light mode, theme-aware assets guide |
| [`docs/deployment.md`](docs/deployment.md) | Azure Static Web Apps deployment, CI/CD, and configuration guide |

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2022 Zak Fargo

---

<p align="center">
  <em>Powered by <code>resume.json</code> • Built with React + Vite + D3 • Deployed on Azure Static Web Apps</em>
</p>