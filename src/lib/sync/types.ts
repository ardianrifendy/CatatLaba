export const syncTables = [
  'wallets',
  'categories',
  'channels',
  'products',
  'recurring_rules',
  'transactions',
  'transaction_items',
  'budgets',
] as const

export type SyncTable = (typeof syncTables)[number]

export type SyncStatus = 'offline' | 'signed_out' | 'idle' | 'syncing' | 'error'

export interface SyncSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
  email: string | null
}

export interface SyncSnapshot {
  status: SyncStatus
  lastSyncedAt: string | null
  message: string | null
  session: SyncSession | null
}

export type SyncRow = Record<string, string | number | boolean | null>
