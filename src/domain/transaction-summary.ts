// Pure report derivation for Phase 3. Transfers move cash between wallets, so
// they are tracked separately and never change net income.

export type TransactionKind = 'income' | 'expense' | 'transfer'

export interface TransactionSummaryLike {
  readonly type: TransactionKind
  readonly amount: number
  readonly deletedAt?: string | null
}

export interface TransactionSummary {
  readonly income: number
  readonly expense: number
  readonly transfer: number
  readonly net: number
  readonly count: number
}

function assertValidAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError('Transaction amount must be a non-negative safe integer.')
  }
}

/**
 * Adds non-deleted transactions using integer IDR arithmetic.
 *
 * `transfer` is the gross value transferred, while `net` is always
 * `income - expense`; transfers are deliberately excluded from that result.
 */
export function summarizeTransactions(
  transactions: readonly TransactionSummaryLike[],
): TransactionSummary {
  let income = 0
  let expense = 0
  let transfer = 0
  let count = 0

  for (const transaction of transactions) {
    if (transaction.deletedAt != null) continue
    assertValidAmount(transaction.amount)
    count += 1

    switch (transaction.type) {
      case 'income':
        income += transaction.amount
        break
      case 'expense':
        expense += transaction.amount
        break
      case 'transfer':
        transfer += transaction.amount
        break
    }
  }

  return { income, expense, transfer, net: income - expense, count }
}
