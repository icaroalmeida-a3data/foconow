import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'foconow-theme'

/** Tema atual em memória + inscritos. Existe mais de um botão de tema na tela
 *  (header no desktop, bottom sheet no celular) e os dois ficam montados ao
 *  mesmo tempo — sem uma fonte única, alternar num deixa o outro desatualizado. */
let current: Theme | null = null
const listeners = new Set<() => void>()

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Aplica sem gravar: quem nunca escolheu continua seguindo o tema do sistema */
export function initTheme(): Theme {
  const theme = getInitialTheme()
  current = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
  return theme
}

export function applyTheme(theme: Theme) {
  current = theme
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
  listeners.forEach((notify) => notify())
}

/** Lê o tema atual e re-renderiza quando qualquer botão de tema o altera. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => (current ??= getInitialTheme()),
    () => 'light' as Theme,
  )
}
