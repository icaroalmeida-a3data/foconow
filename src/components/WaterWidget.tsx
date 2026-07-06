import { Minus, Plus } from 'lucide-react'
import { useAppStore } from '../store'
import { mlOnDay, waterGoalMl } from '../lib/water'
import { todayKey } from '../lib/rewards'

const INNER_ROWS = 17

function PixelGlass({ fraction }: { fraction: number }) {
  const fill = Math.max(0, Math.min(INNER_ROWS, Math.round(fraction * INNER_ROWS)))
  return (
    <svg viewBox="0 0 16 21" shapeRendering="crispEdges" className="h-32 w-auto shrink-0" aria-hidden>
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
    <div className="pixel-panel flex items-center gap-4 bg-surface p-4">
      <PixelGlass fraction={ml / goal} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-pixel text-[10px] text-muted">Hidratação</h2>
        <p className="font-pixel text-sm text-water">
          {cups}/{goalCups} copos
        </p>
        <p className="text-xs text-muted">
          {ml} de {goal} ml
          {settings.weightKg ? ` · meta pelo seu peso (${settings.weightKg} kg)` : ' · configure seu peso no ⚙️ para ajustar a meta'}
        </p>
        {done ? (
          <p className="text-sm font-medium text-success">Meta batida! 🎉</p>
        ) : (
          <p className="text-xs text-muted">Faltam {goal - ml} ml</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            onClick={addWater}
            className="pixel-btn flex items-center gap-1.5 bg-water px-3 py-1.5 text-sm font-medium text-white"
          >
            <Plus size={15} /> Bebi um copo ({settings.cupMl} ml)
          </button>
          {cups > 0 && (
            <button
              onClick={removeLastWaterToday}
              title="Desfazer o último copo"
              className="pixel-btn bg-surface p-2 text-muted hover:text-ink"
            >
              <Minus size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
