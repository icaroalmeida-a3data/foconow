import type { SessionType } from '../types'

export const DURATIONS: Record<SessionType, number> = {
  foco: 25,
  'pausa-curta': 5,
  'pausa-longa': 15,
}

export const SESSION_LABELS: Record<SessionType, string> = {
  foco: 'Foco',
  'pausa-curta': 'Pausa curta',
  'pausa-longa': 'Pausa longa',
}

export function focoPoints(durationMinutes: number) {
  return Math.max(5, Math.round(durationMinutes * 0.6))
}

export const DURATION_PRESETS = [25, 45, 60, 90]
