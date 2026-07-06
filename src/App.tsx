import { useEffect, useState } from 'react'
import { HelpCircle, Settings as SettingsIcon } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { StatusBar } from './components/StatusBar'
import { Dashboard } from './components/Dashboard'
import { TasksView } from './components/TasksView'
import { FocusView } from './components/FocusView'
import { HistoryView } from './components/HistoryView'
import { RewardsView } from './components/RewardsView'
import { Onboarding } from './components/Onboarding'
import { SettingsModal } from './components/SettingsModal'
import { FocusMiniStatus } from './components/FocusMiniStatus'
import { Toast } from './components/Toast'
import { InstallButton } from './components/InstallButton'
import { AuthView } from './components/AuthView'
import { useAppStore } from './store'
import { useAuth } from './lib/auth'
import { isSupabaseConfigured } from './lib/supabase'
import { migrateLocalData } from './lib/migrateLocal'
import { requestNotificationPermission } from './lib/notifications'
import { startWellnessReminders } from './lib/wellness'
import { hasSeenOnboarding } from './lib/onboarding'
import type { View } from './types'

const TITLES: Record<View, string> = {
  dashboard: 'Painel do dia',
  tasks: 'Tarefas',
  focus: 'Foco',
  history: 'Histórico',
  rewards: 'Recompensas',
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const load = useAppStore((s) => s.load)
  const loaded = useAppStore((s) => s.loaded)
  const reset = useAppStore((s) => s.reset)
  const user = useAuth((s) => s.user)
  const authLoaded = useAuth((s) => s.authLoaded)
  const initAuth = useAuth((s) => s.init)

  useEffect(() => {
    if (isSupabaseConfigured) initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!user) {
      reset()
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoadError(null)
        await migrateLocalData(user.id)
        await load()
        if (cancelled) return
        requestNotificationPermission()
        startWellnessReminders()
        if (!hasSeenOnboarding()) setOnboardingOpen(true)
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Erro ao carregar seus dados.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, load, reset])

  if (!isSupabaseConfigured) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="pixel-panel w-full max-w-md bg-surface p-6">
          <h1 className="mb-3 font-pixel text-xs text-ink">Configuração pendente</h1>
          <p className="text-sm text-muted">
            Defina as variáveis <code className="text-ink">VITE_SUPABASE_URL</code> e{' '}
            <code className="text-ink">VITE_SUPABASE_ANON_KEY</code> (arquivo <code className="text-ink">.env.local</code>{' '}
            em dev, ou Environment Variables na Vercel) e recarregue. Veja o passo a passo no README.
          </p>
        </div>
      </div>
    )
  }

  if (!authLoaded) {
    return <div className="flex h-screen items-center justify-center font-pixel text-xs text-muted">Carregando…</div>
  }

  if (!user) {
    return <AuthView />
  }

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="pixel-panel w-full max-w-md bg-surface p-6">
          <h1 className="mb-3 font-pixel text-xs text-danger">Erro ao carregar</h1>
          <p className="mb-4 text-sm text-muted">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="pixel-btn bg-brand px-4 py-1.5 text-sm font-medium text-white"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    )
  }

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center font-pixel text-xs text-muted">Carregando…</div>
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {onboardingOpen && <Onboarding onClose={() => setOnboardingOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <Toast />
      <Sidebar view={view} onChange={setView} />
      <main className="flex-1 overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-3 border-ink bg-surface px-4 py-3 md:px-6 md:py-4">
          <h1 className="font-pixel text-xs text-ink md:text-sm">{TITLES[view]}</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {view !== 'focus' && <FocusMiniStatus onNavigate={setView} />}
            <StatusBar />
            <InstallButton />
            <button
              onClick={() => setSettingsOpen(true)}
              title="Ajustes: horário de trabalho e hidratação"
              className="pixel-btn bg-surface p-1.5 text-muted hover:bg-bg hover:text-ink"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              onClick={() => setOnboardingOpen(true)}
              title="Como usar o FocoNow"
              className="pixel-btn bg-surface p-1.5 text-muted hover:bg-bg hover:text-ink"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-6">
          {view === 'dashboard' && <Dashboard onNavigate={setView} />}
          {view === 'tasks' && <TasksView onNavigate={setView} />}
          {view === 'focus' && <FocusView />}
          {view === 'history' && <HistoryView />}
          {view === 'rewards' && <RewardsView />}
        </div>
      </main>
    </div>
  )
}

export default App
