import { Minus, Plus } from 'lucide-react'

export function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Diminuir"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="pixel-btn flex size-8 shrink-0 items-center justify-center bg-surface text-ink disabled:opacity-40"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums text-ink">{value}</span>
      <button
        type="button"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="pixel-btn flex size-8 shrink-0 items-center justify-center bg-surface text-ink disabled:opacity-40"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
