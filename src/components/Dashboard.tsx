import { useMemo } from 'react'
import { Timer } from 'lucide-react'
import { useAppStore } from '../store'
import { todayKey } from '../lib/rewards'
import { CATEGORY_META, type View } from '../types'
import { TaskItem } from './TaskItem'
import { ActivityHeatmap } from './ActivityHeatmap'
import { WaterWidget } from './WaterWidget'

const MESSAGES = [
  'Um bloco de foco de cada vez.',
  'Reuniões passam, o trabalho profundo fica.',
  'Pequenos avanços na proposta hoje contam.',
  'Você não precisa terminar tudo, só começar.',
]

export function Dashboard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const tasks = useAppStore((s) => s.tasks)
  const sessions = useAppStore((s) => s.sessions)
  const rewards = useAppStore((s) => s.rewards)
  const setHistoryDate = useAppStore((s) => s.setHistoryDate)

  const today = todayKey()

  const todaysTasks = useMemo(
    () => tasks.filter((t) => !t.done && (t.dueDate === today || t.createdAt.slice(0, 10) === today)),
    [tasks, today],
  )

  const focoMinutesToday = useMemo(
    () =>
      sessions
        .filter((s) => s.type === 'foco' && s.completed && s.startedAt.slice(0, 10) === today)
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions, today],
  )

  const tasksDoneToday = useMemo(() => tasks.filter((t) => t.done && t.completedAt?.slice(0, 10) === today).length, [tasks, today])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of todaysTasks) map.set(t.category, (map.get(t.category) ?? 0) + 1)
    return map
  }, [todaysTasks])

  const message = MESSAGES[new Date().getDate() % MESSAGES.length]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="pixel-panel bg-brand-light p-5">
        <p className="text-sm font-medium text-brand-dark">{message}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{todaysTasks.length}</p>
          <p className="mt-1 text-xs text-muted">tarefas para hoje</p>
        </div>
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{focoMinutesToday}</p>
          <p className="mt-1 text-xs text-muted">min de foco hoje</p>
        </div>
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{tasksDoneToday}</p>
          <p className="mt-1 text-xs text-muted">concluídas hoje</p>
        </div>
      </div>

      <WaterWidget />

      <div className="pixel-panel bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-pixel text-[10px] text-muted">Atividade</h2>
          <button onClick={() => onNavigate('history')} className="text-xs font-medium text-brand-dark hover:underline">
            Ver histórico →
          </button>
        </div>
        <ActivityHeatmap
          onDayClick={(day) => {
            setHistoryDate(day)
            onNavigate('history')
          }}
        />
      </div>

      {byCategory.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(byCategory.entries()).map(([cat, count]) => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
            return (
              <span
                key={cat}
                className="border px-3 py-1 text-xs font-medium"
                style={{ color: meta.color, background: meta.bg, borderColor: meta.color }}
              >
                {meta.label} · {count}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[10px] text-muted">Agenda de hoje</h2>
        <button
          onClick={() => onNavigate('focus')}
          className="pixel-btn flex items-center gap-1.5 bg-focus px-3 py-1.5 text-sm font-medium text-white"
        >
          <Timer size={15} /> Iniciar foco
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {todaysTasks.length === 0 && (
          <p className="text-sm text-muted">Nada agendado para hoje. Que tal adicionar uma tarefa ou revisar as pendentes?</p>
        )}
        {todaysTasks.map((t) => (
          <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        Nível {1 + Math.floor(rewards.points / 100)} · {rewards.points} pts · 🔥 {rewards.streakDays} dias
      </p>
    </div>
  )
}
