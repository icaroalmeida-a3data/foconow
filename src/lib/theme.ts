export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'foconow-theme'

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Aplica sem gravar: quem nunca escolheu continua seguindo o tema do sistema */
export function initTheme(): Theme {
  const theme = getInitialTheme()
  document.documentElement.classList.toggle('dark', theme === 'dark')
  return theme
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}
