import { History, LayoutDashboard, ListChecks, Timer, Trophy } from 'lucide-react'
import type { View } from '../types'

/** Fonte única da navegação: a barra de baixo (celular) e a sidebar (desktop) leem daqui. */
export const NAV_ITEMS: {
  id: View
  label: string
  /** Rótulo curto para a tab bar, onde cada coluna tem ~78px. */
  shortLabel?: string
  icon: typeof LayoutDashboard
}[] = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tarefas', icon: ListChecks },
  { id: 'focus', label: 'Foco', icon: Timer },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'rewards', label: 'Recompensas', shortLabel: 'Prêmios', icon: Trophy },
]
