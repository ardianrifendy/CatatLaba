import { Capacitor } from '@capacitor/core'

// A backend-agnostic, async SQLite executor. Drizzle's sqlite-proxy driver is
// layered on top of this (see client.ts) so the rest of the app codes against a
// single db type regardless of platform.
//
// Rows are returned as POSITIONAL value arrays (not column-keyed objects)
// because that is the contract drizzle-orm/sqlite-proxy expects.
export interface SqliteExecutor {
  run(sql: string, params?: unknown[]): Promise<void>
  all(sql: string, params?: unknown[]): Promise<unknown[][]>
  get(sql: string, params?: unknown[]): Promise<unknown[] | undefined>
}

export async function createExecutor(): Promise<SqliteExecutor> {
  if (Capacitor.getPlatform() === 'web') {
    const { createWebExecutor } = await import('./executor.web')
    return createWebExecutor()
  }
  const { createNativeExecutor } = await import('./executor.native')
  return createNativeExecutor()
}
