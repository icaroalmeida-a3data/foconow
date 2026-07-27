import { useMemo } from 'react'
import { useAppStore } from '../store'
import { computeBadges, levelProgress } from '../lib/rewards'
import { waterGoalMl } from '../lib/water'

export function RewardsView() {
  const tasks = useAppStore((s) => s.tasks)
  const sessions = useAppStore((s) => s.sessions)
  const rewards = useAppStore((s) => s.rewards)
  const water = useAppStore((s) => s.water)
  const settings = useAppStore((s) => s.settings)

  const badges = useMemo(
    () => computeBadges(tasks, sessions, rewards, water, waterGoalMl(settings.weightKg)),
    [tasks, sessions, rewards, water, settings.weightKg],
  )
  const { level, into, span, fraction } = levelProgress(rewards.points)
  const earnedCount = badges.filter((b) => b.earned).length

  const totalFocoMinutes = useMemo(
    () => sessions.filter((s) => s.type === 'foco' && s.completed).reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions],
  )
  const tasksDone = tasks.filter((t) => t.done).length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 md:gap-8">
      <section className="pixel-panel bg-surface p-4 md:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Nível atual</p>
            <p className="font-pixel text-lg text-ink md:text-xl">Nv {level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Pontos totais</p>
            <p className="font-pixel text-lg text-brand md:text-xl">{rewards.points}</p>
          </div>
        </div>
        <div className="mt-4 h-4 border-2 border-ink bg-bg">
          <div className="h-full bg-brand transition-all" style={{ width: `${Math.min(100, fraction * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {into} / {span} pts para o nível {level + 1}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2.5 md:gap-4">
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-warn md:text-lg">🔥{rewards.streakDays}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">dias</p>
        </div>
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-ink md:text-lg">{tasksDone}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">tarefas</p>
        </div>
        <div className="pixel-panel-sm bg-surface p-2.5 text-center md:p-4">
          <p className="font-pixel text-base text-ink md:text-lg">{totalFocoMinutes}</p>
          <p className="mt-1.5 text-xs leading-tight text-muted">min</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-pixel text-[10px] text-muted">
          Conquistas ({earnedCount} de {badges.length})
        </h2>
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 text-center md:p-4 ${
                b.earned
                  ? 'pixel-panel-sm animate-pop-in bg-brand-light'
                  : 'border-2 border-dashed border-muted bg-surface opacity-50 grayscale'
              }`}
              title={b.description}
            >
              <span className="text-2xl md:text-3xl">{b.emoji}</span>
              <span className="text-xs font-medium leading-tight text-ink">{b.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
