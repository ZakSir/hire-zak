import { Link, Outlet, useLocation } from 'react-router-dom'
import { siteConfig } from '../lib/config'
import SwooshField from './SwooshField'

export default function SiteShell() {
  const location = useLocation()
  const onSplash = location.pathname !== '/standard'

  return (
    <div>
      {siteConfig.enableSwooshField && <SwooshField enabled={onSplash} />}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <header className="topNav splashNoPrint" style={{ position: 'relative', zIndex: 1 }}>
          <div className="container">
            <div className="topNavInner">
              <div className="brand">
                {onSplash ? (
                  <Link className="btn navPrintBtn" to="/standard" title="Standard / Print view">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: '-3px' }}>
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </Link>
                ) : (
                  <Link className="btn" to="/">
                    ← Splash
                  </Link>
                )}
              </div>
              <div className="navLinks" />
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
