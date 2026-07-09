import { useState } from 'react'
import { applyTheme, getInitialTheme, type Theme } from '../lib/theme'

function PixelSun() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} shapeRendering="crispEdges" aria-hidden>
      <g fill="currentColor">
        <rect x="7" y="1" width="2" height="2" />
        <rect x="7" y="13" width="2" height="2" />
        <rect x="1" y="7" width="2" height="2" />
        <rect x="13" y="7" width="2" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="11" y="3" width="2" height="2" />
        <rect x="3" y="11" width="2" height="2" />
        <rect x="11" y="11" width="2" height="2" />
        <rect x="5" y="5" width="6" height="6" />
      </g>
    </svg>
  )
}

function PixelMoon() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} shapeRendering="crispEdges" aria-hidden>
      <g fill="currentColor">
        <rect x="6" y="2" width="4" height="1" />
        <rect x="4" y="3" width="4" height="1" />
        <rect x="3" y="4" width="3" height="2" />
        <rect x="2" y="6" width="4" height="4" />
        <rect x="3" y="10" width="3" height="2" />
        <rect x="4" y="12" width="4" height="1" />
        <rect x="6" y="13" width="4" height="1" />
        <rect x="11" y="4" width="2" height="2" />
        <rect x="12" y="9" width="1" height="1" />
      </g>
    </svg>
  )
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="pixel-btn bg-surface p-1.5 text-muted hover:bg-bg hover:text-ink"
    >
      {theme === 'dark' ? <PixelSun /> : <PixelMoon />}
    </button>
  )
}
