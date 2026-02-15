# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # hire-zak (new static site)

  New resume site implementation living in `src/site`.

  ## Data source

  All pages render from `public/resume.json` (copied from the repo root `resume.json`).

  ## Pages

  - `/` – Splash (parallax + scroll-in animations)
  - `/standard` – Standard resume layout optimized for printing/PDF

  ## Local dev

  ```zsh
  cd /Users/zakfargo/s/hire-zak
  npm run site:dev
  ```

  Or directly:

  ```zsh
  cd /Users/zakfargo/s/hire-zak/src/site
  npm run dev
  ```

  ## Build

  ```zsh
  cd /Users/zakfargo/s/hire-zak
  npm run site:build
  ```

  Output: `src/site/dist/`

  ## Deploy notes (Azure Static Websites / SWA)

  This is a client-side SPA.

  If your host/CDN doesn’t support SPA fallback, deep-linking to `/standard` may 404.

  - Azure Static Web Apps: add `staticwebapp.config.json` with a navigation fallback to `/index.html`.
  - Azure Storage Static Website: configure a route fallback (common workaround: copy `dist/index.html` to `dist/404.html` during deploy).
    languageOptions: {
