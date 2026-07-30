// Pure reporting derivation. Repositories are expected to supply only active
// rows; this module deliberately has no persistence or soft-delete concerns.

export type ReportTransactionKind = 'income' | 'expense' | 'transfer'
export type ReportTrendGranularity = 'day' | 'month'

export interface ReportTransactionItem {
  readonly productId: string
  readonly qty: number
  readonly unitPrice: number
  /** Frozen cost at sale time. Purchases normally persist zero here. */
  readonly unitCost: number
}

export interface ReportTransaction {
  readonly id: string
  readonly type: ReportTransactionKind
  readonly amount: number
  readonly channelId: string | null
  readonly categoryId: string | null
  readonly occurredAt: string
  readonly items: readonly ReportTransactionItem[]
}

export interface ReportPeriod {
  /** Inclusive ISO-8601 instant. */
  readonly from: string
  /** Exclusive ISO-8601 instant. */
  readonly to: string
  readonly granularity: ReportTrendGranularity
}

export interface ReportLabelLookups {
  readonly channels: Readonly<Record<string, string>>
  readonly categories: Readonly<Record<string, string>>
  readonly products: Readonly<Record<string, string>>
  /** Used for null foreign keys and IDs absent from a lookup. */
  readonly unknown?: string
}

export interface ReportSummary {
  readonly revenue: number
  readonly expense: number
  readonly profit: number
}

export interface ChannelProfit {
  readonly channelId: string | null
  readonly label: string
  readonly profit: number
}

export interface CategoryExpense {
  readonly categoryId: string | null
  readonly label: string
  readonly expense: number
}

export interface ProfitTrendPoint {
  /** Jakarta calendar key: YYYY-MM-DD for day, YYYY-MM for month. */
  readonly key: string
  readonly profit: number
}

export interface ProductPerformance {
  readonly productId: string
  readonly label: string
  readonly qty: number
  readonly revenue: number
  readonly profit: number
}

export interface Report {
  readonly summary: ReportSummary
  readonly profitByChannel: readonly ChannelProfit[]
  readonly expenseByCategory: readonly CategoryExpense[]
  readonly profitTrend: readonly ProfitTrendPoint[]
  readonly topProducts: readonly ProductPerformance[]
}

export interface BuildReportInput {
  readonly transactions: readonly ReportTransaction[]
  readonly labels: ReportLabelLookups
  readonly period: ReportPeriod
}

export class ReportingValidationError extends RangeError {
  constructor(message: string) {
    super(message)
    this.name = 'ReportingValidationError'
  }
}

interface MutableProductPerformance {
  productId: string
  label: string
  qty: number
  revenue: number
  profit: number
}

const NULL_GROUP_KEY = '\u0000'
const DEFAULT_UNKNOWN_LABEL = 'Tidak diketahui'

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new ReportingValidationError(`${label} must be a safe integer.`)
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  assertSafeInteger(value, label)
  if (value < 0) {
    throw new ReportingValidationError(`${label} must be non-negative.`)
  }
}

function safeAdd(left: number, right: number, label: string): number {
  const result = left + right
  assertSafeInteger(result, label)
  return result
}

function safeMultiply(left: number, right: number, label: string): number {
  const result = left * right
  assertSafeInteger(result, label)
  return result
}

function parseInstant(value: string, label: string): number {
  const instant = Date.parse(value)
  if (!Number.isFinite(instant)) {
    throw new ReportingValidationError(`${label} must be a valid ISO-8601 instant.`)
  }
  return instant
}

function jakartaCalendarParts(instant: string): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (year === undefined || month === undefined || day === undefined) {
    throw new ReportingValidationError('Could not derive the Jakarta calendar date.')
  }
  return { year, month, day }
}

function trendKey(instant: string, granularity: ReportTrendGranularity): string {
  const { year, month, day } = jakartaCalendarParts(instant)
  return granularity === 'day' ? `${year}-${month}-${day}` : `${year}-${month}`
}

function labelFor(
  id: string | null,
  lookup: Readonly<Record<string, string>>,
  unknown: string,
): string {
  if (id === null) return unknown
  const label = lookup[id]
  return label === undefined || label.trim() === '' ? unknown : label
}

function validateItem(item: ReportTransactionItem): void {
  if (item.productId.trim() === '') {
    throw new ReportingValidationError('Product ID must not be empty.')
  }
  assertNonNegativeInteger(item.unitPrice, 'Item unit price')
  assertNonNegativeInteger(item.unitCost, 'Item unit cost')
  assertSafeInteger(item.qty, 'Item quantity')
  if (item.qty <= 0) {
    throw new ReportingValidationError('Item quantity must be greater than zero.')
  }
}

/**
 * Builds the Phase 5 report from active transaction rows.
 *
 * Revenue and expense use transaction header amounts. Profit intentionally
 * uses only income item snapshots: `(unitPrice - unitCost) * qty`. Therefore an
 * itemless income contributes revenue but exactly zero profit.
 */
export function buildReport(input: BuildReportInput): Report {
  const from = parseInstant(input.period.from, 'Report period start')
  const to = parseInstant(input.period.to, 'Report period end')
  if (from >= to) {
    throw new ReportingValidationError('Report period end must be after its start.')
  }

  const unknown = input.labels.unknown?.trim() || DEFAULT_UNKNOWN_LABEL
  let revenue = 0
  let expense = 0
  let profit = 0
  const channelProfit = new Map<string, number>()
  const categoryExpense = new Map<string, number>()
  const trend = new Map<string, number>()
  const products = new Map<string, MutableProductPerformance>()

  for (const transaction of input.transactions) {
    const occurredAt = parseInstant(transaction.occurredAt, 'Transaction occurredAt')
    if (occurredAt < from || occurredAt >= to) continue
    assertNonNegativeInteger(transaction.amount, 'Transaction amount')
    if (transaction.type === 'transfer') continue

    const key = trendKey(transaction.occurredAt, input.period.granularity)
    if (!trend.has(key)) trend.set(key, 0)

    if (transaction.type === 'expense') {
      expense = safeAdd(expense, transaction.amount, 'Report expense')
      const categoryKey = transaction.categoryId ?? NULL_GROUP_KEY
      categoryExpense.set(
        categoryKey,
        safeAdd(categoryExpense.get(categoryKey) ?? 0, transaction.amount, 'Category expense'),
      )
      continue
    }

    revenue = safeAdd(revenue, transaction.amount, 'Report revenue')
    let transactionProfit = 0
    for (const item of transaction.items) {
      validateItem(item)
      const itemRevenue = safeMultiply(item.unitPrice, item.qty, 'Item revenue')
      const itemCost = safeMultiply(item.unitCost, item.qty, 'Item cost')
      const itemProfit = safeAdd(itemRevenue, -itemCost, 'Item profit')
      transactionProfit = safeAdd(transactionProfit, itemProfit, 'Transaction profit')

      const current = products.get(item.productId) ?? {
        productId: item.productId,
        label: labelFor(item.productId, input.labels.products, unknown),
        qty: 0,
        revenue: 0,
        profit: 0,
      }
      current.qty = safeAdd(current.qty, item.qty, 'Product quantity')
      current.revenue = safeAdd(current.revenue, itemRevenue, 'Product revenue')
      current.profit = safeAdd(current.profit, itemProfit, 'Product profit')
      products.set(item.productId, current)
    }

    profit = safeAdd(profit, transactionProfit, 'Report profit')
    const channelKey = transaction.channelId ?? NULL_GROUP_KEY
    channelProfit.set(
      channelKey,
      safeAdd(channelProfit.get(channelKey) ?? 0, transactionProfit, 'Channel profit'),
    )
    trend.set(key, safeAdd(trend.get(key) ?? 0, transactionProfit, 'Trend profit'))
  }

  return {
    summary: { revenue, expense, profit },
    profitByChannel: [...channelProfit.entries()]
      .map(([key, value]) => {
        const channelId = key === NULL_GROUP_KEY ? null : key
        return {
          channelId,
          label: labelFor(channelId, input.labels.channels, unknown),
          profit: value,
        }
      })
      .sort((left, right) => right.profit - left.profit || left.label.localeCompare(right.label)),
    expenseByCategory: [...categoryExpense.entries()]
      .map(([key, value]) => {
        const categoryId = key === NULL_GROUP_KEY ? null : key
        return {
          categoryId,
          label: labelFor(categoryId, input.labels.categories, unknown),
          expense: value,
        }
      })
      .sort((left, right) => right.expense - left.expense || left.label.localeCompare(right.label)),
    profitTrend: [...trend.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({ key, profit: value })),
    topProducts: [...products.values()]
      .sort(
        (left, right) =>
          right.profit - left.profit ||
          right.revenue - left.revenue ||
          left.label.localeCompare(right.label),
      ),
  }
}
