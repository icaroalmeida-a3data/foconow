import { supabase } from './supabase'
import { rowToRewards, rowToSession, rowToTask, type RewardsRow, type SessionRow, type TaskRow } from './repo'
import { upsertById, useAppStore } from '../store'

// Mantém o app em dia com mudanças feitas fora dele — principalmente o Claude criando e
// concluindo tarefas pelo conector MCP. Sem filtro por user_id: o RLS já limita INSERT/UPDATE
// às linhas do usuário, e eventos de DELETE não aceitam filtro (só trazem o id).
export function startRealtimeSync(userId: string): () => void {
  const { setState, getState } = useAppStore

  const channel = supabase
    .channel(`foconow-${userId}`)
    .on<TaskRow>('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        setState({ tasks: getState().tasks.filter((t) => t.id !== payload.old.id) })
      } else {
        setState({ tasks: upsertById(getState().tasks, rowToTask(payload.new)) })
      }
    })
    .on<SessionRow>('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        setState({ sessions: getState().sessions.filter((s) => s.id !== payload.old.id) })
      } else {
        setState({ sessions: upsertById(getState().sessions, rowToSession(payload.new)) })
      }
    })
    .on<RewardsRow>('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, (payload) => {
      if (payload.eventType !== 'DELETE') setState({ rewards: rowToRewards(payload.new) })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
