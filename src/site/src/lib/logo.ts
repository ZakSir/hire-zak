import type { Theme } from './useTheme'

export type LogoVariant = {
  light?: string
  dark?: string
  invariant?: string
}

export type LogoLike =
  | {
      uri: string
      altText?: string
      alt?: string
    }
  | {
      light?: string
      dark?: string
      invariant?: string
      altText?: string
      alt?: string
    }

function isVariantLogo(logo: LogoLike): logo is Extract<LogoLike, { light?: string; dark?: string; invariant?: string }> {
  return !('uri' in logo)
}

function normalizePath(p: string): string {
  // Allow users to put either:
  // - "/assets/..." (recommended)
  // - "src/assets/..." or "/src/site/src/assets/..." (will be normalized)
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p

  const idx = p.indexOf('/assets/')
  if (idx >= 0) return p.slice(idx)

  const idx2 = p.indexOf('assets/')
  if (idx2 >= 0) return `/${p.slice(idx2)}`

  if (!p.startsWith('/')) return `/${p}`
  return p
}

export function resolveLogoUri(logo: LogoLike | undefined, theme: Theme): string | undefined {
  if (!logo) return undefined

  if ('uri' in logo && typeof logo.uri === 'string') {
    return normalizePath(logo.uri)
  }

  if (!isVariantLogo(logo)) return undefined

  const inv = logo.invariant
  if (inv) return normalizePath(inv)

  const themed = theme === 'dark' ? logo.dark : logo.light
  if (themed) return normalizePath(themed)

  const fallback = logo.light ?? logo.dark
  return fallback ? normalizePath(fallback) : undefined
}

export function resolveLogoAlt(logo: LogoLike | undefined, fallback: string): string {
  if (!logo) return fallback
  const alt = logo.altText ?? logo.alt
  return alt ? String(alt) : fallback
}
