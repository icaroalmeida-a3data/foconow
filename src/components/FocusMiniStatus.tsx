import { Pause, Timer } from 'lucide-react'
import { useAppStore } from '../store'
import { SESSION_LABELS } from '../lib/pomodoro'
import type { View } from '../types'

/**
 * `bar` é a faixa fixa acima da tab bar no celular — dá para voltar ao timer
 * de qualquer tela sem ocupar mais uma linha do header. `chip` é a do desktop.
 */
export function FocusMiniStatus({
  onNavigate,
  variant = 'chip',
}: {
  onNavigate: (v: View) => void
  variant?: 'chip' | 'bar'
}) {
  const mode = useAppStore((s) => s.timerMode)
  const secondsLeft = useAppStore((s) => s.timerSecondsLeft)
  const running = useAppStore((s) => s.timerRunning)
  const sessionId = useAppStore((s) => s.timerSessionId)
  const taskId = useAppStore((s) => s.timerTaskId)
  const tasks = useAppStore((s) => s.tasks)

  if (!sessionId) return null

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  if (variant === 'bar') {
    const activeTask = mode === 'foco' ? tasks.find((t) => t.id === taskId) : undefined
    return (
      <button
        onClick={() => onNavigate('focus')}
        className="flex h-[44px] shrink-0 items-center justify-between gap-3 border-t-3 border-ink bg-focus px-4 text-white md:hidden"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm">
          {running ? <Timer size={16} className="shrink-0" /> : <Pause size={16} className="shrink-0" />}
          <span className="truncate">
            {SESSION_LABELS[mode]}
            {activeTask ? ` · ${activeTask.title}` : ''}
          </span>
        </span>
        <span className="shrink-0 font-pixel text-xs tabular-nums">
          {minutes}:{seconds}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={() => onNavigate('focus')}
      title="Voltar para o timer"
      className={`pixel-btn flex items-center gap-2 px-3 py-1 text-sm font-medium ${
        running ? 'bg-focus text-white' : 'bg-focus-light text-focus'
      }`}
    >
      {running ? <Timer size={15} /> : <Pause size={15} />}
      {SESSION_LABELS[mode]} · {minutes}:{seconds}
    </button>
  )
}
