import { Timer, Trash2 } from 'lucide-react'
import type { Task, View } from '../types'
import { CATEGORY_META, PRIORITY_META } from '../types'
import { useAppStore } from '../store'

export function TaskItem({ task, onNavigate }: { task: Task; onNavigate: (v: View) => void }) {
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone)
  const deleteTask = useAppStore((s) => s.deleteTask)
  const setFocusTaskId = useAppStore((s) => s.setFocusTaskId)
  const cat = CATEGORY_META[task.category]

  return (
    <div className={`pixel-panel-sm group flex items-center gap-3 bg-surface p-3 ${task.done ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => task.id && toggleTaskDone(task.id)}
        className="size-5 shrink-0 cursor-pointer accent-brand"
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium text-ink ${task.done ? 'line-through' : ''}`}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="border px-2 py-0.5 font-medium" style={{ color: cat.color, background: cat.bg, borderColor: cat.color }}>
            {cat.label}
          </span>
          <span>Prioridade {PRIORITY_META[task.priority].label}</span>
          {task.dueDate && <span>· vence {task.dueDate}</span>}
          <span title="Pomodoros concluídos / estimados">
            · 🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
          </span>
        </div>
      </div>
      {!task.done && (
        <button
          title="Focar nesta tarefa"
          onClick={() => {
            if (task.id) setFocusTaskId(task.id)
            onNavigate('focus')
          }}
          className="p-2 text-muted opacity-0 transition-opacity hover:bg-focus-light hover:text-focus group-hover:opacity-100"
        >
          <Timer size={16} />
        </button>
      )}
      <button
        title="Excluir"
        onClick={() => task.id && deleteTask(task.id)}
        className="p-2 text-muted opacity-0 transition-opacity hover:bg-danger-light hover:text-danger group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
