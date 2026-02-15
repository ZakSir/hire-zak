import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SiteShell from './components/SiteShell'
import SplashPage from './pages/SplashPage'
import StandardPage from './pages/StandardPage'
import './styles/global.css'
import './styles/standard.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<SplashPage />} />
          <Route path="/standard" element={<StandardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
