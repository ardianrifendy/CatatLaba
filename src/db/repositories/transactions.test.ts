import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { transactionItems } from '@/db/local/schema'
import { createTestContext, type TestContext } from '@/db/local/testing'
import type { Result } from '@/lib/result'
import { createRepositories, type Repositories } from './index'

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`)
  return result.value
}

const OCCURRED = '2026-07-26T10:00:00.000Z'

let ctx: TestContext
let repos: Repositories

beforeEach(async () => {
  ctx = await createTestContext()
  repos = createRepositories(ctx)
})

describe('transaction repository', () => {
  it('creates an income transaction with no items', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const created = unwrap(
      await repos.transactions.create({
        type: 'income',
        amount: 50_000,
        walletId: wallet.id,
        occurredAt: OCCURRED,
      }),
    )
    expect(created.transaction.type).toBe('income')
    expect(created.transaction.counterWalletId).toBeNull()
    expect(created.items).toHaveLength(0)
  })

  it('creates a sale with line items atomically', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const product = unwrap(await repos.products.create({ name: 'Kaos' }))
    const created = unwrap(
      await repos.transactions.create({
        type: 'income',
        amount: 50_000,
        walletId: wallet.id,
        occurredAt: OCCURRED,
        items: [{ productId: product.id, qty: 2, unitPrice: 25_000, unitCost: 15_000 }],
      }),
    )
    const fetched = unwrap(await repos.transactions.getById(created.transaction.id))
    expect(fetched.items).toHaveLength(1)
    expect(fetched.items[0]?.qty).toBe(2)
    expect(fetched.items[0]?.unitCost).toBe(15_000)
  })

  it('rejects a transfer without a destination wallet', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const result = await repos.transactions.create({
      type: 'transfer',
      amount: 1000,
      walletId: wallet.id,
      occurredAt: OCCURRED,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('VALIDATION')
  })

  it('rejects a non-transfer that carries a counter wallet', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const result = await repos.transactions.create({
      type: 'expense',
      amount: 1000,
      walletId: wallet.id,
      counterWalletId: wallet.id,
      occurredAt: OCCURRED,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('VALIDATION')
  })

  it('filters by type and date range', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    await repos.transactions.create({
      type: 'income',
      amount: 10_000,
      walletId: wallet.id,
      occurredAt: '2026-07-01T00:00:00.000Z',
    })
    await repos.transactions.create({
      type: 'expense',
      amount: 5000,
      walletId: wallet.id,
      occurredAt: '2026-07-20T00:00:00.000Z',
    })

    const income = unwrap(await repos.transactions.list({ type: 'income' }))
    expect(income).toHaveLength(1)

    const july10to31 = unwrap(
      await repos.transactions.list({
        from: '2026-07-10T00:00:00.000Z',
        to: '2026-08-01T00:00:00.000Z',
      }),
    )
    expect(july10to31.map((t) => t.amount)).toEqual([5000])
  })

  it('soft-deletes the header and its items together', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const product = unwrap(await repos.products.create({ name: 'Kaos' }))
    const created = unwrap(
      await repos.transactions.create({
        type: 'income',
        amount: 25_000,
        walletId: wallet.id,
        occurredAt: OCCURRED,
        items: [{ productId: product.id, qty: 1, unitPrice: 25_000 }],
      }),
    )

    unwrap(await repos.transactions.softDelete(created.transaction.id))

    // Header is gone from reads.
    expect((await repos.transactions.getById(created.transaction.id)).ok).toBe(false)
    expect(unwrap(await repos.transactions.list())).toHaveLength(0)

    // Items were soft-deleted too (verified directly against the table).
    const rawItems = await ctx.db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, created.transaction.id))
    expect(rawItems).toHaveLength(1)
    expect(rawItems[0]?.deletedAt).not.toBeNull()
  })
})
