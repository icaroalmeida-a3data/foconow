import { History, LayoutDashboard, ListChecks, Timer, Trophy } from 'lucide-react'
import type { View } from '../types'

const ITEMS: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tarefas', icon: ListChecks },
  { id: 'focus', label: 'Foco', icon: Timer },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'rewards', label: 'Recompensas', icon: Trophy },
]

function PixelLogo() {
  return (
    <svg viewBox="0 0 16 16" className="size-6" shapeRendering="crispEdges" aria-hidden>
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

export function Sidebar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav className="flex shrink-0 flex-row gap-1.5 border-b-3 border-ink bg-surface px-2 py-2 md:h-full md:w-56 md:flex-col md:border-b-0 md:border-r-3 md:px-3 md:py-6">
      <div className="hidden items-center gap-2 px-3 pb-6 md:flex">
        <PixelLogo />
        <span className="font-pixel text-xs text-ink">FocoNow</span>
      </div>
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium md:flex-none md:justify-start ${
              active
                ? 'pixel-btn bg-brand-light text-brand-dark'
                : 'border-2 border-transparent text-muted hover:bg-bg hover:text-ink'
            }`}
          >
            <Icon size={18} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
