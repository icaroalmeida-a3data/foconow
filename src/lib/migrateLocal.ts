import { db } from '../db'
import { supabase } from './supabase'

// Importa os dados que já existiam no IndexedDB (era o armazenamento antigo do app)
// para o Supabase, uma única vez por usuário. Só roda se a conta estiver vazia,
// para nunca sobrescrever dados remotos.
export async function migrateLocalData(userId: string): Promise<boolean> {
  const flag = `foconow:migrated:${userId}`
  if (localStorage.getItem(flag)) return false

  try {
    const [localTasks, localSessions, localRewards, localSettings, localWater] = await Promise.all([
      db.tasks.toArray(),
      db.sessions.toArray(),
      db.rewards.get(1),
      db.settings.get(1),
      db.water.toArray(),
    ])

    const hasLocal = localTasks.length > 0 || localSessions.length > 0 || localWater.length > 0
    if (!hasLocal) {
      localStorage.setItem(flag, '1')
      return false
    }

    const { count, error: countError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    if (countError) throw new Error(countError.message)
    if ((count ?? 0) > 0) {
      // conta já tem dados: não mistura, só marca como resolvido
      localStorage.setItem(flag, '1')
      return false
    }

    // Tarefas primeiro, guardando o mapa id local -> id remoto para religar as sessões
    const idMap = new Map<number, number>()
    if (localTasks.length > 0) {
      const rows = localTasks.map((t) => ({
        title: t.title,
        category: t.category,
        priority: t.priority,
        due_date: t.dueDate ?? null,
        estimated_pomodoros: t.estimatedPomodoros,
        completed_pomodoros: t.completedPomodoros,
        done: t.done,
        created_at: t.createdAt,
        completed_at: t.completedAt ?? null,
      }))
      const { data, error } = await supabase.from('tasks').insert(rows).select('id')
      if (error) throw new Error(error.message)
      // o insert devolve as linhas na mesma ordem do payload
      data!.forEach((row, i) => {
        const localId = localTasks[i].id
        if (localId !== undefined) idMap.set(localId, row.id)
      })
    }

    if (localSessions.length > 0) {
      const rows = localSessions.map((s) => ({
        task_id: s.taskId !== undefined ? (idMap.get(s.taskId) ?? null) : null,
        type: s.type,
        duration_minutes: s.durationMinutes,
        started_at: s.startedAt,
        ended_at: s.endedAt ?? null,
        completed: s.completed,
      }))
      const { error } = await supabase.from('sessions').insert(rows)
      if (error) throw new Error(error.message)
    }

    if (localWater.length > 0) {
      const rows = localWater.map((w) => ({ date_key: w.dateKey, ml: w.ml, at: w.at }))
      const { error } = await supabase.from('water_entries').insert(rows)
      if (error) throw new Error(error.message)
    }

    if (localRewards) {
      const { error } = await supabase.from('rewards').upsert({
        user_id: userId,
        points: localRewards.points,
        streak_days: localRewards.streakDays,
        last_active_date: localRewards.lastActiveDate ?? null,
        last_water_goal_date: localRewards.lastWaterGoalDate ?? null,
      })
      if (error) throw new Error(error.message)
    }

    if (localSettings) {
      const { error } = await supabase.from('settings').upsert({
        user_id: userId,
        work_start: localSettings.workStart,
        work_end: localSettings.workEnd,
        weight_kg: localSettings.weightKg,
        cup_ml: localSettings.cupMl,
      })
      if (error) throw new Error(error.message)
    }

    localStorage.setItem(flag, '1')
    return true
  } catch (err) {
    // migração falhou (ex.: IndexedDB indisponível ou rede caiu no meio):
    // não marca a flag, tenta de novo no próximo login
    console.error('Falha ao migrar dados locais para o Supabase:', err)
    return false
  }
}
