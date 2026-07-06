import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '../store'
import { CATEGORY_META, PRIORITY_META, type Category, type Priority, type View } from '../types'
import { TaskItem } from './TaskItem'

export function TasksView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const tasks = useAppStore((s) => s.tasks)
  const addTask = useAppStore((s) => s.addTask)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('proposta')
  const [priority, setPriority] = useState<Priority>('media')
  const [dueDate, setDueDate] = useState('')
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1)

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
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="pixel-panel flex flex-col gap-3 bg-surface p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que você precisa fazer? Ex: Montar proposta Cliente X"
          className="pixel-input px-3 py-2 text-sm text-ink"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="pixel-input px-2 py-1.5 text-sm text-ink"
          >
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="pixel-input px-2 py-1.5 text-sm text-ink"
          >
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                Prioridade {meta.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="pixel-input px-2 py-1.5 text-sm text-ink"
          />
          <label
            title="Pomodoros estimados: quantos blocos de ~25 min de foco essa tarefa deve levar"
            className="flex items-center gap-1.5 text-sm text-muted"
          >
            <span>🍅 Pomodoros</span>
            <input
              type="number"
              min={1}
              max={12}
              value={estimatedPomodoros}
              onChange={(e) => setEstimatedPomodoros(Number(e.target.value) || 1)}
              className="pixel-input w-14 px-2 py-1.5 text-sm text-ink"
            />
          </label>
          <button
            type="submit"
            className="pixel-btn ml-auto flex items-center gap-1.5 bg-brand px-3 py-1.5 text-sm font-medium text-white"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="font-pixel text-[10px] text-muted">Pendentes ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-muted">Nenhuma tarefa pendente. Bom trabalho!</p>}
        {pending.map((t) => (
          <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
        ))}
      </div>

      {done.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-pixel text-[10px] text-muted">Concluídas ({done.length})</h2>
          {done.map((t) => (
            <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}
