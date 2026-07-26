import { createDb, type LocalDb } from './client'
import { createExecutor } from './executor'
import type { SqliteExecutor } from './executor'
import { runMigrations } from './migrations'
import { seedDefaults } from './seed'

// The database handle plus the raw executor behind it. Repositories use `db`
// (Drizzle) for queries; the executor is exposed for the few places that need
// manual BEGIN/COMMIT (Drizzle's async sqlite-proxy driver does not support
// `db.transaction()`), e.g. writing a transaction and its items atomically.
export interface DbContext {
  db: LocalDb
  exec: SqliteExecutor
}

let context: DbContext | null = null

export interface InitDbResult {
  db: LocalDb
  migrationsApplied: number
}

// Boots the local SQLite database: opens the platform executor, runs pending
// migrations, seeds default reference data (idempotent), then constructs the
// Drizzle client. Call once at app startup.
export async function initDb(): Promise<InitDbResult> {
  const exec = await createExecutor()
  const migrationsApplied = await runMigrations(exec)
  const db = createDb(exec)
  context = { db, exec }
  await seedDefaults(db)
  return { db, migrationsApplied }
}

export function getContext(): DbContext {
  if (!context) {
    throw new Error('Local database not initialized — call initDb() during app startup.')
  }
  return context
}

export function getDb(): LocalDb {
  return getContext().db
}

export * from './schema'
export type { LocalDb } from './client'
export type { SqliteExecutor } from './executor'
