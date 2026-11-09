import { CATEGORY_META, PRIORITY_META, type Category, type Priority } from '../types'
import { Stepper } from './Stepper'

const PRIORITIES = Object.keys(PRIORITY_META) as Priority[]

export interface TaskFieldValues {
  category: Category
  priority: Priority
  /** yyyy-MM-dd, ou '' para sem prazo */
  dueDate: string
  estimatedPomodoros: number
}

/** Categoria, prioridade, prazo e pomodoros: os mesmos campos ao criar e ao editar uma tarefa. */
export function TaskFields({
  values,
  onChange,
}: {
  values: TaskFieldValues
  onChange: (patch: Partial<TaskFieldValues>) => void
}) {
  return (
    <>
      <select
        value={values.category}
        onChange={(e) => onChange({ category: e.target.value as Category })}
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
          const active = values.priority === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ priority: p })}
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
          value={values.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          aria-label="Prazo"
          className="pixel-input h-[44px] min-w-0 flex-1 px-2.5 text-sm text-ink"
        />
        <div
          title="Pomodoros estimados: quantos blocos de ~25 min essa tarefa deve levar"
          className="flex h-[44px] shrink-0 items-center gap-1.5 border-2 border-ink bg-surface px-2"
        >
          <span className="text-sm">🍅</span>
          <Stepper
            value={values.estimatedPomodoros}
            min={1}
            max={12}
            onChange={(estimatedPomodoros) => onChange({ estimatedPomodoros })}
          />
        </div>
      </div>
    </>
  )
}
