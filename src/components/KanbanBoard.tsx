import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Timer, Trash2 } from 'lucide-react'
import { useAppStore } from '../store'
import { dayKeyFromISO, todayKey } from '../lib/rewards'
import { boardColumnOf, PRIORITY_META, type BoardColumn, type Task, type View } from '../types'
import { TaskChips } from './TaskItem'

const COLUMNS: { id: BoardColumn; label: string; empty: string; accent: string }[] = [
  { id: 'a_fazer', label: 'A fazer', empty: 'Nada na fila.', accent: 'var(--color-muted)' },
  { id: 'fazendo', label: 'Em andamento', empty: 'Arraste para cá o que você começou.', accent: 'var(--color-focus)' },
  { id: 'concluida', label: 'Concluído', empty: 'Nada concluído nos últimos 7 dias.', accent: 'var(--color-success)' },
]

/** A coluna "Concluído" só mostra a última semana; o resto fica no Histórico. */
const DONE_WINDOW_DAYS = 7

function daysAgoKey(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return todayKey(d)
}

/**
 * Quadro Kanban das tarefas. No desktop os cartões são arrastados entre colunas;
 * no toque (onde o drag nativo não existe) cada cartão tem setas para mudar de coluna,
 * e as colunas rolam na horizontal com snap.
 */
export function KanbanBoard({ tasks, onNavigate }: { tasks: Task[]; onNavigate: (v: View) => void }) {
  const moveTask = useAppStore((s) => s.moveTask)

  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<BoardColumn | null>(null)

  const { byColumn, olderDone } = useMemo(() => {
    const weight = (t: Task) => PRIORITY_META[t.priority].weight
    const byPriority = (a: Task, b: Task) =>
      weight(b) - weight(a) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
    const since = daysAgoKey(DONE_WINDOW_DAYS - 1)
    const allDone = tasks.filter((t) => t.done)
    const recentDone = allDone
      .filter((t) => !t.completedAt || dayKeyFromISO(t.completedAt) >= since)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    const byColumn: Record<BoardColumn, Task[]> = {
      a_fazer: tasks.filter((t) => !t.done && t.stage === 'a_fazer').sort(byPriority),
      fazendo: tasks.filter((t) => !t.done && t.stage === 'fazendo').sort(byPriority),
      concluida: recentDone,
    }
    return { byColumn, olderDone: allDone.length - recentDone.length }
  }, [tasks])

  function handleDrop(column: BoardColumn) {
    if (draggingId !== null) moveTask(draggingId, column)
    setDraggingId(null)
    setOverColumn(null)
  }

  return (
    // -mx/px: no celular as colunas sangram até a borda para a próxima aparecer "espiando"
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
      {COLUMNS.map((col, index) => {
        const items = byColumn[col.id]
        const isTarget = overColumn === col.id && draggingId !== null
        return (
          <section
            key={col.id}
            aria-label={`${col.label}, ${items.length} ${items.length === 1 ? 'tarefa' : 'tarefas'}`}
            onDragOver={(e) => {
              if (draggingId === null) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (overColumn !== col.id) setOverColumn(col.id)
            }}
            onDragLeave={(e) => {
              // sair para um filho da própria coluna não conta como sair
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverColumn(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleDrop(col.id)
            }}
            className={`flex w-[84%] shrink-0 snap-center flex-col gap-2.5 border-2 border-ink bg-bg p-2.5 md:w-auto md:min-h-[320px] ${
              isTarget ? 'kanban-drop' : ''
            }`}
          >
            <header className="flex items-center gap-2 border-b-2 border-ink pb-2">
              <span aria-hidden className="size-2.5 shrink-0 border border-ink" style={{ background: col.accent }} />
              <h2 className="font-pixel text-[10px] text-ink">{col.label}</h2>
              <span className="ml-auto border-2 border-ink bg-surface px-1.5 text-xs font-medium text-ink">
                {items.length}
              </span>
            </header>

            {items.length === 0 && <p className="px-1 py-3 text-sm text-muted">{col.empty}</p>}

            {items.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                prev={COLUMNS[index - 1]}
                next={COLUMNS[index + 1]}
                dragging={draggingId === task.id}
                onDragStart={() => setDraggingId(task.id ?? null)}
                onDragEnd={() => {
                  setDraggingId(null)
                  setOverColumn(null)
                }}
                onNavigate={onNavigate}
              />
            ))}

            {col.id === 'concluida' && olderDone > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="mt-auto py-2 text-left text-xs font-medium text-brand-dark hover:underline"
              >
                + {olderDone} mais {olderDone === 1 ? 'antiga' : 'antigas'} no Histórico
              </button>
            )}
          </section>
        )
      })}
    </div>
  )
}

function KanbanCard({
  task,
  prev,
  next,
  dragging,
  onDragStart,
  onDragEnd,
  onNavigate,
}: {
  task: Task
  prev?: { id: BoardColumn; label: string }
  next?: { id: BoardColumn; label: string }
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onNavigate: (v: View) => void
}) {
  const moveTask = useAppStore((s) => s.moveTask)
  const openTaskDialog = useAppStore((s) => s.openTaskDialog)
  const setFocusTaskId = useAppStore((s) => s.setFocusTaskId)
  const id = task.id
  if (id === undefined) return null

  const actionClass = 'flex h-[40px] flex-1 items-center justify-center border-ink text-muted disabled:opacity-30'

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(id))
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={`pixel-panel-sm animate-pop-in bg-surface md:cursor-grab md:active:cursor-grabbing ${
        dragging ? 'opacity-40' : ''
      } ${boardColumnOf(task) === 'concluida' ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        title="Editar tarefa"
        onClick={() => openTaskDialog('edit', id)}
        className="block w-full px-3 py-2.5 text-left hover:bg-bg md:cursor-[inherit]"
      >
        <p className={`text-pretty text-sm font-medium text-ink ${task.done ? 'line-through' : ''}`}>{task.title}</p>
        <TaskChips task={task} />
      </button>

      <div className="flex border-t-2 border-ink">
        <button
          disabled={!prev}
          onClick={() => prev && moveTask(id, prev.id)}
          title={prev ? `Mover para ${prev.label}` : undefined}
          aria-label={prev ? `Mover para ${prev.label}` : 'Já está na primeira coluna'}
          className={`${actionClass} hover:enabled:bg-bg hover:enabled:text-ink`}
        >
          <ChevronLeft size={18} />
        </button>
        {!task.done && (
          <button
            onClick={() => {
              setFocusTaskId(id)
              onNavigate('focus')
            }}
            title="Focar nesta tarefa"
            aria-label="Focar nesta tarefa"
            className={`${actionClass} border-l-2 bg-focus-light text-focus`}
          >
            <Timer size={18} />
          </button>
        )}
        <button
          onClick={() => openTaskDialog('delete', id)}
          title="Excluir"
          aria-label="Excluir tarefa"
          className={`${actionClass} border-l-2 hover:bg-danger-light hover:text-danger`}
        >
          <Trash2 size={16} />
        </button>
        <button
          disabled={!next}
          onClick={() => next && moveTask(id, next.id)}
          title={next ? `Mover para ${next.label}` : undefined}
          aria-label={next ? `Mover para ${next.label}` : 'Já está na última coluna'}
          className={`${actionClass} border-l-2 hover:enabled:bg-bg hover:enabled:text-ink`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </article>
  )
}
