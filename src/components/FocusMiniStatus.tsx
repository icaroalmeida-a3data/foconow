import { Pause, Timer } from 'lucide-react'
import { useAppStore } from '../store'
import { SESSION_LABELS } from '../lib/pomodoro'
import type { View } from '../types'

export function FocusMiniStatus({ onNavigate }: { onNavigate: (v: View) => void }) {
  const mode = useAppStore((s) => s.timerMode)
  const secondsLeft = useAppStore((s) => s.timerSecondsLeft)
  const running = useAppStore((s) => s.timerRunning)
  const sessionId = useAppStore((s) => s.timerSessionId)

  if (!sessionId) return null

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

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
