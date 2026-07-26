/// <reference types="node" />
import { createRequire } from 'node:module'
import initSqlJs from 'sql.js'
import { createDb, type LocalDb } from './client'
import type { SqliteExecutor } from './executor'
import { runMigrations } from './migrations'
import { wrapSqlJsDatabase } from './sqljs-adapter'

// Test-only. Builds a fresh, isolated in-memory sql.js database wrapped as a
// SqliteExecutor for Vitest (node env). Each call returns a clean database, so
// tests don't leak state into one another. Never imported by app code, so it
// stays out of the shipped bundle.
//
// Unlike the web backend we resolve the wasm via `require.resolve` (an absolute
// filesystem path) rather than a Vite `?url` import: sql.js reads it with `fs`
// under node, which is robust in the test runner.
const require = createRequire(import.meta.url)

export async function createInMemoryExecutor(): Promise<SqliteExecutor> {
  const SQL = await initSqlJs({
    locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
  })
  return wrapSqlJsDatabase(new SQL.Database())
}

// Mirrors the runtime DbContext shape ({ db, exec }) so it can be handed to
// repository factories. Deliberately imports only capacitor-free modules
// (client/migrations/schema), so repository tests never pull @capacitor/core
// into the node test graph.
export interface TestContext {
  db: LocalDb
  exec: SqliteExecutor
}

// Fresh migrated (but unseeded) in-memory database + Drizzle client. Unseeded so
// tests get predictable row counts; seeding is covered by its own test.
export async function createTestContext(): Promise<TestContext> {
  const exec = await createInMemoryExecutor()
  await runMigrations(exec)
  return { db: createDb(exec), exec }
}
