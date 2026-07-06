import { supabase } from './supabase'
import type { FocusSession, RewardsState, Settings, Task, WaterEntry } from '../types'
import { DEFAULT_SETTINGS } from '../types'

// Camada de acesso a dados: converte snake_case (Postgres) <-> camelCase (app).
// Os tipos do app são mantidos intactos; `id: 1` de rewards/settings vira user_id no banco.

type TaskRow = {
  id: number
  title: string
  category: string
  priority: string
  due_date: string | null
  estimated_pomodoros: number
  completed_pomodoros: number
  done: boolean
  created_at: string
  completed_at: string | null
}

type SessionRow = {
  id: number
  task_id: number | null
  type: string
  duration_minutes: number
  started_at: string
  ended_at: string | null
  completed: boolean
}

type WaterRow = { id: number; date_key: string; ml: number; at: string }

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    category: r.category as Task['category'],
    priority: r.priority as Task['priority'],
    dueDate: r.due_date ?? undefined,
    estimatedPomodoros: r.estimated_pomodoros,
    completedPomodoros: r.completed_pomodoros,
    done: r.done,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
  }
}

function taskToRow(t: Partial<Task>) {
  const row: Record<string, unknown> = {}
  if (t.title !== undefined) row.title = t.title
  if (t.category !== undefined) row.category = t.category
  if (t.priority !== undefined) row.priority = t.priority
  if ('dueDate' in t) row.due_date = t.dueDate ?? null
  if (t.estimatedPomodoros !== undefined) row.estimated_pomodoros = t.estimatedPomodoros
  if (t.completedPomodoros !== undefined) row.completed_pomodoros = t.completedPomodoros
  if (t.done !== undefined) row.done = t.done
  if (t.createdAt !== undefined) row.created_at = t.createdAt
  if ('completedAt' in t) row.completed_at = t.completedAt ?? null
  return row
}

function rowToSession(r: SessionRow): FocusSession {
  return {
    id: r.id,
    taskId: r.task_id ?? undefined,
    type: r.type as FocusSession['type'],
    durationMinutes: r.duration_minutes,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    completed: r.completed,
  }
}

function sessionToRow(s: Partial<FocusSession>) {
  const row: Record<string, unknown> = {}
  if ('taskId' in s) row.task_id = s.taskId ?? null
  if (s.type !== undefined) row.type = s.type
  if (s.durationMinutes !== undefined) row.duration_minutes = s.durationMinutes
  if (s.startedAt !== undefined) row.started_at = s.startedAt
  if ('endedAt' in s) row.ended_at = s.endedAt ?? null
  if (s.completed !== undefined) row.completed = s.completed
  return row
}

function throwOn(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchAll(): Promise<{
  tasks: Task[]
  sessions: FocusSession[]
  rewards: RewardsState
  settings: Settings
  water: WaterEntry[]
}> {
  const [tasksRes, sessionsRes, rewardsRes, settingsRes, waterRes] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('sessions').select('*').order('started_at', { ascending: false }),
    supabase.from('rewards').select('*').maybeSingle(),
    supabase.from('settings').select('*').maybeSingle(),
    supabase.from('water_entries').select('*').order('date_key').order('at'),
  ])
  throwOn(tasksRes.error)
  throwOn(sessionsRes.error)
  throwOn(rewardsRes.error)
  throwOn(settingsRes.error)
  throwOn(waterRes.error)

  let rewards: RewardsState
  if (rewardsRes.data) {
    rewards = {
      id: 1,
      points: rewardsRes.data.points,
      streakDays: rewardsRes.data.streak_days,
      lastActiveDate: rewardsRes.data.last_active_date ?? undefined,
      lastWaterGoalDate: rewardsRes.data.last_water_goal_date ?? undefined,
    }
  } else {
    rewards = { id: 1, points: 0, streakDays: 0 }
    await saveRewards(rewards)
  }

  let settings: Settings
  if (settingsRes.data) {
    settings = {
      id: 1,
      workStart: settingsRes.data.work_start,
      workEnd: settingsRes.data.work_end,
      weightKg: settingsRes.data.weight_kg === null ? null : Number(settingsRes.data.weight_kg),
      cupMl: settingsRes.data.cup_ml,
    }
  } else {
    settings = DEFAULT_SETTINGS
    await saveSettings(settings)
  }

  return {
    tasks: (tasksRes.data as TaskRow[]).map(rowToTask),
    sessions: (sessionsRes.data as SessionRow[]).map(rowToSession),
    rewards,
    settings,
    water: (waterRes.data as WaterRow[]).map((r) => ({ id: r.id, dateKey: r.date_key, ml: r.ml, at: r.at })),
  }
}

export async function addTask(task: Task): Promise<number> {
  const { data, error } = await supabase.from('tasks').insert(taskToRow(task)).select('id').single()
  throwOn(error)
  return data!.id
}

export async function updateTask(id: number, patch: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(taskToRow(patch)).eq('id', id)
  throwOn(error)
}

export async function deleteTask(id: number): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  throwOn(error)
}

export async function addSession(session: FocusSession): Promise<number> {
  const { data, error } = await supabase.from('sessions').insert(sessionToRow(session)).select('id').single()
  throwOn(error)
  return data!.id
}

export async function updateSession(id: number, patch: Partial<FocusSession>): Promise<void> {
  const { error } = await supabase.from('sessions').update(sessionToRow(patch)).eq('id', id)
  throwOn(error)
}

export async function deleteSession(id: number): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  throwOn(error)
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sessão expirada. Entre de novo.')
  return id
}

export async function saveRewards(rewards: RewardsState): Promise<void> {
  const { error } = await supabase.from('rewards').upsert({
    user_id: await currentUserId(),
    points: rewards.points,
    streak_days: rewards.streakDays,
    last_active_date: rewards.lastActiveDate ?? null,
    last_water_goal_date: rewards.lastWaterGoalDate ?? null,
  })
  throwOn(error)
}

export async function saveSettings(settings: Settings): Promise<void> {
  const { error } = await supabase.from('settings').upsert({
    user_id: await currentUserId(),
    work_start: settings.workStart,
    work_end: settings.workEnd,
    weight_kg: settings.weightKg,
    cup_ml: settings.cupMl,
  })
  throwOn(error)
}

export async function addWater(entry: WaterEntry): Promise<number> {
  const { data, error } = await supabase
    .from('water_entries')
    .insert({ date_key: entry.dateKey, ml: entry.ml, at: entry.at })
    .select('id')
    .single()
  throwOn(error)
  return data!.id
}

export async function deleteWater(id: number): Promise<void> {
  const { error } = await supabase.from('water_entries').delete().eq('id', id)
  throwOn(error)
}
