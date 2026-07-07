import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useAppStore } from '../store'
import type { SessionType } from '../types'
import { dayKeyFromISO, todayKey } from '../lib/rewards'
import { DURATION_PRESETS, SESSION_LABELS } from '../lib/pomodoro'

const PROGRESS_SEGMENTS = 16

export function FocusView() {
  const tasks = useAppStore((s) => s.tasks)
  const sessions = useAppStore((s) => s.sessions)
  const focusTaskId = useAppStore((s) => s.focusTaskId)
  const setFocusTaskId = useAppStore((s) => s.setFocusTaskId)
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone)

  const mode = useAppStore((s) => s.timerMode)
  const durationMinutes = useAppStore((s) => s.timerDurationMinutes)
  const secondsLeft = useAppStore((s) => s.timerSecondsLeft)
  const running = useAppStore((s) => s.timerRunning)
  const sessionId = useAppStore((s) => s.timerSessionId)
  const taskId = useAppStore((s) => s.timerTaskId)
  const setTimerMode = useAppStore((s) => s.setTimerMode)
  const setTimerDurationMinutes = useAppStore((s) => s.setTimerDurationMinutes)
  const setTimerTaskId = useAppStore((s) => s.setTimerTaskId)
  const startTimer = useAppStore((s) => s.startTimer)
  const pauseTimer = useAppStore((s) => s.pauseTimer)
  const resetTimer = useAppStore((s) => s.resetTimer)
  const skipTimer = useAppStore((s) => s.skipTimer)
  const finishTimerEarly = useAppStore((s) => s.finishTimerEarly)

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks])

  // Rascunho local para permitir apagar o campo enquanto digita, sem o valor voltar pra 1
  const [durationDraft, setDurationDraft] = useState<string | null>(null)

  useEffect(() => {
    if (focusTaskId) {
      setTimerTaskId(focusTaskId)
      setFocusTaskId(null)
    }
  }, [focusTaskId, setFocusTaskId, setTimerTaskId])

  const focoCountToday = useMemo(
    () => sessions.filter((s) => s.type === 'foco' && s.completed && dayKeyFromISO(s.startedAt) === todayKey()).length,
    [sessions],
  )

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const total = durationMinutes * 60
  const progress = 1 - secondsLeft / total
  const filledSegments = Math.round(progress * PROGRESS_SEGMENTS)
  const activeTask = tasks.find((t) => t.id === taskId)

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
      <div className="pixel-panel-sm flex gap-1 bg-surface p-1">
        {(Object.keys(SESSION_LABELS) as SessionType[]).map((m) => (
          <button
            key={m}
            onClick={() => setTimerMode(m)}
            disabled={running}
            className={`px-3 py-1.5 text-xs font-medium ${
              mode === m ? 'bg-focus text-white' : 'text-muted hover:bg-focus-light'
            }`}
          >
            {SESSION_LABELS[m]}
          </button>
        ))}
      </div>

      {mode === 'foco' && (
        <select
          value={taskId ?? ''}
          onChange={(e) => setTimerTaskId(e.target.value ? Number(e.target.value) : null)}
          disabled={running}
          className="pixel-input w-full px-3 py-2 text-sm text-ink"
        >
          <option value="">Sem tarefa vinculada</option>
          {pendingTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      )}

      {activeTask && mode === 'foco' && !activeTask.done && (
        <label className="flex w-full items-center gap-2 border-2 border-ink bg-brand-light px-3 py-2 text-sm text-brand-dark">
          <input
            type="checkbox"
            onChange={() => activeTask.id && toggleTaskDone(activeTask.id)}
            className="size-4 cursor-pointer accent-brand"
          />
          Marcar "{activeTask.title}" como concluída
        </label>
      )}

      {!running && !sessionId && (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setDurationDraft(null)
                  setTimerDurationMinutes(p)
                }}
                className={`border-2 px-3 py-1 text-xs font-medium ${
                  durationMinutes === p ? 'border-ink bg-focus text-white' : 'border-ink bg-surface text-muted hover:bg-focus-light'
                }`}
              >
                {p} min
              </button>
            ))}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={durationDraft ?? durationMinutes}
              onChange={(e) => {
                setDurationDraft(e.target.value)
                const n = Number(e.target.value)
                if (e.target.value && n >= 1) setTimerDurationMinutes(Math.min(180, Math.floor(n)))
              }}
              onBlur={() => setDurationDraft(null)}
              title="Duração personalizada em minutos (ex: 60 para uma reunião de 1h)"
              className="pixel-input w-16 px-2 py-1 text-center text-xs text-ink"
            />
          </div>
        </div>
      )}

      <div
        className={`pixel-panel flex size-56 flex-col items-center justify-center gap-4 bg-surface sm:size-64 ${
          running ? 'animate-pixel-blink' : ''
        }`}
      >
        <span className="font-pixel text-3xl tabular-nums text-ink">
          {minutes}:{seconds}
        </span>
        {activeTask && mode === 'foco' && <span className="max-w-48 truncate text-xs text-muted">{activeTask.title}</span>}
        <div className="flex gap-1">
          {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
            <span key={i} className={`size-2.5 border border-ink ${i < filledSegments ? 'bg-focus' : 'bg-bg'}`} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={resetTimer} title="Reiniciar" className="pixel-btn bg-surface p-3 text-muted hover:text-ink">
          <RotateCcw size={18} />
        </button>
        {running ? (
          <button onClick={pauseTimer} className="pixel-btn bg-focus p-5 text-white">
            <Pause size={24} />
          </button>
        ) : (
          <button onClick={startTimer} className="pixel-btn bg-focus p-5 text-white">
            <Play size={24} />
          </button>
        )}
        <button onClick={skipTimer} title="Pular" className="pixel-btn bg-surface p-3 text-muted hover:text-ink">
          <SkipForward size={18} />
        </button>
      </div>

      {sessionId && (
        <button
          onClick={finishTimerEarly}
          title="Encerra o bloco agora, contando o tempo já trabalhado"
          className="flex items-center gap-1.5 text-sm font-medium text-success hover:underline"
        >
          <CheckCircle2 size={16} />
          Concluir agora
        </button>
      )}

      <p className="text-sm text-muted">🍅 {focoCountToday} blocos de foco concluídos hoje</p>
    </div>
  )
}
