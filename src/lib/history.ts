import type { FocusSession, Task } from '../types'
import { dayKeyFromISO } from './rewards'

export interface DayActivity {
  focusMinutes: number
  focusBlocks: number
  tasksDone: number
}

/** Agrega a atividade por dia (yyyy-MM-dd): blocos de foco concluídos e tarefas finalizadas. */
export function activityByDay(tasks: Task[], sessions: FocusSession[]): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>()
  const get = (key: string) => {
    let a = map.get(key)
    if (!a) {
      a = { focusMinutes: 0, focusBlocks: 0, tasksDone: 0 }
      map.set(key, a)
    }
    return a
  }
  for (const s of sessions) {
    if (s.type !== 'foco' || !s.completed) continue
    const a = get(dayKeyFromISO(s.startedAt))
    a.focusBlocks += 1
    a.focusMinutes += s.durationMinutes
  }
  for (const t of tasks) {
    if (!t.done || !t.completedAt) continue
    get(dayKeyFromISO(t.completedAt)).tasksDone += 1
  }
  return map
}

/** Intensidade 0–4 do dia para o heatmap, contando blocos de foco e tarefas. */
export function activityLevel(a?: DayActivity): number {
  if (!a) return 0
  const score = a.focusBlocks + a.tasksDone
  if (score <= 0) return 0
  if (score <= 2) return 1
  if (score <= 4) return 2
  if (score <= 7) return 3
  return 4
}

/** Tons de coral sobre creme, do vazio ao mais intenso — versão pixel do heatmap do GitHub. */
export const LEVEL_COLORS = ['#e7e3d8', '#f4d9cb', '#eaa887', '#d97757', '#a04a2e']

export function describeActivity(a?: DayActivity): string {
  if (!a) return 'sem atividade'
  return `${a.focusMinutes} min de foco · ${a.focusBlocks} ${a.focusBlocks === 1 ? 'bloco' : 'blocos'} · ${a.tasksDone} ${
    a.tasksDone === 1 ? 'tarefa' : 'tarefas'
  }`
}
