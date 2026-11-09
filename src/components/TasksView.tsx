import { useMemo, useState } from 'react'
import { ChevronRight, Columns3, List, Plus, Search, X } from 'lucide-react'
import { useAppStore } from '../store'
import { todayKey } from '../lib/rewards'
import { CATEGORY_META, PRIORITY_META, type Category, type Priority, type Task, type View } from '../types'
import { TaskItem } from './TaskItem'
import { TaskFields, type TaskFieldValues } from './TaskFields'
import { KanbanBoard } from './KanbanBoard'

type Mode = 'lista' | 'kanban'
const MODE_KEY = 'foconow:tasksMode'
const MODES: { id: Mode; label: string; icon: typeof List }[] = [
  { id: 'lista', label: 'Lista', icon: List },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
]

function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === 'kanban' ? 'kanban' : 'lista'
  } catch {
    return 'lista'
  }
}

type DueFilter = '' | 'atrasadas' | 'hoje' | '7dias' | 'sem_prazo'
const DUE_FILTERS: { id: DueFilter; label: string }[] = [
  { id: '', label: 'Qualquer prazo' },
  { id: 'atrasadas', label: 'Atrasadas' },
  { id: 'hoje', label: 'Hoje' },
  { id: '7dias', label: 'Próximos 7 dias' },
  { id: 'sem_prazo', label: 'Sem prazo' },
]

/** Compara sem acento e sem caixa: "reuniao" acha "Reunião". */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function matchesDue(task: Task, filter: DueFilter, today: string, in7: string) {
  if (filter === '') return true
  if (filter === 'sem_prazo') return !task.dueDate
  if (!task.dueDate) return false
  if (filter === 'atrasadas') return !task.done && task.dueDate < today
  if (filter === 'hoje') return task.dueDate === today
  return task.dueDate >= today && task.dueDate <= in7
}

const EMPTY_FIELDS: TaskFieldValues = { category: 'proposta', priority: 'media', dueDate: '', estimatedPomodoros: 1 }

export function TasksView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const tasks = useAppStore((s) => s.tasks)
  const addTask = useAppStore((s) => s.addTask)

  const [title, setTitle] = useState('')
  const [fields, setFields] = useState<TaskFieldValues>(EMPTY_FIELDS)
  // Formulário progressivo: título + Adicionar sempre visíveis, o resto sob demanda.
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [mode, setMode] = useState<Mode>(readMode)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [dueFilter, setDueFilter] = useState<DueFilter>('')
  const filtering = query.trim() !== '' || categoryFilter !== '' || priorityFilter !== '' || dueFilter !== ''

  function clearFilters() {
    setQuery('')
    setCategoryFilter('')
    setPriorityFilter('')
    setDueFilter('')
  }

  function changeMode(next: Mode) {
    setMode(next)
    try {
      localStorage.setItem(MODE_KEY, next)
    } catch {
      // armazenamento bloqueado: a escolha vale só para esta visita
    }
  }

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    const today = todayKey()
    const limit = new Date()
    limit.setDate(limit.getDate() + 7)
    const in7 = todayKey(limit)
    return tasks.filter(
      (t) =>
        (q === '' || normalize(t.title).includes(q)) &&
        (categoryFilter === '' || t.category === categoryFilter) &&
        (priorityFilter === '' || t.priority === priorityFilter) &&
        matchesDue(t, dueFilter, today, in7),
    )
  }, [tasks, query, categoryFilter, priorityFilter, dueFilter])

  const { pending, done } = useMemo(() => {
    const weight = (p: Priority) => PRIORITY_META[p].weight
    const pending = visible
      .filter((t) => !t.done)
      .sort((a, b) => weight(b.priority) - weight(a.priority) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
    const done = visible.filter((t) => t.done)
    return { pending, done }
  }, [visible])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      category: fields.category,
      priority: fields.priority,
      dueDate: fields.dueDate || undefined,
      estimatedPomodoros: fields.estimatedPomodoros,
    })
    setTitle('')
    // categoria e prioridade ficam: quem cadastra várias seguidas costuma repetir
    setFields((f) => ({ ...f, dueDate: '', estimatedPomodoros: 1 }))
    setDetailsOpen(false)
  }

  const filterSelect = 'pixel-input h-[44px] min-w-0 px-2 text-sm text-ink'

  return (
    <div className={`mx-auto flex flex-col gap-4 md:gap-6 ${mode === 'kanban' ? 'max-w-6xl' : 'max-w-2xl'}`}>
      <form
        onSubmit={handleSubmit}
        className={`pixel-panel flex w-full flex-col bg-surface p-3 md:p-4 ${mode === 'kanban' ? 'mx-auto max-w-2xl' : ''}`}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa…"
          aria-label="Título da tarefa"
          maxLength={300}
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
            <TaskFields values={fields} onChange={(patch) => setFields((f) => ({ ...f, ...patch }))} />
          </div>
        )}

        <button
          type="submit"
          className="pixel-btn mt-2.5 flex h-[48px] w-full items-center justify-center gap-2 bg-brand text-sm font-medium text-white"
        >
          <Plus size={18} /> Adicionar tarefa
        </button>
      </form>

      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
        <div role="group" aria-label="Modo de visualização" className="grid grid-cols-2 gap-2 md:flex">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id
            return (
              <button
                key={id}
                onClick={() => changeMode(id)}
                aria-pressed={active}
                className={`flex h-[44px] items-center justify-center gap-2 px-4 text-sm font-medium ${
                  active ? 'pixel-btn bg-brand-light text-brand-dark' : 'border-2 border-ink bg-surface text-muted hover:bg-bg'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            )
          })}
        </div>

        <label className="relative flex min-w-0 md:ml-2 md:flex-1">
          <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarefa…"
            aria-label="Buscar tarefa pelo título"
            className="pixel-input h-[44px] w-full min-w-0 pl-8 pr-2.5 text-sm text-ink md:min-w-40"
          />
        </label>

        <div className="grid grid-cols-3 gap-2 md:flex">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | '')}
            aria-label="Filtrar por categoria"
            className={filterSelect}
          >
            <option value="">Categoria</option>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
            aria-label="Filtrar por prioridade"
            className={filterSelect}
          >
            <option value="">Prioridade</option>
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as DueFilter)}
            aria-label="Filtrar por prazo"
            className={filterSelect}
          >
            {DUE_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.id === '' ? 'Prazo' : f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtering && (
        <div className="-mt-1 flex items-center justify-between gap-2 text-sm text-muted md:-mt-3">
          <span>
            {visible.length} de {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
          <button
            onClick={clearFilters}
            className="-my-2 flex items-center gap-1 py-2 font-medium text-brand-dark hover:underline"
          >
            <X size={14} /> Limpar filtros
          </button>
        </div>
      )}

      {mode === 'kanban' && <KanbanBoard tasks={visible} onNavigate={onNavigate} />}

      {mode === 'lista' && (
        <div className="flex flex-col gap-2.5">
          <h2 className="font-pixel text-[10px] text-muted">Pendentes ({pending.length})</h2>
          {pending.length === 0 && (
            <p className="text-sm text-muted">
              {filtering ? 'Nenhuma tarefa pendente com esses filtros.' : 'Nenhuma tarefa pendente. Bom trabalho!'}
            </p>
          )}
          {pending.map((t) => (
            <TaskItem key={t.id} task={t} onNavigate={onNavigate} />
          ))}
        </div>
      )}

      {mode === 'lista' && done.length > 0 && (
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
