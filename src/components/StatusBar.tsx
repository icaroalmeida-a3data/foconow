import { Flame, Star } from 'lucide-react'
import { useAppStore } from '../store'
import { levelProgress } from '../lib/rewards'

export function StatusBar() {
  const rewards = useAppStore((s) => s.rewards)
  const { level, fraction } = levelProgress(rewards.points)

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <div className="flex items-center gap-2 border-2 border-ink bg-brand-light px-2.5 py-1 text-sm font-medium text-brand-dark">
        <Star size={15} className="fill-brand-dark text-brand-dark" />
        Nível {level}
        <div className="hidden h-2 w-16 border border-ink bg-surface sm:block">
          <div className="h-full bg-brand-dark" style={{ width: `${Math.min(100, fraction * 100)}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-2 border-ink bg-warn-light px-2.5 py-1 text-sm font-medium text-warn">
        <Flame size={15} className={rewards.streakDays > 0 ? 'fill-warn text-warn' : 'text-muted'} />
        {rewards.streakDays} {rewards.streakDays === 1 ? 'dia' : 'dias'}
      </div>
      <div className="border-2 border-ink bg-surface px-2.5 py-1 text-sm font-semibold text-ink">
        {rewards.points} pts
      </div>
    </div>
  )
}
