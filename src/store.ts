import { create } from 'zustand'
import * as repo from './lib/repo'
import type { Category, FocusSession, Priority, RewardsState, SessionType, Settings, Task, WaterEntry } from './types'
import { DEFAULT_SETTINGS, PRIORITY_META } from './types'
import { applyStreak, dayKeyFromISO, todayKey } from './lib/rewards'
import { DURATIONS, focoPoints } from './lib/pomodoro'
import { notify, playBreakEndChime, playFocusEndChime } from './lib/notifications'
import { mlOnDay, WATER_GOAL_POINTS, waterGoalMl } from './lib/water'

let tickInterval: ReturnType<typeof setInterval> | null = null

function clearTicking() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

interface AppState {
  loaded: boolean
  tasks: Task[]
  sessions: FocusSession[]
  rewards: RewardsState
  focusTaskId: number | null
  setFocusTaskId: (id: number | null) => void

  historyDate: string | null
  setHistoryDate: (date: string | null) => void

  settings: Settings
  saveSettings: (patch: Partial<Omit<Settings, 'id'>>) => Promise<void>

  water: WaterEntry[]
  addWater: () => Promise<void>
  removeLastWaterToday: () => Promise<void>

  load: () => Promise<void>
  reset: () => void

  addTask: (input: { title: string; category: Category; priority: Priority; dueDate?: string; estimatedPomodoros: number }) => Promise<void>
  toggleTaskDone: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  bumpTaskPomodoro: (id: number) => Promise<void>

  startSession: (type: SessionType, durationMinutes: number, taskId?: number) => Promise<number>
  completeSession: (id: number) => Promise<void>
  cancelSession: (id: number) => Promise<void>

  addPoints: (amount: number) => Promise<void>

  timerMode: SessionType
  timerDurationMinutes: number
  timerSecondsLeft: number
  timerRunning: boolean
  timerTaskId: number | null
  timerSessionId: number | null
  setTimerMode: (mode: SessionType) => void
  setTimerDurationMinutes: (minutes: number) => void
  setTimerTaskId: (id: number | null) => void
  startTimer: () => Promise<void>
  extendFocus: (minutes: number) => Promise<void>
  pauseTimer: () => void
  resetTimer: () => Promise<void>
  skipTimer: () => Promise<void>
  finishTimer: () => Promise<void>
  finishTimerEarly: () => Promise<void>

  toast: {
    id: number
    kind: 'foco' | 'pausa' | 'agua' | 'inatividade' | 'erro'
    title: string
    body: string
    /** mostra os botões de +5/+10 min ao fim de um bloco de foco */
    offerExtend?: boolean
  } | null
  clearToast: () => void
}

const DEFAULT_REWARDS: RewardsState = { id: 1, points: 0, streakDays: 0 }

export const useAppStore = create<AppState>((set, get) => ({
  loaded: false,
  tasks: [],
  sessions: [],
  rewards: DEFAULT_REWARDS,
  focusTaskId: null,
  setFocusTaskId: (id) => set({ focusTaskId: id }),

  historyDate: null,
  setHistoryDate: (date) => set({ historyDate: date }),

  settings: DEFAULT_SETTINGS,
  saveSettings: async (patch) => {
    const next: Settings = { ...get().settings, ...patch, id: 1 }
    await repo.saveSettings(next)
    set({ settings: next })
  },

  water: [],
  addWater: async () => {
    const { settings, water } = get()
    const entry: WaterEntry = { dateKey: todayKey(), ml: settings.cupMl, at: new Date().toISOString() }
    const id = await repo.addWater(entry)
    const nextWater = [...water, { ...entry, id }]
    set({ water: nextWater })

    const goal = waterGoalMl(settings.weightKg)
    const rewards = get().rewards
    if (mlOnDay(nextWater, entry.dateKey) >= goal && rewards.lastWaterGoalDate !== entry.dateKey) {
      const withStreak = applyStreak(rewards)
      const next: RewardsState = {
        ...withStreak,
        points: withStreak.points + WATER_GOAL_POINTS,
        lastWaterGoalDate: entry.dateKey,
      }
      await repo.saveRewards(next)
      set({
        rewards: next,
        toast: {
          id: Date.now(),
          kind: 'foco',
          title: 'Meta de água batida! 🎉',
          body: `+${WATER_GOAL_POINTS} pontos. Continue se hidratando!`,
        },
      })
    }
  },
  removeLastWaterToday: async () => {
    const { water } = get()
    const todayEntries = water.filter((w) => w.dateKey === todayKey())
    const last = todayEntries[todayEntries.length - 1]
    if (!last?.id) return
    await repo.deleteWater(last.id)
    set({ water: water.filter((w) => w.id !== last.id) })
  },

  load: async () => {
    const { tasks, sessions, rewards, settings, water } = await repo.fetchAll()
    set({ tasks, sessions, rewards, settings, water, loaded: true })
  },

  reset: () => {
    clearTicking()
    set({
      loaded: false,
      tasks: [],
      sessions: [],
      rewards: DEFAULT_REWARDS,
      settings: DEFAULT_SETTINGS,
      water: [],
      focusTaskId: null,
      historyDate: null,
      timerMode: 'foco',
      timerDurationMinutes: DURATIONS.foco,
      timerSecondsLeft: DURATIONS.foco * 60,
      timerRunning: false,
      timerTaskId: null,
      timerSessionId: null,
      toast: null,
    })
  },

  addTask: async (input) => {
    const task: Task = {
      title: input.title,
      category: input.category,
      priority: input.priority,
      dueDate: input.dueDate,
      estimatedPomodoros: input.estimatedPomodoros,
      completedPomodoros: 0,
      done: false,
      createdAt: new Date().toISOString(),
    }
    const id = await repo.addTask(task)
    set({ tasks: [{ ...task, id }, ...get().tasks] })
  },

  toggleTaskDone: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const nowDone = !task.done
    const patch = { done: nowDone, completedAt: nowDone ? new Date().toISOString() : undefined }
    await repo.updateTask(id, patch)
    set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
    if (nowDone) {
      await get().addPoints(PRIORITY_META[task.priority].points)
    }
  },

  deleteTask: async (id) => {
    await repo.deleteTask(id)
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
  },

  bumpTaskPomodoro: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const completedPomodoros = task.completedPomodoros + 1
    await repo.updateTask(id, { completedPomodoros })
    set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, completedPomodoros } : t)) })
  },

  startSession: async (type, durationMinutes, taskId) => {
    const session: FocusSession = {
      taskId,
      type,
      durationMinutes,
      startedAt: new Date().toISOString(),
      completed: false,
    }
    const id = await repo.addSession(session)
    set({ sessions: [{ ...session, id }, ...get().sessions] })
    return id
  },

  completeSession: async (id) => {
    const session = get().sessions.find((s) => s.id === id)
    if (!session) return
    const patch = { completed: true, endedAt: new Date().toISOString() }
    await repo.updateSession(id, patch)
    set({ sessions: get().sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
    if (session.taskId) {
      await get().bumpTaskPomodoro(session.taskId)
    }
    if (session.type === 'foco') {
      await get().addPoints(focoPoints(session.durationMinutes))
    }
  },

  cancelSession: async (id) => {
    await repo.deleteSession(id)
    set({ sessions: get().sessions.filter((s) => s.id !== id) })
  },

  addPoints: async (amount) => {
    const current = get().rewards
    const withStreak = applyStreak(current)
    const next: RewardsState = { ...withStreak, points: withStreak.points + amount }
    await repo.saveRewards(next)
    set({ rewards: next })
  },

  timerMode: 'foco',
  timerDurationMinutes: DURATIONS.foco,
  timerSecondsLeft: DURATIONS.foco * 60,
  timerRunning: false,
  timerTaskId: null,
  timerSessionId: null,

  setTimerMode: (mode) => {
    if (get().timerRunning) return
    set({ timerMode: mode, timerDurationMinutes: DURATIONS[mode], timerSecondsLeft: DURATIONS[mode] * 60 })
  },

  setTimerDurationMinutes: (minutes) => {
    if (get().timerRunning) return
    const clamped = Math.min(180, Math.max(1, Math.round(minutes)))
    set({ timerDurationMinutes: clamped, timerSecondsLeft: clamped * 60 })
  },

  setTimerTaskId: (id) => set({ timerTaskId: id }),

  startTimer: async () => {
    const state = get()
    if (state.timerRunning) return
    const endAt = Date.now() + state.timerSecondsLeft * 1000
    const id = await state.startSession(
      state.timerMode,
      state.timerDurationMinutes,
      state.timerMode === 'foco' && state.timerTaskId ? state.timerTaskId : undefined,
    )
    set({ timerRunning: true, timerSessionId: id })
    clearTicking()
    tickInterval = setInterval(() => {
      const s = get()
      if (!s.timerRunning) return
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      set({ timerSecondsLeft: remaining })
      if (remaining === 0) {
        get().finishTimer()
      }
    }, 250)
  },

  // Emenda mais alguns minutos de foco logo após um bloco terminar, sem
  // quebrar o ritmo: mantém a mesma tarefa e registra como um novo bloco
  extendFocus: async (minutes) => {
    const state = get()
    if (state.timerRunning) return
    set({
      timerMode: 'foco',
      timerDurationMinutes: minutes,
      timerSecondsLeft: minutes * 60,
      toast: null,
    })
    await get().startTimer()
  },

  pauseTimer: () => {
    clearTicking()
    set({ timerRunning: false })
  },

  resetTimer: async () => {
    clearTicking()
    const { timerSessionId, timerDurationMinutes } = get()
    set({ timerRunning: false, timerSessionId: null, timerSecondsLeft: timerDurationMinutes * 60 })
    if (timerSessionId) await get().cancelSession(timerSessionId)
  },

  skipTimer: async () => {
    clearTicking()
    const { timerSessionId, timerMode } = get()
    const nextMode: SessionType = timerMode === 'foco' ? 'pausa-curta' : 'foco'
    set({
      timerRunning: false,
      timerSessionId: null,
      timerMode: nextMode,
      timerDurationMinutes: DURATIONS[nextMode],
      timerSecondsLeft: DURATIONS[nextMode] * 60,
    })
    if (timerSessionId) await get().cancelSession(timerSessionId)
  },

  finishTimer: async () => {
    const { timerDurationMinutes } = get()
    await completeCurrentSession(timerDurationMinutes)
  },

  finishTimerEarly: async () => {
    const { timerSessionId, timerDurationMinutes, timerSecondsLeft } = get()
    if (!timerSessionId) return
    const elapsedMinutes = Math.max(1, Math.round((timerDurationMinutes * 60 - timerSecondsLeft) / 60))
    await completeCurrentSession(elapsedMinutes)
  },

  toast: null,
  clearToast: () => set({ toast: null }),
}))

async function completeCurrentSession(elapsedMinutes: number) {
  const { getState, setState } = useAppStore
  clearTicking()
  const { timerSessionId, timerMode } = getState()
  setState({ timerRunning: false })

  if (timerSessionId) {
    await repo.updateSession(timerSessionId, { durationMinutes: elapsedMinutes })
    setState({ sessions: getState().sessions.map((s) => (s.id === timerSessionId ? { ...s, durationMinutes: elapsedMinutes } : s)) })
    await getState().completeSession(timerSessionId)
  }

  const isFoco = timerMode === 'foco'
  const title = isFoco ? 'Bloco de foco concluído! 🎉' : 'Pausa concluída'
  const body = isFoco ? `+${focoPoints(elapsedMinutes)} pontos. Hora de uma pausa.` : 'Hora de voltar ao foco.'

  if (isFoco) playFocusEndChime()
  else playBreakEndChime()
  notify(title, body)
  setState({ toast: { id: Date.now(), kind: isFoco ? 'foco' : 'pausa', title, body, offerExtend: isFoco } })

  const focoCountToday = getState().sessions.filter(
    (s) => s.type === 'foco' && s.completed && dayKeyFromISO(s.startedAt) === todayKey(),
  ).length
  const nextMode: SessionType = isFoco ? (focoCountToday % 4 === 0 ? 'pausa-longa' : 'pausa-curta') : 'foco'
  setState({
    timerMode: nextMode,
    timerDurationMinutes: DURATIONS[nextMode],
    timerSecondsLeft: DURATIONS[nextMode] * 60,
    timerSessionId: null,
  })
}
