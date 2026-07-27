import { useMemo, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { useAppStore } from '../store'
import { CATEGORY_META, PRIORITY_META, type Category, type Priority, type View } from '../types'
import { TaskItem } from './TaskItem'
import { Stepper } from './Stepper'

const PRIORITIES = Object.keys(PRIORITY_META) as Priority[]

export function TasksView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const tasks = useAppStore((s) => s.tasks)
  const addTask = useAppStore((s) => s.addTask)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('proposta')
  const [priority, setPriority] = useState<Priority>('media')
  const [dueDate, setDueDate] = useState('')
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1)
  // Formulário progressivo: título + Adicionar sempre visíveis, o resto sob demanda.
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { pending, done } = useMemo(() => {
    const weight = (p: Priority) => PRIORITY_META[p].weight
    const pending = tasks
      .filter((t) => !t.done)
      .sort((a, b) => weight(b.priority) - weight(a.priority) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    const done = tasks.filter((t) => t.done)
    return { pending, done }
  }, [tasks])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addTask({ title: title.trim(), category, priority, dueDate: dueDate || undefined, estimatedPomodoros })
    setTitle('')
    setDueDate('')
    setEstimatedPomodoros(1)
    setDetailsOpen(false)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 md:gap-6">
      <form onSubmit={handleSubmit} className="pixel-panel flex flex-col bg-surface p-3 md:p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa…"
          aria-label="Título da tarefa"
          className="pixel-input h-[48px] w-full px-3 text-sm text-ink"
        />

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          className="mt-2.5 flex h-[40px] items-center justify-between px-0.5 text-sm text-muted"
        >
          Categoria, prioridade, prazo
          <ChevronRight size={16} className={detailsOpen ? 'rotate-90 transition-transform' : 'transition-transform'} />
        </button>

        {detailsOpen && (
          <div className="flex flex-col gap-2 border-t-2 border-ink pt-2.5">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              aria-label="Categoria"
              className="pixel-input h-[44px] px-2.5 text-sm text-ink"
            >
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => {
                const meta = PRIORITY_META[p]
                const active = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    aria-pressed={active}
                    className="h-[44px] border-2 text-sm font-medium"
                    style={
                      active
                        ? { borderColor: meta.color, background: meta.bg, color: meta.color }
                        : { borderColor: 'var(--color-ink)', background: 'var(--color-surface)', color: 'var(--color-muted)' }
                    }
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Prazo"
                className="pixel-input h-[44px] min-w-0 flex-1 px-2.5 text-sm text-ink"
              />
              <div
                title="Pomodoros estimados: quantos blocos de ~25 min essa tarefa deve levar"
                className="flex h-[44px] shrink-0 items-center gap-1.5 border-2 border-ink bg-surface px-2"
              >
                <span className="text-sm">🍅</span>
                <Stepper value={estimatedPomodoros} min={1} max={12} onChange={setEstimatedPomodoros} />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="pixel-btn mt-2.5 flex h-[48px] w-full items-center justify-center gap-2 bg-brand text-sm font-medium text-white"
        >
          <Plus size={18} /> Adicionar tarefa
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        <h2 className="font-pixel text-[10px] text-muted">Pendentes ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-muted">Nenhuma tarefa pendente. Bom trabalho!</p>}
        {pending.map((t) => (
          <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h2 className="font-pixel text-[10px] text-muted">Concluídas ({done.length})</h2>
          {done.map((t) => (
            <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}
