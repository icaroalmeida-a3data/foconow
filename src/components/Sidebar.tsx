import { NAV_ITEMS } from '../lib/nav'
import type { View } from '../types'

export function PixelLogo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} shapeRendering="crispEdges" aria-hidden>
      <g fill="var(--color-brand)">
        <rect x="7" y="1" width="2" height="4" />
        <rect x="7" y="11" width="2" height="4" />
        <rect x="1" y="7" width="4" height="2" />
        <rect x="11" y="7" width="4" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="11" y="3" width="2" height="2" />
        <rect x="3" y="11" width="2" height="2" />
        <rect x="11" y="11" width="2" height="2" />
        <rect x="5" y="5" width="6" height="6" />
      </g>
      <rect x="7" y="7" width="2" height="2" fill="var(--color-bg)" />
    </svg>
  )
}

/** Rail lateral do desktop. No celular a navegação é a <BottomTabBar />. */
export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="hidden shrink-0 border-ink bg-surface md:flex md:h-full md:w-56 md:flex-col md:gap-1.5 md:border-r-3 md:px-3 md:py-6"
    >
      <div className="flex items-center gap-2 px-3 pb-6">
        <PixelLogo />
        <span className="font-pixel text-xs text-ink">FocoNow</span>
      </div>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center justify-start gap-2 px-3 py-2.5 text-sm font-medium ${
              active
                ? 'pixel-btn bg-brand-light text-brand-dark'
                : 'border-2 border-transparent text-muted hover:bg-bg hover:text-ink'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
