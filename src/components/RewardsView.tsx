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

  const totalFocoMinutes = useMemo(
    () => sessions.filter((s) => s.type === 'foco' && s.completed).reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions],
  )
  const tasksDone = tasks.filter((t) => t.done).length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <section className="pixel-panel bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Nível atual</p>
            <p className="font-pixel text-xl text-ink">Nv {level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Pontos totais</p>
            <p className="font-pixel text-xl text-brand">{rewards.points}</p>
          </div>
        </div>
        <div className="mt-4 h-4 border-2 border-ink bg-bg">
          <div className="h-full bg-brand transition-all" style={{ width: `${Math.min(100, fraction * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {into} / {span} pts para o nível {level + 1}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-warn">🔥{rewards.streakDays}</p>
          <p className="mt-1 text-xs text-muted">dias seguidos</p>
        </div>
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{tasksDone}</p>
          <p className="mt-1 text-xs text-muted">tarefas concluídas</p>
        </div>
        <div className="pixel-panel bg-surface p-4 text-center">
          <p className="font-pixel text-lg text-ink">{totalFocoMinutes}</p>
          <p className="mt-1 text-xs text-muted">minutos de foco</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-pixel text-[10px] text-muted">Conquistas</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center gap-1 p-4 text-center ${
                b.earned ? 'pixel-panel-sm animate-pop-in bg-brand-light' : 'border-2 border-dashed border-muted bg-surface opacity-50 grayscale'
              }`}
              title={b.description}
            >
              <span className="text-3xl">{b.emoji}</span>
              <span className="text-xs font-medium text-ink">{b.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
