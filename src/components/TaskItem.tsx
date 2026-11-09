import { Timer, Trash2 } from 'lucide-react'
import type { Task, View } from '../types'
import { CATEGORY_META, PRIORITY_META } from '../types'
import { useAppStore } from '../store'
import { todayKey } from '../lib/rewards'

/** Categoria, prioridade, prazo e pomodoros; usado na lista e nos cartões do Kanban. */
export function TaskChips({ task }: { task: Task }) {
  const cat = CATEGORY_META[task.category]
  const prio = PRIORITY_META[task.priority]
  const overdue = !task.done && task.dueDate !== undefined && task.dueDate < todayKey()
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[0.7rem] text-muted">
      <span className="border px-1 py-0.5 font-medium" style={{ color: cat.color, background: cat.bg, borderColor: cat.color }}>
        {cat.label}
      </span>
      <span
        className="border px-1 py-0.5 font-medium"
        style={{ color: prio.color, background: prio.bg, borderColor: prio.color }}
      >
        {prio.label}
      </span>
      {task.dueDate && (
        <span title={`Vence em ${task.dueDate}`} className={overdue ? 'font-medium text-danger' : undefined}>
          {task.dueDate.slice(8, 10)}/{task.dueDate.slice(5, 7)}
          {overdue && ' · atrasada'}
        </span>
      )}
      <span title="Pomodoros concluídos / estimados">
        🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
      </span>
    </div>
  )
}

/**
 * Linha da tarefa em colunas fixas de 48px: no toque não existe hover, então
 * marcar / focar / excluir precisam estar sempre visíveis e com alvo grande.
 */
export function TaskItem({ task, onNavigate }: { task: Task; onNavigate: (v: View) => void }) {
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone)
  const openTaskDialog = useAppStore((s) => s.openTaskDialog)
  const setFocusTaskId = useAppStore((s) => s.setFocusTaskId)

  return (
    <div className={`pixel-panel-sm flex items-stretch bg-surface ${task.done ? 'opacity-60' : ''}`}>
      <label
        title={task.done ? 'Reabrir tarefa' : 'Marcar como concluída'}
        className="flex w-[48px] shrink-0 cursor-pointer items-center justify-center border-r-2 border-ink"
      >
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => task.id && toggleTaskDone(task.id)}
          className="size-6 cursor-pointer accent-brand"
        />
      </label>

      <button
        type="button"
        title="Editar tarefa"
        onClick={() => task.id && openTaskDialog('edit', task.id)}
        className="min-w-0 flex-1 px-3 py-2.5 text-left hover:bg-bg"
      >
        <p className={`text-sm font-medium text-ink ${task.done ? 'line-through' : 'text-pretty'}`}>{task.title}</p>
        <TaskChips task={task} />
      </button>

      {!task.done && (
        <button
          title="Focar nesta tarefa"
          aria-label="Focar nesta tarefa"
          onClick={() => {
            if (task.id) setFocusTaskId(task.id)
            onNavigate('focus')
          }}
          className="flex w-[48px] shrink-0 items-center justify-center border-l-2 border-ink bg-focus-light text-focus"
        >
          <Timer size={20} />
        </button>
      )}
      <button
        title="Excluir"
        aria-label="Excluir tarefa"
        onClick={() => task.id && openTaskDialog('delete', task.id)}
        className="flex w-[48px] shrink-0 items-center justify-center border-l-2 border-ink text-muted hover:bg-danger-light hover:text-danger"
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
