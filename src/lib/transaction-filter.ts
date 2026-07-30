import type { TransactionKind } from '@/domain/transaction-summary'

export interface TransactionFilterLike {
  readonly type: TransactionKind
  readonly walletId: string
  readonly counterWalletId?: string | null
  readonly categoryId?: string | null
  readonly channelId?: string | null
  readonly occurredAt: string
  readonly deletedAt?: string | null
}

export interface TransactionListFilter {
  readonly type?: TransactionKind
  /** A transfer matches either its source or destination wallet. */
  readonly walletId?: string
  readonly categoryId?: string
  readonly channelId?: string
  /** Inclusive UTC ISO-8601 boundary. */
  readonly from?: string
  /** Exclusive UTC ISO-8601 boundary. */
  readonly to?: string
}

export interface TransactionPeriod {
  readonly from: string
  readonly to: string
}

/** Returns whether an active transaction matches every supplied list filter. */
export function transactionMatchesFilter(
  transaction: TransactionFilterLike,
  filter: TransactionListFilter = {},
): boolean {
  if (transaction.deletedAt != null) return false
  if (filter.type && transaction.type !== filter.type) return false
  if (
    filter.walletId &&
    transaction.walletId !== filter.walletId &&
    transaction.counterWalletId !== filter.walletId
  ) {
    return false
  }
  if (filter.categoryId && transaction.categoryId !== filter.categoryId) return false
  if (filter.channelId && transaction.channelId !== filter.channelId) return false
  if (filter.from && transaction.occurredAt < filter.from) return false
  if (filter.to && transaction.occurredAt >= filter.to) return false
  return true
}

/** Filters a ledger without reordering it. Date ranges are [from, to). */
export function filterTransactions<T extends TransactionFilterLike>(
  transactions: readonly T[],
  filter: TransactionListFilter = {},
): T[] {
  return transactions.filter((transaction) => transactionMatchesFilter(transaction, filter))
}

const JAKARTA_OFFSET_HOURS = 7
const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function assertCalendarDate(date: string): { year: number; month: number; day: number } {
  const match = CALENDAR_DATE.exec(date)
  if (!match) throw new RangeError('Date must use YYYY-MM-DD.')

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const candidate = new Date(Date.UTC(year, month - 1, day))
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new RangeError('Date must be a real calendar date.')
  }
  return { year, month, day }
}

function jakartaMidnightIso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day, -JAKARTA_OFFSET_HOURS)).toISOString()
}

/** Creates an inclusive/exclusive UTC period for one calendar day in Jakarta. */
export function jakartaDayPeriod(date: string): TransactionPeriod {
  const { year, month, day } = assertCalendarDate(date)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return {
    from: jakartaMidnightIso(year, month, day),
    to: jakartaMidnightIso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
  }
}

/** Creates an inclusive/exclusive UTC period for one calendar month in Jakarta. */
export function jakartaMonthPeriod(year: number, month: number): TransactionPeriod {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Year and month must identify a real calendar month.')
  }

  const next = new Date(Date.UTC(year, month, 1))
  return {
    from: jakartaMidnightIso(year, month, 1),
    to: jakartaMidnightIso(next.getUTCFullYear(), next.getUTCMonth() + 1, 1),
  }
}

/** Derives the current Jakarta calendar month from an instant, useful for Beranda. */
export function currentJakartaMonthPeriod(now: Date = new Date()): TransactionPeriod {
  if (Number.isNaN(now.getTime())) throw new RangeError('Now must be a valid Date.')
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  return jakartaMonthPeriod(year, month)
}
