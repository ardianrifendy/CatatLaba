import { describe, expect, it } from 'vitest'
import { summarizeTransactions, type TransactionSummaryLike } from './transaction-summary'

function transaction(
  partial: Partial<TransactionSummaryLike> & Pick<TransactionSummaryLike, 'type' | 'amount'>,
): TransactionSummaryLike {
  return { deletedAt: null, ...partial }
}

describe('summarizeTransactions', () => {
  it('separates income, expense, and transfers while deriving net income', () => {
    const summary = summarizeTransactions([
      transaction({ type: 'income', amount: 150_000 }),
      transaction({ type: 'income', amount: 50_000 }),
      transaction({ type: 'expense', amount: 40_000 }),
      transaction({ type: 'transfer', amount: 100_000 }),
    ])

    expect(summary).toEqual({
      income: 200_000,
      expense: 40_000,
      transfer: 100_000,
      net: 160_000,
      count: 4,
    })
  })

  it('ignores soft-deleted transactions entirely', () => {
    const summary = summarizeTransactions([
      transaction({ type: 'income', amount: 20_000 }),
      transaction({ type: 'expense', amount: 999_999, deletedAt: '2026-07-30T00:00:00.000Z' }),
    ])

    expect(summary).toEqual({ income: 20_000, expense: 0, transfer: 0, net: 20_000, count: 1 })
  })

  it('returns a zero summary for an empty ledger', () => {
    expect(summarizeTransactions([])).toEqual({
      income: 0,
      expense: 0,
      transfer: 0,
      net: 0,
      count: 0,
    })
  })

  it('rejects non-integer monetary values before they can corrupt a report', () => {
    expect(() => summarizeTransactions([transaction({ type: 'income', amount: 1.5 })])).toThrow(
      RangeError,
    )
  })
})
