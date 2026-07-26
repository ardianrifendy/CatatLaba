import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, type LocalDb } from './client'
import { migrations, runMigrations } from './migrations'
import {
  budgets,
  categories,
  channels,
  products,
  syncState,
  transactionItems,
  transactions,
  wallets,
} from './schema'
import { createInMemoryExecutor } from './testing'

const t = '2026-07-26T00:00:00.000Z'
const stamp = { createdAt: t, updatedAt: t }

let db: LocalDb

beforeEach(async () => {
  const exec = await createInMemoryExecutor()
  const applied = await runMigrations(exec)
  // 0000_init + 0001_domain_schema on a fresh database.
  expect(applied).toBe(migrations.length)
  db = createDb(exec)
})

describe('migration 0001 — domain schema round-trips through Drizzle', () => {
  it('maps enum/boolean/money columns on wallets', async () => {
    await db.insert(wallets).values({
      id: 'w1',
      name: 'Kas',
      type: 'cash',
      initialBalance: 150_000,
      isArchived: false,
      ...stamp,
    })
    const rows = await db.select().from(wallets)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.type).toBe('cash')
    expect(rows[0]?.initialBalance).toBe(150_000)
    // integer 0 must surface as a real boolean (drizzle mode: 'boolean').
    expect(rows[0]?.isArchived).toBe(false)
    expect(rows[0]?.deletedAt).toBeNull()
  })

  it('stores a transaction with its items', async () => {
    await db.insert(wallets).values({ id: 'w1', name: 'Kas', type: 'cash', ...stamp })
    await db.insert(channels).values({ id: 'ch1', name: 'Shopee', ...stamp })
    await db.insert(products).values({ id: 'p1', name: 'Kaos', ...stamp })
    await db.insert(transactions).values({
      id: 'tx1',
      type: 'income',
      amount: 50_000,
      walletId: 'w1',
      channelId: 'ch1',
      occurredAt: t,
      ...stamp,
    })
    await db.insert(transactionItems).values({
      id: 'ti1',
      transactionId: 'tx1',
      productId: 'p1',
      qty: 2,
      unitPrice: 25_000,
      unitCost: 15_000,
      ...stamp,
    })

    const tx = await db.select().from(transactions)
    const items = await db.select().from(transactionItems)
    expect(tx[0]?.type).toBe('income')
    expect(tx[0]?.counterWalletId).toBeNull()
    expect(items[0]?.qty).toBe(2)
    expect(items[0]?.transactionId).toBe('tx1')
  })

  it('enforces one budget per (category, month) among non-deleted rows', async () => {
    await db.insert(categories).values({ id: 'c1', name: 'Iklan', type: 'expense', ...stamp })
    await db.insert(budgets).values({ id: 'b1', categoryId: 'c1', month: '2026-07', amount: 100, ...stamp })
    // Different month is fine.
    await db.insert(budgets).values({ id: 'b2', categoryId: 'c1', month: '2026-08', amount: 100, ...stamp })
    // Same (category, month) is rejected by the partial unique index.
    await expect(
      db.insert(budgets).values({ id: 'b3', categoryId: 'c1', month: '2026-07', amount: 200, ...stamp }),
    ).rejects.toThrow()
  })

  it('allows many null skus but rejects duplicate non-null skus', async () => {
    await db.insert(products).values({ id: 'p1', name: 'A', sku: null, ...stamp })
    await db.insert(products).values({ id: 'p2', name: 'B', sku: null, ...stamp })
    await db.insert(products).values({ id: 'p3', name: 'C', sku: 'SKU-1', ...stamp })
    await expect(
      db.insert(products).values({ id: 'p4', name: 'D', sku: 'SKU-1', ...stamp }),
    ).rejects.toThrow()
  })

  it('has a local-only sync_state table without convention columns', async () => {
    await db.insert(syncState).values({
      tableName: 'wallets',
      lastPushedAt: t,
      lastPulledAt: null,
    })
    const rows = await db.select().from(syncState)
    expect(rows[0]?.tableName).toBe('wallets')
    expect(rows[0]?.lastPulledAt).toBeNull()
  })
})
