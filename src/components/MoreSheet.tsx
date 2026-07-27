import { useEffect } from 'react'
import { HelpCircle, Settings as SettingsIcon, X } from 'lucide-react'
import { useAppStore } from '../store'
import { levelProgress } from '../lib/rewards'
import { InstallButton } from './InstallButton'

/**
 * Bottom sheet do "⋯" no celular: tira do header tudo que não é nível/streak
 * (pontos, instalar, ajustes, ajuda) sem esconder nada atrás de um menu de desktop.
 */
export function MoreSheet({
  onClose,
  onOpenSettings,
  onOpenOnboarding,
}: {
  onClose: () => void
  onOpenSettings: () => void
  onOpenOnboarding: () => void
}) {
  const rewards = useAppStore((s) => s.rewards)
  const { level } = levelProgress(rewards.points)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rowClass =
    'flex h-[48px] items-center gap-3 border-2 border-ink bg-surface px-3 text-sm font-medium text-ink hover:bg-bg'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end bg-black/40 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mais opções"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up flex w-full flex-col gap-2.5 border-t-3 border-ink bg-surface p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-pixel text-xs text-ink">FocoNow</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-[44px] items-center justify-center border-2 border-ink bg-surface text-ink hover:bg-bg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 text-sm">
          <span className="flex-1 border-2 border-ink bg-brand-light px-2 py-2 text-center font-medium text-brand-dark">
            {rewards.points} pts
          </span>
          <span className="flex-1 border-2 border-ink bg-warn-light px-2 py-2 text-center font-medium text-warn">
            🔥 {rewards.streakDays} {rewards.streakDays === 1 ? 'dia' : 'dias'}
          </span>
          <span className="flex-1 border-2 border-ink bg-surface px-2 py-2 text-center font-medium text-ink">
            Nv {level}
          </span>
        </div>

        <button
          onClick={() => {
            onClose()
            onOpenSettings()
          }}
          className={rowClass}
        >
          <SettingsIcon size={20} />
          Ajustes de trabalho e água
        </button>

        <InstallButton variant="row" />

        <button
          onClick={() => {
            onClose()
            onOpenOnboarding()
          }}
          className={rowClass}
        >
          <HelpCircle size={20} />
          Como usar o FocoNow
        </button>
      </div>
    </div>
  )
}
