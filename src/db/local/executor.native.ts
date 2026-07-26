import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite'
import type { SqliteExecutor } from './executor'

const DB_NAME = 'catatlaba'
const DB_VERSION = 1

// UNVERIFIED on device — no Android SDK on this dev machine, so this path has
// never run against a real @capacitor-community/sqlite native database. It
// compiles and follows the documented API, but must be re-tested on an
// emulator/device (Phase 8 hardening) before it can be trusted.
//
// capacitor-sqlite returns query rows as column-keyed objects, while Drizzle's
// sqlite-proxy expects positional value arrays; we convert with Object.values().
// That relies on the driver preserving SELECT column order and would break for
// duplicate/ambiguous column names.
export async function createNativeExecutor(): Promise<SqliteExecutor> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const conn: SQLiteDBConnection = await sqlite.createConnection(
    DB_NAME,
    false,
    'no-encryption',
    DB_VERSION,
    false,
  )
  await conn.open()

  return {
    async run(sql, params = []) {
      // transaction=false: the migration runner manages BEGIN/COMMIT itself, so
      // the driver must not wrap each statement in its own transaction.
      await conn.run(sql, params, false)
    },
    async all(sql, params = []) {
      const res = await conn.query(sql, params)
      return (res.values ?? []).map((row) => Object.values(row as Record<string, unknown>))
    },
    async get(sql, params = []) {
      const res = await conn.query(sql, params)
      const first = res.values?.[0]
      return first === undefined ? undefined : Object.values(first as Record<string, unknown>)
    },
  }
}
