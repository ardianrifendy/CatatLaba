import type { BindParams, Database } from 'sql.js'
import type { SqliteExecutor } from './executor'

// Wraps a sql.js Database as a SqliteExecutor. Shared by the dev/web backend
// (executor.web.ts) and the in-memory executor used in unit tests (testing.ts)
// so both exercise identical row-shaping: `all`/`get` return positional value
// arrays, which is exactly what Drizzle's sqlite-proxy driver expects.
export function wrapSqlJsDatabase(db: Database): SqliteExecutor {
  return {
    run(sql, params = []) {
      db.run(sql, params as BindParams)
      return Promise.resolve()
    },
    all(sql, params = []) {
      const stmt = db.prepare(sql)
      try {
        stmt.bind(params as BindParams)
        const rows: unknown[][] = []
        while (stmt.step()) rows.push(stmt.get())
        return Promise.resolve(rows)
      } finally {
        stmt.free()
      }
    },
    get(sql, params = []) {
      const stmt = db.prepare(sql)
      try {
        stmt.bind(params as BindParams)
        const row = stmt.step() ? stmt.get() : undefined
        return Promise.resolve(row)
      } finally {
        stmt.free()
      }
    },
  }
}
