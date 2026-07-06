export type View = 'dashboard' | 'tasks' | 'focus' | 'rewards' | 'history'

export type Category =
  | 'proposta'
  | 'reuniao'
  | 'arquitetura'
  | 'documentacao'
  | 'admin'
  | 'outro'

export type Priority = 'alta' | 'media' | 'baixa'

export interface Task {
  id?: number
  title: string
  category: Category
  priority: Priority
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

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string }> = {
  proposta: { label: 'Proposta', color: '#a04a2e', bg: '#f7e0d3' },
  reuniao: { label: 'Reunião', color: '#2b6a8a', bg: '#ddeef2' },
  arquitetura: { label: 'Arquitetura', color: '#7d5ba6', bg: '#ece3f2' },
  documentacao: { label: 'Documentação', color: '#3f7d5d', bg: '#e0ede4' },
  admin: { label: 'Admin', color: '#5f5b4e', bg: '#eae7dc' },
  outro: { label: 'Outro', color: '#7a7462', bg: '#f0eee6' },
}

export const PRIORITY_META: Record<Priority, { label: string; weight: number; points: number }> = {
  alta: { label: 'Alta', weight: 3, points: 25 },
  media: { label: 'Média', weight: 2, points: 15 },
  baixa: { label: 'Baixa', weight: 1, points: 10 },
}
