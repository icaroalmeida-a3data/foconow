import { useEffect, useMemo, useState } from 'react'
import { CheckSquare, ChevronLeft, ChevronRight, Coffee, Timer } from 'lucide-react'
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

/** Soma dias numa chave yyyy-MM-dd sem passar por UTC (evita pular um dia por fuso). */
function shiftDayKey(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 md:gap-6">
      {/* Navegar dia a dia com o polegar, sem perder o salto direto pelo seletor. */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDate(shiftDayKey(date, -1))}
          aria-label="Dia anterior"
          className="flex size-[44px] shrink-0 items-center justify-center border-2 border-ink bg-surface text-ink"
        >
          <ChevronLeft size={20} />
        </button>
        <label className="flex h-[44px] flex-1 items-center justify-center gap-2 border-2 border-ink bg-surface px-2 text-sm text-ink">
          <input
            type="date"
            value={date}
            max={todayKey()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Dia exibido"
            className="min-w-0 bg-transparent text-sm text-ink"
          />
          {date === todayKey() && <span className="shrink-0 text-muted">· hoje</span>}
        </label>
        <button
          onClick={() => setDate(shiftDayKey(date, 1))}
          disabled={date >= todayKey()}
          aria-label="Próximo dia"
          className="flex size-[44px] shrink-0 items-center justify-center border-2 border-ink bg-surface text-ink disabled:opacity-40"
        >
          <ChevronRight size={20} />
        </button>
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

      <section className="grid grid-cols-3 gap-2.5 md:gap-4">
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-ink md:text-lg">{totals.focusMinutes}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">min</p>
        </div>
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-ink md:text-lg">{totals.focusBlocks}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">blocos 🍅</p>
        </div>
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-ink md:text-lg">{totals.tasksDone}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">tarefas</p>
        </div>
      </section>

      <section className="pixel-panel flex flex-col gap-1 bg-surface p-4">
        {monthDays.length === 0 && <p className="text-sm text-muted">Nenhuma atividade registrada neste mês.</p>}
        {monthDays.map(([key, a]) => (
          <button
            key={key}
            onClick={() => setDate(key)}
            className={`flex flex-col gap-1.5 border-2 px-2 py-2 text-left ${
              key === date ? 'border-ink bg-brand-light' : 'border-transparent hover:bg-bg'
            }`}
          >
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-ink">{formatDay(key)}</span>
              <span className="text-xs text-muted">
                {a.focusMinutes} min · 🍅 {a.focusBlocks} · ✓ {a.tasksDone}
              </span>
            </span>
            <span className="block h-3 w-full border border-ink bg-bg">
              <span className="block h-full bg-brand" style={{ width: `${(a.focusMinutes / maxMinutes) * 100}%` }} />
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}
