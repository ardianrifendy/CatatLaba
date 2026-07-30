import { describe, expect, it } from 'vitest'
import {
  buildReport,
  ReportingValidationError,
  type ReportTransaction,
} from './reporting'

const labels = {
  channels: { marketplace: 'Marketplace' },
  categories: { supplies: 'Perlengkapan' },
  products: { phone: 'Telepon' },
}

function transaction(
  partial: Partial<ReportTransaction> & Pick<ReportTransaction, 'id' | 'type' | 'amount'>,
): ReportTransaction {
  return {
    channelId: null,
    categoryId: null,
    occurredAt: '2026-07-15T05:00:00.000Z',
    items: [],
    ...partial,
  }
}

function report(
  transactions: readonly ReportTransaction[],
  granularity: 'day' | 'month' = 'day',
) {
  return buildReport({
    transactions,
    labels,
    period: {
      from: '2026-06-30T17:00:00.000Z',
      to: '2026-07-31T17:00:00.000Z',
      granularity,
    },
  })
}

describe('buildReport', () => {
  it('derives revenue, expense, frozen item profit, breakdowns, and top products', () => {
    const result = report([
      transaction({
        id: 'sale',
        type: 'income',
        amount: 100_000,
        channelId: 'marketplace',
        items: [{ productId: 'phone', qty: 2, unitPrice: 50_000, unitCost: 30_000 }],
      }),
      transaction({
        id: 'purchase',
        type: 'expense',
        amount: 25_000,
        categoryId: 'supplies',
      }),
    ])

    expect(result.summary).toEqual({ revenue: 100_000, expense: 25_000, profit: 40_000 })
    expect(result.profitByChannel).toEqual([
      { channelId: 'marketplace', label: 'Marketplace', profit: 40_000 },
    ])
    expect(result.expenseByCategory).toEqual([
      { categoryId: 'supplies', label: 'Perlengkapan', expense: 25_000 },
    ])
    expect(result.topProducts).toEqual([
      { productId: 'phone', label: 'Telepon', qty: 2, revenue: 100_000, profit: 40_000 },
    ])
    expect(result.profitTrend).toEqual([{ key: '2026-07-15', profit: 40_000 }])
  })

  it('ignores transfers and gives itemless income zero profit', () => {
    const result = report([
      transaction({
        id: 'transfer',
        type: 'transfer',
        amount: 500_000,
        channelId: 'marketplace',
        categoryId: 'supplies',
        items: [{ productId: 'phone', qty: 1, unitPrice: 500_000, unitCost: 0 }],
      }),
      transaction({
        id: 'service',
        type: 'income',
        amount: 80_000,
        channelId: 'marketplace',
      }),
    ])

    expect(result.summary).toEqual({ revenue: 80_000, expense: 0, profit: 0 })
    expect(result.profitByChannel).toEqual([
      { channelId: 'marketplace', label: 'Marketplace', profit: 0 },
    ])
    expect(result.expenseByCategory).toEqual([])
    expect(result.topProducts).toEqual([])
  })

  it('uses an inclusive start and exclusive end at Jakarta month boundaries', () => {
    const result = report([
      transaction({
        id: 'before',
        type: 'income',
        amount: 1,
        occurredAt: '2026-06-30T16:59:59.999Z',
      }),
      transaction({
        id: 'start',
        type: 'income',
        amount: 2,
        occurredAt: '2026-06-30T17:00:00.000Z',
      }),
      transaction({
        id: 'end',
        type: 'income',
        amount: 4,
        occurredAt: '2026-07-31T17:00:00.000Z',
      }),
    ])

    expect(result.summary.revenue).toBe(2)
    expect(result.profitTrend).toEqual([{ key: '2026-07-01', profit: 0 }])
  })

  it('groups trend by Jakarta month and preserves zero-profit expense periods', () => {
    const result = report(
      [
        transaction({
          id: 'june-utc-july-jakarta',
          type: 'income',
          amount: 10_000,
          occurredAt: '2026-06-30T18:00:00.000Z',
          items: [{ productId: 'phone', qty: 1, unitPrice: 10_000, unitCost: 4_000 }],
        }),
        transaction({
          id: 'expense',
          type: 'expense',
          amount: 2_000,
          occurredAt: '2026-07-15T00:00:00.000Z',
        }),
      ],
      'month',
    )

    expect(result.profitTrend).toEqual([{ key: '2026-07', profit: 6_000 }])
  })

  it('uses the unknown label for null or missing lookup values', () => {
    const result = report([
      transaction({
        id: 'unknown',
        type: 'income',
        amount: 15_000,
        channelId: 'removed-channel',
        items: [{ productId: 'removed-product', qty: 1, unitPrice: 15_000, unitCost: 5_000 }],
      }),
      transaction({
        id: 'uncategorized',
        type: 'expense',
        amount: 2_000,
        categoryId: null,
      }),
    ])

    expect(result.profitByChannel[0]?.label).toBe('Tidak diketahui')
    expect(result.expenseByCategory[0]?.label).toBe('Tidak diketahui')
    expect(result.topProducts[0]?.label).toBe('Tidak diketahui')
  })

  it('rejects unsafe monetary arithmetic', () => {
    expect(() =>
      report([
        transaction({
          id: 'unsafe',
          type: 'income',
          amount: 1,
          items: [
            {
              productId: 'phone',
              qty: Number.MAX_SAFE_INTEGER,
              unitPrice: 2,
              unitCost: 0,
            },
          ],
        }),
      ]),
    ).toThrow(ReportingValidationError)
  })
})
