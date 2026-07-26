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
})

describe('budget repository', () => {
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
})
