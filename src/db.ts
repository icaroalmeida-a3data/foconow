import Dexie, { type Table } from 'dexie'
import type { Task, FocusSession, RewardsState, Settings, WaterEntry } from './types'

// Armazenamento antigo (IndexedDB). Mantido apenas para a migração única
// dos dados locais para o Supabase — ver lib/migrateLocal.ts.
export class FocoNowDB extends Dexie {
  tasks!: Table<Task, number>
  sessions!: Table<FocusSession, number>
  rewards!: Table<RewardsState, number>
  settings!: Table<Settings, number>
  water!: Table<WaterEntry, number>

  constructor() {
    super('foconow')
    this.version(1).stores({
      tasks: '++id, category, priority, done, dueDate, createdAt',
      sessions: '++id, taskId, type, startedAt, completed',
      rewards: 'id',
    })
    this.version(2).stores({
      settings: 'id',
      water: '++id, dateKey',
    })
  }
}

export const db = new FocoNowDB()
