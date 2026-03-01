import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Vite plugin that reads public/resume.json at build / dev-serve time
 * and injects <title> + Open Graph / Twitter Card meta tags into index.html.
 *
 * This runs at HTML-transform time so crawlers / link-preview bots see
 * the tags even though the app is a client-rendered SPA.
 */
export default function resumeMeta(opts?: { siteUrl?: string }): Plugin {
  return {
    name: 'vite-plugin-resume-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const publicDir = resolve(ctx.server?.config.root ?? process.cwd(), 'public')
        const resumePath = resolve(publicDir, 'resume.json')

        let resume: Record<string, any>
        try {
          resume = JSON.parse(readFileSync(resumePath, 'utf-8'))
        } catch {
          console.warn('[resume-meta] Could not read public/resume.json — skipping meta injection')
          return []
        }

        const person = resume?.personalInfo?.person
        if (!person) return []

        const name = `${person.givenName ?? ''} ${person.surname ?? ''}`.trim()
        const tagline = person.title ?? ''
        const title = `${name} – resume.json – ${tagline}`

        // Build a short description from the first executive-summary item
        const summaryBody =
          resume.executiveSummary?.items?.[0]?.body ??
          tagline

        // Resolve the OG image — needs an absolute URL for social previews.
        // Set VITE_SITE_URL in your .env for production (e.g. https://hirezak.com)
        const base = (opts?.siteUrl ?? process.env.VITE_SITE_URL ?? '').replace(/\/+$/, '')
        const pictureUri: string =
          (person.picture && (typeof person.picture === 'string'
            ? person.picture
            : person.picture.uri ?? person.picture.light ?? person.picture.invariant)) ?? ''
        const ogImage = pictureUri.startsWith('http') ? pictureUri : `${base}${pictureUri}`

        const tags: { tag: string; attrs: Record<string, string>; injectTo: 'head' }[] = [
          // Primary title
          { tag: 'title', attrs: {}, injectTo: 'head' },

          // Open Graph
          { tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:description', content: summaryBody }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:type', content: 'website' }, injectTo: 'head' },
          ...(ogImage
            ? [{ tag: 'meta' as const, attrs: { property: 'og:image', content: ogImage }, injectTo: 'head' as const }]
            : []),
          ...(base
            ? [{ tag: 'meta' as const, attrs: { property: 'og:url', content: base }, injectTo: 'head' as const }]
            : []),

          // Twitter Card
          { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'twitter:title', content: title }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'twitter:description', content: summaryBody }, injectTo: 'head' },
          ...(ogImage
            ? [{ tag: 'meta' as const, attrs: { name: 'twitter:image', content: ogImage }, injectTo: 'head' as const }]
            : []),

          // Standard description meta
          { tag: 'meta', attrs: { name: 'description', content: summaryBody }, injectTo: 'head' },
        ]

        // Return HtmlTagDescriptor[] — Vite will inject these into <head>.
        // For the <title> tag we need to supply `children` so we use a raw approach:
        return tags.map(t => {
          if (t.tag === 'title') {
            return { tag: 'title', children: title, injectTo: 'head' as const }
          }
          return { tag: t.tag, attrs: t.attrs, injectTo: t.injectTo }
        })
      },
    },
  }
}
