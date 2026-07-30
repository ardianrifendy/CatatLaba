import { describe, expect, it } from 'vitest'
import {
  BudgetProgressValidationError,
  calculateBudgetProgress,
  type BudgetExpenseTransaction,
} from './budget-progress'

const budget = { categoryId: 'food', month: '2026-07', amount: 100_000 }

function transaction(
  partial: Partial<BudgetExpenseTransaction> & Pick<BudgetExpenseTransaction, 'amount'>,
): BudgetExpenseTransaction {
  return {
    type: 'expense',
    categoryId: 'food',
    occurredAt: '2026-07-15T05:00:00.000Z',
    ...partial,
  }
}

describe('calculateBudgetProgress', () => {
  it('sums matching expenses and ignores other types, categories, and months', () => {
    const result = calculateBudgetProgress(budget, [
      transaction({ amount: 25_000 }),
      transaction({ amount: 10_000, type: 'income' }),
      transaction({ amount: 10_000, type: 'transfer' }),
      transaction({ amount: 10_000, categoryId: 'transport' }),
      transaction({ amount: 10_000, occurredAt: '2026-07-31T17:00:00.000Z' }),
    ])

    expect(result).toEqual({
      budget: 100_000,
      spent: 25_000,
      remaining: 75_000,
      ratio: 0.25,
      percent: 25,
      status: 'remaining',
    })
  })

  it('uses Jakarta month boundaries instead of UTC month boundaries', () => {
    const result = calculateBudgetProgress(budget, [
      transaction({ amount: 40_000, occurredAt: '2026-06-30T17:00:00.000Z' }),
      transaction({ amount: 99_000, occurredAt: '2026-06-30T16:59:59.999Z' }),
    ])

    expect(result.spent).toBe(40_000)
  })

  it('caps display progress and reports an over-budget negative remainder', () => {
    const result = calculateBudgetProgress(budget, [transaction({ amount: 125_000 })])

    expect(result).toEqual({
      budget: 100_000,
      spent: 125_000,
      remaining: -25_000,
      ratio: 1,
      percent: 100,
      status: 'over-budget',
    })
  })

  it('handles a zero budget deterministically', () => {
    expect(
      calculateBudgetProgress({ categoryId: 'food', month: '2026-07', amount: 0 }, []),
    ).toEqual({
      budget: 0,
      spent: 0,
      remaining: 0,
      ratio: 0,
      percent: 0,
      status: 'remaining',
    })

    expect(
      calculateBudgetProgress(
        { categoryId: 'food', month: '2026-07', amount: 0 },
        [transaction({ amount: 1 })],
      ),
    ).toMatchObject({
      spent: 1,
      remaining: -1,
      ratio: 1,
      percent: 100,
      status: 'over-budget',
    })
  })

  it('assumes soft-deleted rows were filtered by the repository', () => {
    const activeRowsOnly = [transaction({ amount: 30_000 })]
    expect(calculateBudgetProgress(budget, activeRowsOnly).spent).toBe(30_000)
  })

  it('rejects invalid months and unsafe money values', () => {
    expect(() =>
      calculateBudgetProgress({ ...budget, month: '2026-13' }, []),
    ).toThrow(BudgetProgressValidationError)
    expect(() =>
      calculateBudgetProgress(budget, [transaction({ amount: Number.MAX_SAFE_INTEGER + 1 })]),
    ).toThrow(BudgetProgressValidationError)
  })
})
