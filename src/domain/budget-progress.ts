// Pure monthly budget derivation. Callers provide active transactions only;
// soft-delete filtering remains a repository responsibility.

export interface BudgetProgressBudget {
  readonly categoryId: string
  /** Jakarta calendar month in YYYY-MM format. */
  readonly month: string
  readonly amount: number
}

export interface BudgetExpenseTransaction {
  readonly type: 'income' | 'expense' | 'transfer'
  readonly amount: number
  readonly categoryId: string | null
  readonly occurredAt: string
}

export type BudgetProgressStatus = 'remaining' | 'over-budget'

export interface BudgetProgress {
  readonly budget: number
  readonly spent: number
  /** Negative when spending exceeds the budget. */
  readonly remaining: number
  /** Capped at 1 so UI progress bars never overflow. */
  readonly ratio: number
  /** Rounded percentage derived from the capped ratio. */
  readonly percent: number
  readonly status: BudgetProgressStatus
}

export class BudgetProgressValidationError extends RangeError {
  constructor(message: string) {
    super(message)
    this.name = 'BudgetProgressValidationError'
  }
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new BudgetProgressValidationError(`${label} must be a non-negative safe integer.`)
  }
}

function jakartaMonth(instant: string): string {
  const timestamp = Date.parse(instant)
  if (!Number.isFinite(timestamp)) {
    throw new BudgetProgressValidationError('Transaction occurredAt must be a valid ISO-8601 instant.')
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(timestamp))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  if (year === undefined || month === undefined) {
    throw new BudgetProgressValidationError('Could not derive the Jakarta calendar month.')
  }
  return `${year}-${month}`
}

/**
 * Calculates progress for one category budget using Jakarta calendar months.
 * The input transaction list must already exclude soft-deleted rows.
 */
export function calculateBudgetProgress(
  budget: BudgetProgressBudget,
  transactions: readonly BudgetExpenseTransaction[],
): BudgetProgress {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(budget.month)) {
    throw new BudgetProgressValidationError('Budget month must use YYYY-MM format.')
  }
  if (budget.categoryId.trim() === '') {
    throw new BudgetProgressValidationError('Budget category ID must not be empty.')
  }
  assertNonNegativeSafeInteger(budget.amount, 'Budget amount')

  let spent = 0
  for (const transaction of transactions) {
    if (
      transaction.type !== 'expense' ||
      transaction.categoryId !== budget.categoryId ||
      jakartaMonth(transaction.occurredAt) !== budget.month
    ) {
      continue
    }
    assertNonNegativeSafeInteger(transaction.amount, 'Transaction amount')
    const next = spent + transaction.amount
    if (!Number.isSafeInteger(next)) {
      throw new BudgetProgressValidationError('Budget spending exceeds safe integer precision.')
    }
    spent = next
  }

  const remaining = budget.amount - spent
  if (!Number.isSafeInteger(remaining)) {
    throw new BudgetProgressValidationError('Budget remainder exceeds safe integer precision.')
  }
  const rawRatio = budget.amount === 0 ? (spent === 0 ? 0 : 1) : spent / budget.amount
  const ratio = Math.min(1, Math.max(0, rawRatio))

  return {
    budget: budget.amount,
    spent,
    remaining,
    ratio,
    percent: Math.round(ratio * 100),
    status: spent > budget.amount ? 'over-budget' : 'remaining',
  }
}

/** UI-friendly alias; both names intentionally share the exact same contract. */
export const computeBudgetProgress = calculateBudgetProgress
