import type { SyncRow, SyncTable } from './types'

const columns: Record<SyncTable, readonly string[]> = {
  wallets: ['id', 'name', 'type', 'initial_balance', 'is_archived', 'created_at', 'updated_at', 'deleted_at'],
  categories: ['id', 'name', 'type', 'parent_id', 'icon', 'created_at', 'updated_at', 'deleted_at'],
  channels: ['id', 'name', 'is_archived', 'created_at', 'updated_at', 'deleted_at'],
  products: ['id', 'name', 'sku', 'unit', 'cost_price', 'sale_price', 'stock_qty', 'is_archived', 'created_at', 'updated_at', 'deleted_at'],
  recurring_rules: ['id', 'name', 'frequency', 'day', 'next_run_at', 'is_active', 'template_type', 'template_amount', 'template_wallet_id', 'template_category_id', 'template_channel_id', 'template_note', 'created_at', 'updated_at', 'deleted_at'],
  transactions: ['id', 'type', 'amount', 'wallet_id', 'counter_wallet_id', 'category_id', 'channel_id', 'note', 'occurred_at', 'recurring_rule_id', 'created_at', 'updated_at', 'deleted_at'],
  transaction_items: ['id', 'transaction_id', 'product_id', 'qty', 'unit_price', 'unit_cost', 'created_at', 'updated_at', 'deleted_at'],
  budgets: ['id', 'category_id', 'month', 'amount', 'created_at', 'updated_at', 'deleted_at'],
}

const booleanColumns = new Set(['is_archived', 'is_active'])

export function tableColumns(table: SyncTable): readonly string[] {
  return columns[table]
}

export function serializeRow(table: SyncTable, values: readonly unknown[]): SyncRow {
  const row: SyncRow = {}
  tableColumns(table).forEach((column, index) => {
    const value = values[index]
    row[column] = booleanColumns.has(column) ? value === 1 || value === true : normalizeValue(value)
  })
  return row
}

export function normalizeRemoteRow(table: SyncTable, input: unknown): SyncRow | null {
  if (!isRecord(input)) return null
  const row: SyncRow = {}
  for (const column of tableColumns(table)) {
    const value = input[column]
    if (value === undefined) return null
    row[column] = booleanColumns.has(column) ? value === true || value === 1 : normalizeValue(value)
  }
  return typeof row.id === 'string' && typeof row.updated_at === 'string' ? row : null
}

export function mergeRows(local: readonly SyncRow[], remote: readonly SyncRow[]): SyncRow[] {
  const byId = new Map(local.map((row) => [String(row.id), row]))
  for (const remoteRow of remote) {
    const id = String(remoteRow.id)
    const localRow = byId.get(id)
    if (!localRow || String(remoteRow.updated_at) > String(localRow.updated_at)) {
      byId.set(id, remoteRow)
    }
  }
  return [...byId.values()]
}

function normalizeValue(value: unknown): string | number | boolean | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
