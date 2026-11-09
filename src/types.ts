export type View = 'dashboard' | 'tasks' | 'focus' | 'rewards' | 'history'

export type Category =
  | 'proposta'
  | 'reuniao'
  | 'arquitetura'
  | 'documentacao'
  | 'admin'
  | 'outro'

export type Priority = 'alta' | 'media' | 'baixa'

/** Etapa de uma tarefa aberta no Kanban. "Concluído" não é etapa: é o campo done. */
export type Stage = 'a_fazer' | 'fazendo'

/** Coluna do quadro: as etapas abertas + concluída. */
export type BoardColumn = Stage | 'concluida'

export function boardColumnOf(task: { done: boolean; stage: Stage }): BoardColumn {
  return task.done ? 'concluida' : task.stage
}

export interface Task {
  id?: number
  title: string
  category: Category
  priority: Priority
  stage: Stage
  dueDate?: string // yyyy-MM-dd
  estimatedPomodoros: number
  completedPomodoros: number
  done: boolean
  createdAt: string // ISO
  completedAt?: string // ISO
}

export type SessionType = 'foco' | 'pausa-curta' | 'pausa-longa'

export interface FocusSession {
  id?: number
  taskId?: number
  type: SessionType
  durationMinutes: number
  startedAt: string // ISO
  endedAt?: string // ISO
  completed: boolean
}

export interface RewardsState {
  id: 1
  points: number
  streakDays: number
  lastActiveDate?: string // yyyy-MM-dd
  lastWaterGoalDate?: string // yyyy-MM-dd — evita pontuar a meta de água duas vezes no dia
}

export interface Settings {
  id: 1
  workStart: string // HH:mm
  workEnd: string // HH:mm
  weightKg: number | null
  cupMl: number
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  workStart: '09:00',
  workEnd: '18:00',
  weightKg: null,
  cupMl: 250,
}

export interface WaterEntry {
  id?: number
  dateKey: string // yyyy-MM-dd
  ml: number
  at: string // ISO
}

// Tokens --color-cat-* (src/index.css), não hex: o par cor/fundo inverte sozinho no tema escuro
const cat = (key: Category, label: string) => ({
  label,
  color: `var(--color-cat-${key})`,
  bg: `var(--color-cat-${key}-light)`,
})

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string }> = {
  proposta: cat('proposta', 'Proposta'),
  reuniao: cat('reuniao', 'Reunião'),
  arquitetura: cat('arquitetura', 'Arquitetura'),
  documentacao: cat('documentacao', 'Documentação'),
  admin: cat('admin', 'Admin'),
  outro: cat('outro', 'Outro'),
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; weight: number; points: number; color: string; bg: string }
> = {
  // Tokens, não hex: os pares X / X-light invertem sozinhos no tema escuro
  alta: { label: 'Alta', weight: 3, points: 25, color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
  media: { label: 'Média', weight: 2, points: 15, color: 'var(--color-focus)', bg: 'var(--color-focus-light)' },
  baixa: { label: 'Baixa', weight: 1, points: 10, color: 'var(--color-muted)', bg: 'var(--color-bg)' },
}
