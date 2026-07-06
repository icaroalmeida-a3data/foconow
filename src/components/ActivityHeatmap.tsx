import { useEffect, useMemo, useRef } from 'react'
import { addDays, format, startOfWeek, subWeeks } from 'date-fns'
import { useAppStore } from '../store'
import { activityByDay, activityLevel, describeActivity, LEVEL_COLORS } from '../lib/history'

const WEEKDAY_LABELS: Record<number, string> = { 1: 'Seg', 3: 'Qua', 5: 'Sex' }
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

interface Cell {
  key: string
  date: Date
  future: boolean
}

export function ActivityHeatmap({ weeks = 26, onDayClick }: { weeks?: number; onDayClick?: (dateKey: string) => void }) {
  const tasks = useAppStore((s) => s.tasks)
  const sessions = useAppStore((s) => s.sessions)
  const byDay = useMemo(() => activityByDay(tasks, sessions), [tasks, sessions])

  const { columns, monthLabels } = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 0 })
    const columns: Cell[][] = []
    const monthLabels: string[] = []
    let prevMonth = -1
    for (let w = 0; w < weeks; w++) {
      const first = addDays(start, w * 7)
      monthLabels.push(first.getMonth() !== prevMonth ? MONTHS[first.getMonth()] : '')
      prevMonth = first.getMonth()
      const col: Cell[] = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(first, d)
        col.push({ key: format(date, 'yyyy-MM-dd'), date, future: date > today })
      }
      columns.push(col)
    }
    return { columns, monthLabels }
  }, [weeks])

  const scrollRef = useRef<HTMLDivElement>(null)

  // em telas estreitas, abre já mostrando as semanas mais recentes
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex gap-[3px] pl-10 text-[11px] leading-none text-muted">
          {monthLabels.map((m, i) => (
            <span key={i} className="w-3 shrink-0 overflow-visible whitespace-nowrap">
              {m}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex w-10 flex-col gap-[3px] pr-1.5 text-[11px] leading-none text-muted">
            {Array.from({ length: 7 }).map((_, d) => (
              <span key={d} className="flex h-3 items-center justify-end">
                {WEEKDAY_LABELS[d] ?? ''}
              </span>
            ))}
          </div>
          {columns.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {col.map((cell) => {
                if (cell.future) return <span key={cell.key} className="size-3" />
                const activity = byDay.get(cell.key)
                const level = activityLevel(activity)
                return (
                  <button
                    key={cell.key}
                    type="button"
                    title={`${format(cell.date, 'dd/MM/yyyy')} — ${describeActivity(activity)}`}
                    onClick={() => onDayClick?.(cell.key)}
                    className={`size-3 border border-ink/15 p-0 ${onDayClick ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{ background: LEVEL_COLORS[level] }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-muted">
          <span>Menos</span>
          {LEVEL_COLORS.map((c) => (
            <span key={c} className="size-3 border border-ink/15" style={{ background: c }} />
          ))}
          <span>Mais</span>
        </div>
      </div>
    </div>
  )
}
