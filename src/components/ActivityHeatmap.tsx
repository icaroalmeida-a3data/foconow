import { useEffect, useMemo, useRef } from 'react'
import { addDays, format, startOfWeek, subWeeks } from 'date-fns'
import { useAppStore } from '../store'
import { activityByDay, activityLevel, describeActivity, LEVEL_COLORS } from '../lib/history'
import { useMediaQuery } from '../lib/useMediaQuery'

const WEEKDAY_LABELS: Record<number, string> = { 1: 'Seg', 3: 'Qua', 5: 'Sex' }
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

interface Cell {
  key: string
  date: Date
  future: boolean
}

/**
 * No desktop são 26 semanas com rótulos e scroll horizontal.
 * No celular, 26 semanas em 390px viravam scroll dentro de scroll — então
 * mostramos 13 semanas que cabem inteiras, sem rótulos e sem scroll.
 */
export function ActivityHeatmap({
  weeks = 26,
  mobileWeeks = 13,
  onDayClick,
}: {
  weeks?: number
  mobileWeeks?: number
  onDayClick?: (dateKey: string) => void
}) {
  const tasks = useAppStore((s) => s.tasks)
  const sessions = useAppStore((s) => s.sessions)
  const byDay = useMemo(() => activityByDay(tasks, sessions), [tasks, sessions])
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const shownWeeks = isDesktop ? weeks : mobileWeeks

  const { columns, monthLabels } = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(subWeeks(today, shownWeeks - 1), { weekStartsOn: 0 })
    const columns: Cell[][] = []
    const monthLabels: string[] = []
    let prevMonth = -1
    for (let w = 0; w < shownWeeks; w++) {
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
  }, [shownWeeks])

  const scrollRef = useRef<HTMLDivElement>(null)

  // em telas estreitas, abre já mostrando as semanas mais recentes
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  function cellFor(cell: Cell, sizeClass: string) {
    if (cell.future) return <span key={cell.key} className={sizeClass} />
    const activity = byDay.get(cell.key)
    const level = activityLevel(activity)
    return (
      <button
        key={cell.key}
        type="button"
        title={`${format(cell.date, 'dd/MM/yyyy')} — ${describeActivity(activity)}`}
        onClick={() => onDayClick?.(cell.key)}
        className={`${sizeClass} border border-ink/15 p-0 ${onDayClick ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ background: LEVEL_COLORS[level] }}
      />
    )
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1">
          {columns.map((col, w) => (
            <div key={w} className="flex flex-1 flex-col gap-1">
              {col.map((cell) => cellFor(cell, 'aspect-square w-full'))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted">
          <span>Menos</span>
          {LEVEL_COLORS.map((c) => (
            <span key={c} className="size-3 border border-ink/15" style={{ background: c }} />
          ))}
          <span>Mais</span>
        </div>
      </div>
    )
  }

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
              {col.map((cell) => cellFor(cell, 'size-3'))}
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
