import type { DbContext } from '@/db/local'
import { nowIso } from '@/lib/time'
import { normalizeRemoteRow, serializeRow, tableColumns } from './serialization'
import { supabaseRequest } from './supabase'
import { syncTables, type SyncRow, type SyncSession, type SyncTable } from './types'

export interface SyncResult {
  syncedAt: string
  pushed: number
  pulled: number
}

export async function synchronize(ctx: DbContext, session: SyncSession): Promise<SyncResult> {
  let pushed = 0
  let pulled = 0
  for (const table of syncTables) {
    const state = await readState(ctx, table)
    const remote = await pullTable(table, state.lastPulledAt, session)
    pulled += remote.length
    await mergeRemoteRows(ctx, table, remote)
    const local = await readLocalRows(ctx, table)
    await pushTable(table, local, session)
    pushed += local.length
    await writeState(ctx, table, nowIso())
  }
  return { syncedAt: nowIso(), pushed, pulled }
}

async function pullTable(table: SyncTable, since: string | null, session: SyncSession): Promise<SyncRow[]> {
  const params = new URLSearchParams({ select: '*' })
  if (since) params.set('updated_at', `gt.${since}`)
  const response = await supabaseRequest<unknown[]>(`/rest/v1/${table}?${params.toString()}`, session)
  return response.map((row) => normalizeRemoteRow(table, row)).filter((row): row is SyncRow => row !== null)
}

async function pushTable(table: SyncTable, rows: SyncRow[], session: SyncSession): Promise<void> {
  if (rows.length === 0) return
  const payload = rows.map((row) => ({ ...row, user_id: session.userId }))
  await supabaseRequest<unknown>(`/rest/v1/${table}?on_conflict=id`, session, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload),
  })
}

async function readLocalRows(ctx: DbContext, table: SyncTable): Promise<SyncRow[]> {
  const rows = await ctx.exec.all(`SELECT ${tableColumns(table).join(', ')} FROM ${table};`)
  return rows.map((row) => serializeRow(table, row))
}

async function mergeRemoteRows(ctx: DbContext, table: SyncTable, remoteRows: SyncRow[]): Promise<void> {
  for (const remote of remoteRows) {
    const local = await ctx.exec.get(`SELECT updated_at FROM ${table} WHERE id = ?;`, [remote.id])
    const localUpdatedAt = local && typeof local[0] === 'string' ? local[0] : null
    if (localUpdatedAt && localUpdatedAt >= String(remote.updated_at)) continue
    const columns = tableColumns(table)
    const placeholders = columns.map(() => '?').join(', ')
    const updates = columns.filter((column) => column !== 'id').map((column) => `${column} = excluded.${column}`).join(', ')
    await ctx.exec.run(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates};`,
      columns.map((column) => remote[column] === true ? 1 : remote[column] === false ? 0 : remote[column]),
    )
  }
}

async function readState(ctx: DbContext, table: SyncTable): Promise<{ lastPulledAt: string | null }> {
  const row = await ctx.exec.get('SELECT last_pulled_at FROM sync_state WHERE table_name = ?;', [table])
  return { lastPulledAt: row && typeof row[0] === 'string' ? row[0] : null }
}

async function writeState(ctx: DbContext, table: SyncTable, at: string): Promise<void> {
  await ctx.exec.run(
    'INSERT INTO sync_state (table_name, last_pushed_at, last_pulled_at) VALUES (?, ?, ?) ON CONFLICT(table_name) DO UPDATE SET last_pushed_at = excluded.last_pushed_at, last_pulled_at = excluded.last_pulled_at;',
    [table, at, at],
  )
}
