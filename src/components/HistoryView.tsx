import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, Coffee, Timer } from 'lucide-react'
import { useAppStore } from '../store'
import { SESSION_LABELS } from '../lib/pomodoro'
import { dayKeyFromISO, todayKey } from '../lib/rewards'
import { activityByDay } from '../lib/history'

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(key: string) {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}`
}

export function HistoryView() {
  const tasks = useAppStore((s) => s.tasks)
  const sessions = useAppStore((s) => s.sessions)
  const historyDate = useAppStore((s) => s.historyDate)
  const setHistoryDate = useAppStore((s) => s.setHistoryDate)
  const [date, setDate] = useState(todayKey())

  useEffect(() => {
    if (historyDate) {
      setDate(historyDate)
      setHistoryDate(null)
    }
  }, [historyDate, setHistoryDate])

  const taskTitle = useMemo(() => new Map(tasks.map((t) => [t.id, t.title])), [tasks])

  const dayEntries = useMemo(() => {
    const entries = []
    for (const s of sessions) {
      if (!s.completed || dayKeyFromISO(s.startedAt) !== date) continue
      entries.push({
        iso: s.startedAt,
        icon: s.type === 'foco' ? Timer : Coffee,
        className: s.type === 'foco' ? 'bg-focus-light text-focus' : 'bg-water-light text-water',
        text: `${SESSION_LABELS[s.type]} · ${s.durationMinutes} min`,
        detail: s.taskId ? taskTitle.get(s.taskId) : undefined,
      })
    }
    for (const t of tasks) {
      if (!t.done || !t.completedAt || dayKeyFromISO(t.completedAt) !== date) continue
      entries.push({
        iso: t.completedAt!,
        icon: CheckSquare,
        className: 'bg-success-light text-success',
        text: 'Tarefa concluída',
        detail: t.title,
      })
    }
    return entries.sort((a, b) => a.iso.localeCompare(b.iso))
  }, [sessions, tasks, date, taskTitle])

  const monthKey = date.slice(0, 7)
  const byDay = useMemo(() => activityByDay(tasks, sessions), [tasks, sessions])
  const monthDays = useMemo(
    () =>
      [...byDay.entries()]
        .filter(([key]) => key.startsWith(monthKey))
        .sort((a, b) => b[0].localeCompare(a[0])),
    [byDay, monthKey],
  )

  const totals = monthDays.reduce(
    (acc, [, a]) => ({
      focusMinutes: acc.focusMinutes + a.focusMinutes,
      focusBlocks: acc.focusBlocks + a.focusBlocks,
      tasksDone: acc.tasksDone + a.tasksDone,
    }),
    { focusMinutes: 0, focusBlocks: 0, tasksDone: 0 },
  )
  const maxMinutes = Math.max(1, ...monthDays.map(([, a]) => a.focusMinutes))
  const monthTitle = `${MONTH_NAMES[Number(monthKey.slice(5, 7)) - 1]} de ${monthKey.slice(0, 4)}`

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-pixel text-[10px] text-muted">Atividades do dia</h2>
        <input
          type="date"
          value={date}
          max={todayKey()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="pixel-input px-2 py-1 text-sm text-ink"
        />
      </div>

      <section className="pixel-panel flex flex-col gap-1 bg-surface p-4">
        {dayEntries.length === 0 && (
          <p className="text-sm text-muted">
            Nenhuma atividade registrada {date === todayKey() ? 'hoje ainda. Bora começar um bloco de foco?' : 'neste dia.'}
          </p>
        )}
        {dayEntries.map((entry, i) => {
          const Icon = entry.icon
          return (
            <div key={i} className="flex items-center gap-3 px-1 py-1.5">
              <span className="w-12 shrink-0 text-sm tabular-nums text-muted">{formatTime(entry.iso)}</span>
              <span className={`flex size-7 shrink-0 items-center justify-center border-2 border-ink ${entry.className}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{entry.text}</p>
                {entry.detail && <p className="truncate text-xs text-muted">{entry.detail}</p>}
              </div>
            </div>
          )
        })}
      </section>

      <h2 className="font-pixel text-[10px] text-muted">Resumo de {monthTitle}</h2>

      <section className="grid grid-cols-3 gap-4">
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{totals.focusMinutes}</p>
          <p className="mt-1 text-xs text-muted">min de foco</p>
        </div>
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{totals.focusBlocks}</p>
          <p className="mt-1 text-xs text-muted">blocos 🍅</p>
        </div>
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{totals.tasksDone}</p>
          <p className="mt-1 text-xs text-muted">tarefas concluídas</p>
        </div>
      </section>

      <section className="pixel-panel flex flex-col gap-1 bg-surface p-4">
        {monthDays.length === 0 && <p className="text-sm text-muted">Nenhuma atividade registrada neste mês.</p>}
        {monthDays.map(([key, a]) => (
          <button
            key={key}
            onClick={() => setDate(key)}
            className={`flex items-center gap-3 border-2 px-2 py-1.5 text-left ${
              key === date ? 'border-ink bg-brand-light' : 'border-transparent hover:bg-bg'
            }`}
          >
            <span className="w-12 shrink-0 text-sm font-medium text-ink">{formatDay(key)}</span>
            <span className="h-3 flex-1 border border-ink bg-bg">
              <span className="block h-full bg-brand" style={{ width: `${(a.focusMinutes / maxMinutes) * 100}%` }} />
            </span>
            <span className="shrink-0 text-xs text-muted">
              {a.focusMinutes} min · 🍅 {a.focusBlocks} · ✓ {a.tasksDone}
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}
