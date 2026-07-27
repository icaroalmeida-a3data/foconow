import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAppStore } from './store'
import { initTheme } from './lib/theme'

// Antes do primeiro render, para não piscar o tema claro em quem usa escuro
initTheme()

// Em dev, expõe o store no console para depurar (window.__store.getState())
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__store = useAppStore
}

// Ações do store (salvar tarefa, água etc.) falham silenciosamente se a rede cair;
// isso garante que o usuário sempre veja um aviso em vez de perder a ação sem saber
window.addEventListener('unhandledrejection', () => {
  useAppStore.setState({
    toast: {
      id: Date.now(),
      kind: 'erro',
      title: 'Não foi possível salvar',
      body: 'Verifique sua conexão e tente de novo.',
    },
  })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker só no build de produção; em dev atrapalharia o HMR
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
