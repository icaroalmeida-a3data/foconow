import type { WaterEntry } from '../types'

/** Regra clássica de hidratação: 35 ml por kg de peso corporal por dia. */
export const ML_PER_KG = 35
/** Meta usada enquanto o peso não foi configurado. */
export const DEFAULT_GOAL_ML = 2000
/** Pontos ganhos ao bater a meta diária de água. */
export const WATER_GOAL_POINTS = 30

export function waterGoalMl(weightKg: number | null) {
  return weightKg ? Math.round(weightKg * ML_PER_KG) : DEFAULT_GOAL_ML
}

export function mlOnDay(water: WaterEntry[], dateKey: string) {
  return water.filter((w) => w.dateKey === dateKey).reduce((sum, w) => sum + w.ml, 0)
}

/** Dias em que a meta foi batida (usado nas conquistas). */
export function daysGoalMet(water: WaterEntry[], goalMl: number) {
  const byDay = new Map<string, number>()
  for (const w of water) byDay.set(w.dateKey, (byDay.get(w.dateKey) ?? 0) + w.ml)
  return [...byDay.values()].filter((ml) => ml >= goalMl).length
}
