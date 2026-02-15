import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

function getSystemTheme(): Theme {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  return prefersDark ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getSystemTheme())

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setTheme(getSystemTheme())

    update()

    if (typeof (mql as MediaQueryList).addEventListener === 'function') {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    }

    const legacy = mql as MediaQueryList & {
      // eslint-disable-next-line deprecation/deprecation
      addListener?: (listener: () => void) => void
      // eslint-disable-next-line deprecation/deprecation
      removeListener?: (listener: () => void) => void
    }

    legacy.addListener?.(update)
    return () => legacy.removeListener?.(update)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return { theme }
}
