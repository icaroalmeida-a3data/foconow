import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { useAppStore } from '../store'
import { dayKeyFromISO, todayKey } from '../lib/rewards'
import type { View } from '../types'
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
  const setHistoryDate = useAppStore((s) => s.setHistoryDate)

  const today = todayKey()

  const todaysTasks = useMemo(
    () => tasks.filter((t) => !t.done && (t.dueDate === today || dayKeyFromISO(t.createdAt) === today)),
    [tasks, today],
  )

  const focoMinutesToday = useMemo(
    () =>
      sessions
        .filter((s) => s.type === 'foco' && s.completed && dayKeyFromISO(s.startedAt) === today)
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions, today],
  )

  const tasksDoneToday = useMemo(
    () => tasks.filter((t) => t.done && t.completedAt && dayKeyFromISO(t.completedAt) === today).length,
    [tasks, today],
  )

  const message = MESSAGES[new Date().getDate() % MESSAGES.length]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 md:gap-6">
      <div className="pixel-panel bg-brand-light p-4 md:p-5">
        <p className="text-pretty text-sm font-medium text-brand-dark">{message}</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-ink md:text-lg">{todaysTasks.length}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">tarefas hoje</p>
        </div>
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-focus md:text-lg">{focoMinutesToday}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">min de foco</p>
        </div>
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-success md:text-lg">{tasksDoneToday}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">concluídas</p>
        </div>
      </div>

      <WaterWidget />

      <div className="pixel-panel bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-pixel text-[10px] text-muted">
            <span className="md:hidden">Últimas 13 semanas</span>
            <span className="hidden md:inline">Atividade</span>
          </h2>
          <button
            onClick={() => onNavigate('history')}
            className="-my-2.5 flex items-center gap-1 py-2.5 text-xs font-medium text-brand-dark hover:underline"
          >
            Histórico
            <ChevronRight size={14} />
          </button>
        </div>
        <ActivityHeatmap
          onDayClick={(day) => {
            setHistoryDate(day)
            onNavigate('history')
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-pixel text-[10px] text-muted">Agenda de hoje</h2>
        <span className="text-xs text-muted">
          {todaysTasks.length} {todaysTasks.length === 1 ? 'tarefa' : 'tarefas'}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {todaysTasks.length === 0 && (
          <p className="text-sm text-muted">
            Nada agendado para hoje. Que tal adicionar uma tarefa ou revisar as pendentes?
          </p>
        )}
        {todaysTasks.map((t) => (
          <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  )
}
