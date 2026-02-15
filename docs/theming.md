# Theming Guide

> How the hire-zak site handles dark mode, light mode, CSS custom properties, and theme-aware assets.

---

## Overview

The site supports **automatic dark/light theming** based on the user's system preference (`prefers-color-scheme`). There is no manual toggle — the theme follows the OS setting in real time.

The theming system has three layers:
1. **CSS Custom Properties** — Design tokens defined in `global.css`
2. **`data-theme` Attribute** — Applied to `<html>` by the `useTheme` hook
3. **Theme-Aware Assets** — Company logos and profile photo support per-theme variants

---

## CSS Custom Properties

All colors, spacing, and visual values are defined as CSS custom properties on `:root` (dark theme default) and overridden via `[data-theme="light"]`.

### Dark Theme (Default)

```css
:root {
  color-scheme: dark;
  
  /* Backgrounds */
  --bg: #07010f;                        /* Deep dark purple-black */
  --bg2: #02040f;                       /* Even darker for gradient end */
  
  /* Cards & Borders */
  --card: rgba(255, 255, 255, 0.06);    /* Subtle glass card background */
  --card2: rgba(255, 255, 255, 0.08);   /* Slightly more visible card */
  --border: rgba(255, 255, 255, 0.14);  /* Subtle border */
  
  /* Text */
  --text: rgba(255, 255, 255, 0.93);    /* Primary text */
  --muted: rgba(255, 255, 255, 0.72);   /* Secondary text */
  --muted2: rgba(255, 255, 255, 0.58);  /* Tertiary text */
  
  /* Brand Palette */
  --cyan: #22d3ee;                      /* Primary brand accent */
  --blue: #1d4ed8;                      /* Deep blue */
  --deepBlue: #0b102a;                  /* Very deep blue */
  --pink: #ff2bd6;                      /* Hot pink accent */
  --purple: #8b5cf6;                    /* Purple accent */
  --yellow: #ffd21f;                    /* Yellow accent */
  
  /* Semantic Aliases */
  --brand: var(--cyan);                 /* Primary brand color */
  --brand2: var(--pink);                /* Secondary brand color */
  --brand3: var(--purple);              /* Tertiary brand color */
  --warn: #f59e0b;                      /* Warning/attention color */
  
  /* Layout */
  --radius: 18px;                       /* Default border radius */
  --max: 1120px;                        /* Max content width */
  --shadow: 0 16px 60px rgba(0, 0, 0, 0.55);  /* Card shadow */
}
```

### Light Theme

Light mode overrides are applied via the `[data-theme="light"]` selector in `global.css`. The palette shifts to:
- White/light gray backgrounds
- Dark text (`rgba(8, 10, 18, ...)`)
- Adjusted card translucency
- Softer shadows

### Standard Page

The Standard page (`standard.css`) uses its own hardcoded light-on-white scheme regardless of system theme:
```css
.standardPage {
  background: rgba(255, 255, 255, 0.96);
  color: rgba(8, 10, 18, 0.92);
}
```

This ensures the print output is always dark-on-light.

---

## The `useTheme` Hook

**File**: `src/site/src/lib/useTheme.ts`

```typescript
import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme())
  // ... listens to matchMedia changes
  // ... applies data-theme attribute to <html>
  return { theme }
}
```

### Behavior
1. On mount, reads `window.matchMedia('(prefers-color-scheme: dark)')`
2. Sets `document.documentElement.setAttribute('data-theme', theme)`
3. Listens for `change` events on the media query
4. Falls back to legacy `addListener` API for older browsers
5. Returns the current `theme` value for use by components

### Usage in Components
```tsx
const { theme } = useTheme()
const logoSrc = resolveLogoUri(company.logo, theme)
```

---

## Theme-Aware Assets

### Logo Resolution

The `logo.ts` module (`src/site/src/lib/logo.ts`) resolves image URLs based on the current theme.

#### `LogoLike` Type

Logos can be defined in two formats:

**Simple URI:**
```json
{
  "uri": "https://example.com/logo.png",
  "altText": "Company Logo"
}
```

**Theme Variants:**
```json
{
  "light": "/assets/light-mode/company-logo.png",
  "dark": "/assets/dark-mode/company-logo.png",
  "invariant": "/assets/invariant/company-logo.png",
  "altText": "Company Logo"
}
```

#### Resolution Order

```
resolveLogoUri(logo, theme)
  ├─ logo.uri exists? → return normalized(uri)
  ├─ logo.invariant exists? → return normalized(invariant)
  ├─ theme === 'dark' && logo.dark? → return normalized(dark)
  ├─ theme === 'light' && logo.light? → return normalized(light)
  ├─ logo.light exists? → return normalized(light)  // fallback
  ├─ logo.dark exists? → return normalized(dark)    // fallback
  └─ return undefined
```

#### Path Normalization

The `normalizePath()` function handles various input formats:

| Input | Output | Notes |
|-------|--------|-------|
| `https://example.com/logo.png` | `https://example.com/logo.png` | URLs passed through |
| `data:image/png;base64,...` | `data:image/png;base64,...` | Data URIs passed through |
| `/assets/dark-mode/logo.png` | `/assets/dark-mode/logo.png` | Already correct |
| `src/assets/dark-mode/logo.png` | `/assets/dark-mode/logo.png` | Strips prefix |
| `/src/site/src/assets/dark-mode/logo.png` | `/assets/dark-mode/logo.png` | Strips prefix |
| `assets/dark-mode/logo.png` | `/assets/dark-mode/logo.png` | Adds leading `/` |
| `logo.png` | `/logo.png` | Adds leading `/` |

### Asset Directory Structure

```
src/site/public/assets/
├── dark-mode/        # Logos/images for dark theme
├── light-mode/       # Logos/images for light theme
├── invariant/        # Theme-independent logos
└── photos/           # Profile photos and misc images
```

The same structure is mirrored in `src/site/src/assets/` for Vite import resolution.

---

## Component-Level Theming

### MatrixBackground

Reads the `data-theme` attribute directly from `document.documentElement`:

```typescript
const pickColor = () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark'
  if (theme === 'light') {
    return { fade: 'rgba(255,255,255,0.26)', ink: 'rgba(139,92,246,0.18)', ... }
  }
  return { fade: 'rgba(0,0,0,0.32)', ink: 'rgba(255,43,214,0.16)', ... }
}
```

### SkillShowcase

Uses hardcoded category colors that work well on both dark and light backgrounds:

```typescript
const CATEGORY_COLORS: Record<string, string> = {
  'AI & LLMs': '#22d3ee',      // Cyan
  'Governance': '#8b5cf6',      // Purple
  'Cloud': '#3b82f6',           // Blue
  'Languages': '#10b981',       // Emerald
  'Leadership': '#ff2bd6',      // Pink
}
```

### SkillConstellation

Uses a deterministic hash of the group name to assign one of four colors, ensuring consistent coloring across theme switches.

---

## Body Background

The body uses a CSS gradient that shifts based on the theme:

```css
body {
  background: linear-gradient(180deg, var(--bg), var(--bg2));
  color: var(--text);
}
```

In dark mode: deep purple-black gradient  
In light mode: light gray-white gradient

---

## Print Theming

The Standard page always renders with a white background and dark text, regardless of the system theme. Print-specific CSS:

```css
@media print {
  /* Hides navigation, backgrounds, decorative elements */
  .standardNoPrint { display: none !important; }
  
  .standardPage {
    box-shadow: none;
    border: none;
    border-radius: 0;
  }
}
```

---

## Adding a New Theme Color

1. Add the CSS custom property to `:root` in `global.css`:
   ```css
   :root {
     --newColor: #hex;
   }
   ```

2. Add the light-mode override in `[data-theme="light"]`:
   ```css
   [data-theme="light"] {
     --newColor: #differentHex;
   }
   ```

3. Use it in components via `var(--newColor)` or in TypeScript via inline styles

---

## Design Philosophy

The color palette is described in the code as **"bi/pan-inspired, blue-forward"**:
- **Cyan** (`#22d3ee`) — Primary accent, used for links, brand elements, and the dominant skill color
- **Pink** (`#ff2bd6`) — Secondary accent, used for highlights and matrix rain ink
- **Purple** (`#8b5cf6`) — Tertiary accent, used for governance skills and supporting gradients
- **Yellow** (`#ffd21f`) — Sparingly used for warm accents
- **Deep Blue** (`#0b102a`) — Used for deep background layers

The overall aesthetic prioritizes:
- Glassmorphism (translucent cards with `backdrop-filter`)
- Gradient overlays and radial gradients
- Subtle glow effects (`drop-shadow`, `filter: blur`)
- High contrast text on dark backgrounds
