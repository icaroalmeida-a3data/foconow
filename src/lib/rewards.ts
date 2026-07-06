import type { FocusSession, RewardsState, Task, WaterEntry } from '../types'
import { daysGoalMet } from './water'

const POINTS_PER_LEVEL = 100

export function levelFromPoints(points: number) {
  return 1 + Math.floor(points / POINTS_PER_LEVEL)
}

export function levelProgress(points: number) {
  const level = levelFromPoints(points)
  const base = (level - 1) * POINTS_PER_LEVEL
  const into = points - base
  return { level, into, span: POINTS_PER_LEVEL, fraction: into / POINTS_PER_LEVEL }
}

// Chave de dia no fuso LOCAL (yyyy-MM-dd). Nunca usar toISOString aqui:
// em UTC-3, das 21h à meia-noite o dia "virava" mais cedo (água, streak e heatmap errados).
export function todayKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/** Dia local de um timestamp ISO (ex.: startedAt/completedAt vindos do banco). */
export function dayKeyFromISO(iso: string) {
  return todayKey(new Date(iso))
}

export function yesterdayKey(date = new Date()) {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  return todayKey(d)
}

/** Registers activity for streak purposes. Call whenever the user earns points. */
export function applyStreak(rewards: RewardsState): RewardsState {
  const today = todayKey()
  if (rewards.lastActiveDate === today) return rewards
  const wasYesterday = rewards.lastActiveDate === yesterdayKey()
  return {
    ...rewards,
    streakDays: wasYesterday ? rewards.streakDays + 1 : 1,
    lastActiveDate: today,
  }
}

export interface Badge {
  id: string
  label: string
  description: string
  emoji: string
  earned: boolean
}

export function computeBadges(
  tasks: Task[],
  sessions: FocusSession[],
  rewards: RewardsState,
  water: WaterEntry[] = [],
  waterGoal = 2000,
): Badge[] {
  const doneTasks = tasks.filter((t) => t.done)
  const focoSessions = sessions.filter((s) => s.type === 'foco' && s.completed)
  const totalFocoMinutes = focoSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const propostasDone = doneTasks.filter((t) => t.category === 'proposta').length
  const waterDays = daysGoalMet(water, waterGoal)

  const focoByDay = new Map<string, number>()
  for (const s of focoSessions) {
    const day = dayKeyFromISO(s.startedAt)
    focoByDay.set(day, (focoByDay.get(day) ?? 0) + 1)
  }
  const bestDayFoco = Math.max(0, ...Array.from(focoByDay.values()))

  const level = levelFromPoints(rewards.points)

  return [
    {
      id: 'primeira-tarefa',
      label: 'Primeiro Passo',
      description: 'Concluiu a primeira tarefa',
      emoji: '🌱',
      earned: doneTasks.length >= 1,
    },
    {
      id: 'dez-tarefas',
      label: 'Produtivo',
      description: 'Concluiu 10 tarefas',
      emoji: '📋',
      earned: doneTasks.length >= 10,
    },
    {
      id: 'foco-total',
      label: 'Foco Total',
      description: '4 blocos de foco em um único dia',
      emoji: '🎯',
      earned: bestDayFoco >= 4,
    },
    {
      id: 'maratonista',
      label: 'Maratonista',
      description: '500 minutos acumulados de foco',
      emoji: '⏱️',
      earned: totalFocoMinutes >= 500,
    },
    {
      id: 'streak-3',
      label: 'Consistência',
      description: '3 dias seguidos de atividade',
      emoji: '🔥',
      earned: rewards.streakDays >= 3,
    },
    {
      id: 'streak-7',
      label: 'Semana Cheia',
      description: '7 dias seguidos de atividade',
      emoji: '🔥',
      earned: rewards.streakDays >= 7,
    },
    {
      id: 'mestre-propostas',
      label: 'Mestre das Propostas',
      description: '5 propostas concluídas',
      emoji: '📄',
      earned: propostasDone >= 5,
    },
    {
      id: 'nivel-5',
      label: 'Nível 5',
      description: 'Alcançou o nível 5',
      emoji: '🏆',
      earned: level >= 5,
    },
    {
      id: 'primeiro-gole',
      label: 'Primeiro Gole',
      description: 'Registrou o primeiro copo de água',
      emoji: '💧',
      earned: water.length >= 1,
    },
    {
      id: 'hidratado',
      label: 'Hidratado',
      description: 'Bateu a meta de água em um dia',
      emoji: '🚰',
      earned: waterDays >= 1,
    },
    {
      id: 'camelo',
      label: 'Camelo',
      description: 'Bateu a meta de água em 5 dias',
      emoji: '🐪',
      earned: waterDays >= 5,
    },
  ]
}
