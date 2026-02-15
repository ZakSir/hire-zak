# Deployment Guide

> How to build and deploy the hire-zak site to Azure Static Web Apps.

---

## Overview

The site is deployed as a **static single-page application (SPA)** to [Azure Static Web Apps](https://azure.microsoft.com/products/app-service/static). The build process compiles TypeScript, bundles the React app with Vite, and produces a `dist/` folder containing only static assets.

---

## Build Process

### Step 1: Install Dependencies

```bash
# From repo root
cd src/site
npm install
```

### Step 2: Validate Resume Data (Optional but Recommended)

```bash
npm run check:resume
# Or from root:
npm run site:check:resume
```

This runs `scripts/check-resume-json.mjs`, which verifies that `public/resume.json` is valid JSON. It does not perform Zod schema validation (that happens at runtime in the browser).

### Step 3: Build

```bash
npm run build
# Or from root:
npm run site:build
```

This runs two steps:
1. `tsc -b` — TypeScript compilation (type checking only, no emit)
2. `vite build` — Bundles the app into `dist/`

### Step 4: Preview Locally (Optional)

```bash
npm run preview
# Or from root:
npm run site:preview
```

Serves the `dist/` folder on a local HTTP server for final verification.

---

## Build Output

After `npm run build`, the `src/site/dist/` folder contains:

```
dist/
├── index.html                    # SPA entry point
├── resume.json                   # Copied from public/
├── vite.svg                      # Favicon
├── assets/
│   ├── index-[hash].js          # Main JS bundle
│   ├── index-[hash].css         # Main CSS bundle
│   ├── dark-mode/               # Theme-specific logos
│   ├── light-mode/
│   ├── invariant/
│   └── photos/
```

File names include content hashes for cache-busting. The `resume.json` file is served directly (not bundled) so it can be updated independently.

---

## Azure Static Web Apps Configuration

### `staticwebapp.config.json`

Located at `src/site/staticwebapp.config.json`, this file configures Azure SWA behavior:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": [
      "/assets/*",
      "/resume.json",
      "/*.css",
      "/*.js",
      "/*.ico",
      "/*.png",
      "/*.jpg",
      "/*.svg"
    ]
  }
}
```

### What This Does

| Behavior | Description |
|----------|-------------|
| **SPA Fallback** | Any URL that doesn't match a static file → serves `index.html` |
| **Exclusions** | Asset files are served directly without rewriting |
| **Client Routing** | `/standard`, `/`, and any other React Router path all work via the fallback |

### How It Works

1. User navigates to `https://hirezak.com/standard`
2. Azure SWA checks: does `/standard` match a static file? No.
3. Azure SWA checks: does `/standard` match an exclusion pattern? No.
4. Azure SWA serves `index.html` instead
5. React Router in the browser matches `/standard` → renders `StandardPage`

For `https://hirezak.com/resume.json`:
1. Azure SWA checks: does `/resume.json` match an exclusion? Yes (`/resume.json`)
2. Azure SWA serves the actual `resume.json` file

---

## Deployment Methods

### Method 1: Azure Portal (Manual)

1. Create an Azure Static Web Apps resource in the Azure Portal
2. Connect to the GitHub repository (`ZakSir/hire-zak`)
3. Configure build settings:
   - **App location**: `src/site`
   - **Output location**: `dist`
   - **API location**: (leave empty — no API)
4. Azure will auto-detect Vite and set up the build

### Method 2: GitHub Actions (CI/CD)

Azure Static Web Apps automatically creates a GitHub Actions workflow when you connect the repository. The workflow:

1. Triggers on push to the configured branch
2. Installs Node.js dependencies
3. Runs `npm run build` in `src/site/`
4. Deploys `dist/` to Azure

#### Typical Workflow Configuration

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main, newsite]
  pull_request:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: src/site
          output_location: dist
```

### Method 3: Azure CLI

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Build the site
cd src/site
npm run build

# Deploy
swa deploy dist/ \
  --deployment-token $AZURE_STATIC_WEB_APPS_API_TOKEN \
  --env production
```

### Method 4: SWA CLI (Local Development)

```bash
# Install SWA CLI globally
npm install -g @azure/static-web-apps-cli

# Start local emulation of Azure SWA
swa start dist/ --port 4280
```

This emulates the Azure SWA environment locally, including the navigation fallback behavior.

---

## Environment Considerations

### No Server-Side Rendering

The site is a pure client-side SPA. There is:
- No server-side rendering (SSR)
- No API backend
- No Azure Functions
- No database

All data comes from the static `resume.json` file.

### External Assets

Some assets are hosted on Azure Blob Storage:
- Company logos (Accenture, Microsoft, etc.)
- Profile photo

These are referenced as full URLs in `resume.json`:
```json
{
  "uri": "https://hirezak.blob.core.windows.net/public/Zak-Resume-Shot.png"
}
```

To self-host these, place them in `src/site/public/assets/` and update the `resume.json` paths to use the local `/assets/` prefix.

### Custom Domain

To use a custom domain with Azure SWA:
1. Go to the SWA resource in Azure Portal
2. Navigate to **Custom domains**
3. Add your domain and configure DNS (CNAME or A record)
4. Azure automatically provisions a TLS certificate

---

## Updating Content

To update the resume content without changing any code:

1. Edit `src/site/public/resume.json`
2. (Optional) Copy to root `resume.json` for version control
3. Validate: `npm run site:check:resume`
4. Build: `npm run site:build`
5. Deploy (or push to trigger CI/CD)

The site will reflect the new content with no code changes needed.

---

## Performance Notes

### Bundle Size

The main performance considerations:
- **D3** — The full D3 library is imported (~250KB minified). Only `d3-arc`, `d3-force`, `d3-selection`, `d3-transition`, `d3-ease`, and `d3-interpolate` are actually used. Tree-shaking helps but a modular import would reduce the bundle.
- **React + React DOM** — ~140KB minified
- **Canvas animation** — The matrix rain effect is GPU-accelerated via `<canvas>` and has minimal CPU overhead at 24fps
- **CSS** — ~1,900 lines of global CSS (not code-split)

### Optimization Opportunities
- Import D3 modules individually instead of the full bundle
- Use `React.lazy()` for the Standard page (not needed on initial load)
- Code-split the skill visualizations (only one mode is used at a time)
- Convert `SKILLS` array to be data-driven from `resume.json`

### Caching
- Vite produces content-hashed filenames → long-term caching for JS/CSS
- `resume.json` is not hashed → updates are reflected immediately
- Azure SWA handles CDN caching automatically

---

## Troubleshooting

### SPA Routes Return 404

**Cause**: `staticwebapp.config.json` is missing or not in the build output.  
**Fix**: Ensure the file is in `src/site/` (Vite copies it to `dist/` during build).

### Resume Data Not Loading

**Cause**: `resume.json` not in `public/` or has invalid JSON.  
**Fix**: Run `npm run site:check:resume` and verify the file exists at `src/site/public/resume.json`.

### Blank Page After Deploy

**Cause**: Build output location misconfigured.  
**Fix**: Ensure the Azure SWA output location is set to `dist` (relative to `src/site/`).

### Images Not Loading

**Cause**: Logo URLs are broken or paths don't match.  
**Fix**: 
- External URLs: verify they're accessible (try in browser)
- Local assets: verify files exist in `src/site/public/assets/`
- Path format: use `/assets/dark-mode/logo.png` (leading slash, no `src/` prefix)

### Theme Not Switching

**Cause**: `data-theme` attribute not being set.  
**Fix**: The `useTheme` hook must be called by a component in the tree (it's called in both `SplashPage` and `StandardPage`). Check browser DevTools for the `data-theme` attribute on `<html>`.
