import { NAV_ITEMS } from '../lib/nav'
import type { View } from '../types'

/**
 * Navegação principal no celular: barra fixa embaixo, ao alcance do polegar.
 * No desktop quem manda é a <Sidebar />, então esta some a partir de md.
 */
export function BottomTabBar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="grid shrink-0 grid-cols-5 border-t-3 border-ink bg-surface pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {NAV_ITEMS.map(({ id, label, shortLabel, icon: Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex h-[56px] flex-col items-center justify-center gap-1 border-t-3 ${
              active ? 'border-brand bg-brand-light text-brand-dark' : 'border-transparent text-muted'
            }`}
          >
            <Icon size={21} />
            <span className="text-xs leading-none">{shortLabel ?? label}</span>
          </button>
        )
      })}
    </nav>
  )
}
