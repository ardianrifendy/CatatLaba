import initSqlJs, { type Database } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import type { SqliteExecutor } from './executor'
import { wrapSqlJsDatabase } from './sqljs-adapter'

let dbPromise: Promise<Database> | null = null

function openDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = initSqlJs({ locateFile: () => wasmUrl }).then((SQL) => new SQL.Database())
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
