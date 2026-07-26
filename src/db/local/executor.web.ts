import initSqlJs, { type Database } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { SqliteExecutor } from './executor'
import { wrapSqlJsDatabase } from './sqljs-adapter'

let dbPromise: Promise<Database> | null = null

function openDatabase(): Promise<Database> {
  if (!dbPromise) {
    const attempt = initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => new SQL.Database())
    // Clear the cache on failure so the next call re-attempts instead of
    // replaying the same cached rejection forever. Caveat: sql.js itself also
    // caches its own module-level init promise, including rejections, so an
    // in-place retry cannot recover a failed wasm fetch — a full page reload
    // (AppInit's "Muat ulang aplikasi" button) is the guaranteed web recovery.
    attempt.catch(() => {
      if (dbPromise === attempt) dbPromise = null
    })
    dbPromise = attempt
  }
  return dbPromise
}

// In-memory sql.js (wasm) database for dev/browser only — never shipped to the
// device. Data does not persist across reloads, which is enough to exercise the
// schema and migration runner during development.
export async function createWebExecutor(): Promise<SqliteExecutor> {
  const db = await openDatabase()
  return wrapSqlJsDatabase(db)
}
