import { drizzle } from 'drizzle-orm/sqlite-proxy'
import type { SqliteExecutor } from './executor'
import * as schema from './schema'

// Wraps the platform executor in Drizzle's sqlite-proxy driver, giving the app
// a fully typed query builder over whatever SQLite backend is active.
export function createDb(exec: SqliteExecutor) {
  return drizzle(
    async (sql, params, method) => {
      switch (method) {
        case 'run':
          await exec.run(sql, params)
          return { rows: [] }
        case 'all':
        case 'values':
          return { rows: await exec.all(sql, params) }
        case 'get': {
          const row = await exec.get(sql, params)
          return { rows: row ?? [] }
        }
        default:
          throw new Error(`Unsupported sqlite-proxy method: ${String(method)}`)
      }
    },
    { schema },
  )
}

export type LocalDb = ReturnType<typeof createDb>
