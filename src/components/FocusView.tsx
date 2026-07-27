import { useEffect, useMemo } from 'react'
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
  const canFinishTask = activeTask && mode === 'foco' && !activeTask.done

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3.5">
      <div className="pixel-panel-sm grid grid-cols-3 bg-surface">
        {(Object.keys(SESSION_LABELS) as SessionType[]).map((m, i) => (
          <button
            key={m}
            onClick={() => setTimerMode(m)}
            disabled={running}
            className={`h-[44px] text-sm font-medium disabled:opacity-60 ${i > 0 ? 'border-l-2 border-ink' : ''} ${
              mode === m ? 'bg-focus text-white' : 'text-muted'
            }`}
          >
            {SESSION_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Faixa larga em vez do quadrado de 280px: o botão principal continua acima da dobra. */}
      <div
        className={`pixel-panel flex flex-col items-center justify-center gap-3 bg-surface px-4 py-5 ${
          running ? 'animate-pixel-blink' : ''
        }`}
      >
        <span className="font-pixel text-4xl tabular-nums text-ink">
          {minutes}:{seconds}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
            <span key={i} className={`size-2.5 border border-ink ${i < filledSegments ? 'bg-focus' : 'bg-bg'}`} />
          ))}
        </div>
      </div>

      {mode === 'foco' && (
        <div className="flex items-stretch border-2 border-ink bg-surface">
          <span className="flex shrink-0 items-center border-r-2 border-ink px-3 text-xs text-muted">Tarefa</span>
          <select
            value={taskId ?? ''}
            onChange={(e) => setTimerTaskId(e.target.value ? Number(e.target.value) : null)}
            disabled={running}
            aria-label="Tarefa vinculada ao bloco de foco"
            className="h-[44px] min-w-0 flex-1 bg-transparent px-2.5 text-sm text-ink disabled:opacity-60"
          >
            <option value="">Sem tarefa vinculada</option>
            {pendingTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {!running && !sessionId && (
        <div className="grid grid-cols-5 gap-2">
          {DURATION_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setTimerDurationMinutes(p)}
              className={`h-[44px] border-2 border-ink text-sm font-medium ${
                durationMinutes === p ? 'bg-focus text-white' : 'bg-surface text-muted'
              }`}
            >
              {p}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={180}
            value={durationMinutes}
            onChange={(e) => setTimerDurationMinutes(Number(e.target.value) || 1)}
            title="Duração personalizada em minutos (ex: 60 para uma reunião de 1h)"
            aria-label="Duração personalizada em minutos"
            className="pixel-input h-[44px] min-w-0 text-center text-sm text-ink"
          />
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <button
          onClick={resetTimer}
          title="Reiniciar"
          aria-label="Reiniciar"
          className="pixel-btn flex size-[56px] shrink-0 items-center justify-center bg-surface text-muted hover:text-ink"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={running ? pauseTimer : startTimer}
          className="pixel-btn flex h-[56px] flex-1 items-center justify-center gap-2.5 bg-focus font-pixel text-xs text-white"
        >
          {running ? (
            <>
              <Pause size={20} /> PAUSAR
            </>
          ) : (
            <>
              <Play size={20} /> COMEÇAR
            </>
          )}
        </button>
        <button
          onClick={skipTimer}
          title="Pular"
          aria-label="Pular"
          className="pixel-btn flex size-[56px] shrink-0 items-center justify-center bg-surface text-muted hover:text-ink"
        >
          <SkipForward size={20} />
        </button>
      </div>

      {(sessionId || canFinishTask) && (
        <div className="flex gap-2.5">
          {sessionId && (
            <button
              onClick={finishTimerEarly}
              title="Encerra o bloco agora, contando o tempo já trabalhado"
              className="flex h-[44px] flex-1 items-center justify-center gap-2 border-2 border-success bg-success-light text-sm font-medium text-success"
            >
              <CheckCircle2 size={16} />
              Concluir agora
            </button>
          )}
          {canFinishTask && (
            <button
              onClick={() => activeTask.id && toggleTaskDone(activeTask.id)}
              title={`Marcar "${activeTask.title}" como concluída`}
              className="flex h-[44px] flex-1 items-center justify-center gap-2 border-2 border-ink bg-surface text-sm font-medium text-ink"
            >
              Tarefa feita ✓
            </button>
          )}
        </div>
      )}

      <p className="text-center text-sm text-muted">🍅 {focoCountToday} blocos de foco concluídos hoje</p>
    </div>
  )
}
