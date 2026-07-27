import { Minus, Plus } from 'lucide-react'
import { useAppStore } from '../store'
import { mlOnDay, waterGoalMl } from '../lib/water'
import { todayKey } from '../lib/rewards'

const INNER_ROWS = 17

function PixelGlass({ fraction }: { fraction: number }) {
  const fill = Math.max(0, Math.min(INNER_ROWS, Math.round(fraction * INNER_ROWS)))
  return (
    <svg viewBox="0 0 16 21" shapeRendering="crispEdges" className="h-14 w-auto shrink-0 sm:h-20" aria-hidden>
      {fill > 0 && (
        <>
          <rect x="3" y={19 - fill} width="10" height={fill} fill="var(--color-water)" />
          <rect x="3" y={19 - fill} width="10" height="1" fill="#9cc7d8" />
        </>
      )}
      {fill >= 6 && <rect x="6" y={18 - Math.floor(fill / 2)} width="1" height="1" fill="#cde6ee" />}
      {fill >= 10 && <rect x="10" y="17" width="1" height="1" fill="#cde6ee" />}
      <rect x="2" y="1" width="1" height="19" fill="var(--color-ink)" />
      <rect x="13" y="1" width="1" height="19" fill="var(--color-ink)" />
      <rect x="2" y="19" width="12" height="1" fill="var(--color-ink)" />
    </svg>
  )
}

export function WaterWidget() {
  const settings = useAppStore((s) => s.settings)
  const water = useAppStore((s) => s.water)
  const addWater = useAppStore((s) => s.addWater)
  const removeLastWaterToday = useAppStore((s) => s.removeLastWaterToday)

  const goal = waterGoalMl(settings.weightKg)
  const today = todayKey()
  const ml = mlOnDay(water, today)
  const cups = water.filter((w) => w.dateKey === today).length
  const goalCups = Math.ceil(goal / settings.cupMl)
  const done = ml >= goal

  return (
    <div className="pixel-panel flex flex-col gap-3 bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-pixel text-[10px] text-muted">Hidratação</h2>
        <span className="text-xs text-muted">
          {ml} / {goal} ml
        </span>
      </div>

      <div className="flex items-center gap-3">
        <PixelGlass fraction={ml / goal} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="font-pixel text-sm text-water">
            {cups}/{goalCups} copos
          </p>
          <div className="flex flex-wrap gap-[3px]">
            {Array.from({ length: goalCups }).map((_, i) => (
              <span
                key={i}
                className={`size-2.5 border border-ink ${i < cups ? 'bg-water' : 'bg-bg'}`}
                aria-hidden
              />
            ))}
          </div>
          {done ? (
            <p className="text-sm font-medium text-success">Meta batida! 🎉</p>
          ) : (
            <p className="text-xs text-muted">Faltam {goal - ml} ml</p>
          )}
        </div>
      </div>

      {/* CTA mais usado do painel: largura total e 48px de altura. */}
      <div className="flex gap-2">
        <button
          onClick={addWater}
          className="pixel-btn flex h-[48px] flex-1 items-center justify-center gap-2 bg-water text-sm font-medium text-white"
        >
          <Plus size={17} /> Bebi um copo ({settings.cupMl} ml)
        </button>
        {cups > 0 && (
          <button
            onClick={removeLastWaterToday}
            title="Desfazer o último copo"
            aria-label="Desfazer o último copo"
            className="pixel-btn flex size-[48px] shrink-0 items-center justify-center bg-surface text-muted hover:text-ink"
          >
            <Minus size={17} />
          </button>
        )}
      </div>

      {!settings.weightKg && (
        <p className="text-xs text-muted">Configure seu peso nos ajustes para a meta considerar você.</p>
      )}
    </div>
  )
}
