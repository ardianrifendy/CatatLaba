import { describe, expect, it } from 'vitest'
import {
  currentJakartaMonthPeriod,
  filterTransactions,
  jakartaDayPeriod,
  jakartaMonthPeriod,
  transactionMatchesFilter,
  type TransactionFilterLike,
} from './transaction-filter'

const kas = 'wallet-kas'
const bank = 'wallet-bank'

function transaction(partial: Partial<TransactionFilterLike>): TransactionFilterLike {
  return {
    type: 'income',
    walletId: kas,
    counterWalletId: null,
    categoryId: null,
    channelId: null,
    occurredAt: '2026-07-30T08:00:00.000Z',
    deletedAt: null,
    ...partial,
  }
}

describe('transactionMatchesFilter', () => {
  it('matches every supplied field and excludes soft-deleted transactions', () => {
    const active = transaction({ categoryId: 'cat-income', channelId: 'online' })
    expect(
      transactionMatchesFilter(active, {
        type: 'income',
        walletId: kas,
        categoryId: 'cat-income',
        channelId: 'online',
      }),
    ).toBe(true)
    expect(transactionMatchesFilter({ ...active, deletedAt: '2026-07-30T09:00:00.000Z' })).toBe(false)
  })

  it('shows a transfer for either its source or destination wallet', () => {
    const transfer = transaction({ type: 'transfer', walletId: kas, counterWalletId: bank })
    expect(transactionMatchesFilter(transfer, { walletId: kas })).toBe(true)
    expect(transactionMatchesFilter(transfer, { walletId: bank })).toBe(true)
  })

  it('uses an inclusive from and exclusive to date range', () => {
    const atStart = transaction({ occurredAt: '2026-07-30T00:00:00.000Z' })
    const atEnd = transaction({ occurredAt: '2026-08-01T00:00:00.000Z' })
    const filter = { from: '2026-07-30T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z' }
    expect(transactionMatchesFilter(atStart, filter)).toBe(true)
    expect(transactionMatchesFilter(atEnd, filter)).toBe(false)
  })

  it('filters without changing ledger order', () => {
    const transactions = [
      transaction({ walletId: kas }),
      transaction({ walletId: bank }),
      transaction({ walletId: kas, occurredAt: '2026-07-31T08:00:00.000Z' }),
    ]
    expect(filterTransactions(transactions, { walletId: kas })).toEqual([transactions[0], transactions[2]])
  })
})

describe('Jakarta transaction periods', () => {
  it('uses midnight Asia/Jakarta boundaries for a single day', () => {
    expect(jakartaDayPeriod('2026-07-30')).toEqual({
      from: '2026-07-29T17:00:00.000Z',
      to: '2026-07-30T17:00:00.000Z',
    })
  })

  it('handles a month boundary and leap-year dates', () => {
    expect(jakartaMonthPeriod(2026, 7)).toEqual({
      from: '2026-06-30T17:00:00.000Z',
      to: '2026-07-31T17:00:00.000Z',
    })
    expect(jakartaDayPeriod('2024-02-29').to).toBe('2024-02-29T17:00:00.000Z')
    expect(() => jakartaDayPeriod('2026-02-29')).toThrow(RangeError)
  })

  it('derives the correct Jakarta month around a UTC month boundary', () => {
    expect(currentJakartaMonthPeriod(new Date('2026-07-31T18:00:00.000Z'))).toEqual({
      from: '2026-07-31T17:00:00.000Z',
      to: '2026-08-31T17:00:00.000Z',
    })
  })
})
