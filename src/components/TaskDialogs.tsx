import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { useAppStore } from '../store'
import type { Task } from '../types'
import { TaskFields, type TaskFieldValues } from './TaskFields'

/**
 * Diálogos de tarefa (editar e confirmar exclusão), abertos de qualquer tela pelo store:
 * a lista, o Kanban e o Painel só chamam openTaskDialog.
 */
export function TaskDialogs() {
  const dialog = useAppStore((s) => s.taskDialog)
  const task = useAppStore((s) => (dialog ? s.tasks.find((t) => t.id === dialog.id) : undefined))
  const close = useAppStore((s) => s.closeTaskDialog)

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, close])

  // a tarefa pode sumir com o diálogo aberto (excluída pelo Claude via MCP, por exemplo)
  if (!dialog || !task) return null

  return (
    <div onClick={close} className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={dialog.kind === 'edit' ? 'Editar tarefa' : 'Excluir tarefa'}
        className="pixel-panel animate-pop-in w-full max-w-md bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6"
      >
        {dialog.kind === 'edit' ? (
          <EditForm key={task.id} task={task} onClose={close} />
        ) : (
          <DeleteConfirm task={task} onClose={close} />
        )}
      </div>
    </div>
  )
}

function EditForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useAppStore((s) => s.updateTask)
  const openTaskDialog = useAppStore((s) => s.openTaskDialog)
  const [title, setTitle] = useState(task.title)
  const [fields, setFields] = useState<TaskFieldValues>({
    category: task.category,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    estimatedPomodoros: task.estimatedPomodoros,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !task.id) return
    setSaving(true)
    const saved = await updateTask(task.id, {
      title: title.trim(),
      category: fields.category,
      priority: fields.priority,
      dueDate: fields.dueDate || undefined,
      estimatedPomodoros: fields.estimatedPomodoros,
    })
    if (saved) onClose()
    else setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-xs text-ink">Editar tarefa</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex size-[40px] items-center justify-center text-muted hover:bg-bg hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Título da tarefa"
        maxLength={300}
        autoFocus
        className="pixel-input h-[48px] w-full px-3 text-sm text-ink"
      />
      <TaskFields values={fields} onChange={(patch) => setFields((f) => ({ ...f, ...patch }))} />

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => task.id && openTaskDialog('delete', task.id)}
          className="flex h-[44px] items-center gap-1.5 px-2 text-sm text-muted hover:bg-danger-light hover:text-danger"
        >
          <Trash2 size={16} /> Excluir
        </button>
        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="pixel-btn h-[44px] bg-brand px-5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

function DeleteConfirm({ task, onClose }: { task: Task; onClose: () => void }) {
  const deleteTask = useAppStore((s) => s.deleteTask)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-pixel text-xs text-danger">Excluir tarefa?</h2>
      <p className="text-pretty text-sm text-ink">
        <strong>{task.title}</strong> será apagada de vez. Os blocos de foco já feitos nela continuam no histórico.
      </p>
      <div className="mt-1 flex gap-2">
        <button
          onClick={onClose}
          autoFocus
          className="pixel-btn h-[44px] flex-1 bg-surface text-sm font-medium text-ink"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            if (task.id) deleteTask(task.id)
            onClose()
          }}
          className="pixel-btn flex h-[44px] flex-1 items-center justify-center gap-1.5 bg-danger text-sm font-medium text-white"
        >
          <Trash2 size={16} /> Excluir
        </button>
      </div>
    </div>
  )
}
