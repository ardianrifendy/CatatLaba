import { beforeEach, describe, expect, it } from 'vitest'
import { createTestContext } from '@/db/local/testing'
import type { Result } from '@/lib/result'
import { createRepositories, type Repositories } from './index'

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`)
  return result.value
}

let repos: Repositories

beforeEach(async () => {
  repos = createRepositories(await createTestContext())
})

describe('channel repository', () => {
  it('round-trips create/list/soft-delete', async () => {
    const channel = unwrap(await repos.channels.create({ name: 'Shopee' }))
    expect(unwrap(await repos.channels.list())).toHaveLength(1)
    unwrap(await repos.channels.softDelete(channel.id))
    expect(unwrap(await repos.channels.list())).toHaveLength(0)
  })
})

describe('category repository', () => {
  it('supports one level of sub-category via parentId', async () => {
    const parent = unwrap(await repos.categories.create({ name: 'Operasional', type: 'expense' }))
    const child = unwrap(
      await repos.categories.create({ name: 'Listrik', type: 'expense', parentId: parent.id }),
    )
    expect(child.parentId).toBe(parent.id)
    expect(unwrap(await repos.categories.list())).toHaveLength(2)
  })
})

describe('product repository', () => {
  it('creates with stock and cost defaulted to zero (domain-owned)', async () => {
    const product = unwrap(
      await repos.products.create({ name: 'Kaos', sku: 'K-1', salePrice: 50_000 }),
    )
    expect(product.stockQty).toBe(0)
    expect(product.costPrice).toBe(0)
    expect(product.salePrice).toBe(50_000)
  })

  it('lists stock movements and sale profit from active transaction items', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const product = unwrap(await repos.products.create({ name: 'Kaos' }))
    unwrap(
      await repos.transactions.create({
        type: 'expense',
        amount: 20_000,
        walletId: wallet.id,
        occurredAt: '2026-07-25T10:00:00.000Z',
        items: [{ productId: product.id, qty: 2, unitPrice: 10_000 }],
      }),
    )
    unwrap(
      await repos.transactions.create({
        type: 'income',
        amount: 30_000,
        walletId: wallet.id,
        occurredAt: '2026-07-26T10:00:00.000Z',
        items: [{ productId: product.id, qty: 2, unitPrice: 15_000 }],
      }),
    )

    const history = unwrap(await repos.products.listHistory(product.id))
    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({ type: 'income', stockDelta: -2, unitCost: 10_000, profit: 10_000 })
    expect(history[1]).toMatchObject({ type: 'expense', stockDelta: 2, unitCost: 0, profit: 0 })
  })
})

describe('budget repository', () => {
  it('accepts only active expense categories and positive YYYY-MM budgets', async () => {
    const income = unwrap(await repos.categories.create({ name: 'Penjualan', type: 'income' }))
    const invalidCategory = await repos.budgets.create({
      categoryId: income.id,
      month: '2026-07',
      amount: 100_000,
    })
    expect(invalidCategory.ok).toBe(false)
    if (!invalidCategory.ok) expect(invalidCategory.error.code).toBe('VALIDATION')

    const expense = unwrap(await repos.categories.create({ name: 'Iklan', type: 'expense' }))
    const invalidMonth = await repos.budgets.create({
      categoryId: expense.id,
      month: '2026-13',
      amount: 100_000,
    })
    expect(invalidMonth.ok).toBe(false)
    if (!invalidMonth.ok) expect(invalidMonth.error.code).toBe('VALIDATION')
  })

  it('rejects a duplicate (category, month) with a CONFLICT', async () => {
    const category = unwrap(await repos.categories.create({ name: 'Iklan', type: 'expense' }))
    unwrap(await repos.budgets.create({ categoryId: category.id, month: '2026-07', amount: 100_000 }))

    const duplicate = await repos.budgets.create({
      categoryId: category.id,
      month: '2026-07',
      amount: 200_000,
    })
    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) expect(duplicate.error.code).toBe('CONFLICT')

    // A different month is allowed.
    const august = await repos.budgets.create({
      categoryId: category.id,
      month: '2026-08',
      amount: 50_000,
    })
    expect(august.ok).toBe(true)
  })

  it('allows re-creating a budget for the same month after soft delete', async () => {
    const category = unwrap(await repos.categories.create({ name: 'Iklan', type: 'expense' }))
    const budget = unwrap(
      await repos.budgets.create({ categoryId: category.id, month: '2026-07', amount: 100_000 }),
    )
    unwrap(await repos.budgets.softDelete(budget.id))
    const again = await repos.budgets.create({
      categoryId: category.id,
      month: '2026-07',
      amount: 120_000,
    })
    expect(again.ok).toBe(true)
  })
})

describe('recurring repository', () => {
  it('round-trips a monthly rule with an active default', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const rule = unwrap(
      await repos.recurring.create({
        name: 'Sewa Toko',
        frequency: 'monthly',
        day: 1,
        nextRunAt: '2026-08-01T00:00:00.000Z',
        templateType: 'expense',
        templateAmount: 500_000,
        templateWalletId: wallet.id,
      }),
    )
    expect(rule.isActive).toBe(true)
    expect(unwrap(await repos.recurring.list())).toHaveLength(1)
  })

  it('materializes due rules once and advances nextRunAt atomically', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const rule = unwrap(
      await repos.recurring.create({
        name: 'Sewa Toko',
        frequency: 'monthly',
        day: 1,
        nextRunAt: '2026-06-01T00:00:00.000Z',
        isActive: true,
        templateType: 'expense',
        templateAmount: 500_000,
        templateWalletId: wallet.id,
        templateCategoryId: null,
        templateChannelId: null,
        templateNote: 'Otomatis',
      }),
    )

    const generated = unwrap(await repos.recurring.generateDue('2026-08-15T00:00:00.000Z'))
    expect(generated).toHaveLength(3)
    expect(generated.every((row) => row.recurringRuleId === rule.id)).toBe(true)

    const advanced = unwrap(await repos.recurring.getById(rule.id))
    expect(advanced.nextRunAt).toBe('2026-09-01T00:00:00.000Z')
    expect(unwrap(await repos.recurring.generateDue('2026-08-15T00:00:00.000Z'))).toHaveLength(0)
    expect(unwrap(await repos.transactions.list({ type: 'expense' }))).toHaveLength(3)
  })
})
