import type { DbContext } from '@/db/local'
import { commonText } from '@/lib/ui-text'
import { normalizeRemoteRow, serializeRow, tableColumns } from './serialization'
import { syncTables, type SyncRow, type SyncTable } from './types'

export interface BackupDocument {
  version: 1
  exportedAt: string
  tables: Partial<Record<SyncTable, SyncRow[]>>
}

export async function exportBackup(ctx: DbContext): Promise<BackupDocument> {
  const tables: Partial<Record<SyncTable, SyncRow[]>> = {}
  for (const table of syncTables) {
    const rows = await ctx.exec.all(`SELECT ${tableColumns(table).join(', ')} FROM ${table};`)
    tables[table] = rows.map((row) => serializeRow(table, row))
  }
  return { version: 1, exportedAt: new Date().toISOString(), tables }
}

export async function importBackup(ctx: DbContext, raw: string): Promise<number> {
  const document = parseBackup(raw)
  let imported = 0
  await ctx.exec.run('BEGIN;')
  try {
    for (const table of syncTables) {
      for (const row of document.tables[table] ?? []) {
        await upsert(ctx, table, row)
        imported += 1
      }
    }
    await ctx.exec.run('COMMIT;')
  } catch (error) {
    await ctx.exec.run('ROLLBACK;')
    throw error
  }
  return imported
}

function parseBackup(raw: string): BackupDocument {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error(commonText.settings.sync.backupInvalid)
  }
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.tables)) {
    throw new Error(commonText.settings.sync.backupInvalid)
  }
  const tables: Partial<Record<SyncTable, SyncRow[]>> = {}
  for (const table of syncTables) {
    const rows = value.tables[table]
    if (rows === undefined) continue
    if (!Array.isArray(rows)) throw new Error(commonText.settings.sync.backupTableInvalid(table))
    const normalized = rows.map((row) => normalizeRemoteRow(table, row))
    if (normalized.some((row) => row === null)) throw new Error(commonText.settings.sync.backupTableInvalid(table))
    tables[table] = normalized.filter((row): row is SyncRow => row !== null)
  }
  return { version: 1, exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : '', tables }
}

async function upsert(ctx: DbContext, table: SyncTable, row: SyncRow): Promise<void> {
  const columns = tableColumns(table)
  const updates = columns.filter((column) => column !== 'id').map((column) => `${column} = excluded.${column}`).join(', ')
  await ctx.exec.run(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ON CONFLICT(id) DO UPDATE SET ${updates};`,
    columns.map((column) => row[column] === true ? 1 : row[column] === false ? 0 : row[column]),
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
