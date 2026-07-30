// Pure recurring-date generation. Persistence and transaction creation stay
// in the repository/service layer; this module only advances UTC instants.

export type RecurringFrequency = 'monthly' | 'weekly'

export interface RecurringRuleInput {
  readonly id: string
  readonly frequency: RecurringFrequency
  /** 1-28 for monthly rules, or ISO weekday 1 (Monday)-7 (Sunday). */
  readonly day: number
  /** The next scheduled occurrence, represented as an ISO-8601 UTC instant. */
  readonly nextRunAt: string
  readonly isActive: boolean
}

export interface RecurringGeneratedOccurrence {
  /** The scheduled instant that is being materialized. */
  readonly occurredAt: string
  /** The schedule after this occurrence has been consumed. */
  readonly nextRunAt: string
}

export interface RecurringGenerationResult {
  readonly ruleId: string
  readonly occurrences: readonly RecurringGeneratedOccurrence[]
  /** The rule's next run after all due occurrences have been consumed. */
  readonly nextRunAt: string
}

export class RecurringValidationError extends RangeError {
  constructor(message: string) {
    super(message)
    this.name = 'RecurringValidationError'
  }
}

const MAX_GENERATED_OCCURRENCES = 100_000

function assertUtcInstant(value: string, label: string): number {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RecurringValidationError(`${label} must be a non-empty ISO-8601 instant.`)
  }

  // A timezone is mandatory. Date.parse otherwise accepts local, timezone-less
  // strings, which would make a recurring rule depend on the device timezone.
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const timestamp = Date.parse(value)
  if (!hasTimezone || !Number.isFinite(timestamp)) {
    throw new RecurringValidationError(`${label} must be a valid ISO-8601 instant with timezone.`)
  }
  return timestamp
}

function isoUtc(timestamp: number, label: string): string {
  if (!Number.isFinite(timestamp)) {
    throw new RecurringValidationError(`${label} is outside the supported date range.`)
  }
  try {
    return new Date(timestamp).toISOString()
  } catch {
    throw new RecurringValidationError(`${label} is outside the supported date range.`)
  }
}

function assertDay(frequency: RecurringFrequency, day: number): void {
  if (!Number.isSafeInteger(day)) {
    throw new RecurringValidationError('Recurring day must be a safe integer.')
  }
  const max = frequency === 'monthly' ? 28 : 7
  if (day < 1 || day > max) {
    throw new RecurringValidationError(
      frequency === 'monthly'
        ? 'Monthly recurring day must be between 1 and 28.'
        : 'Weekly recurring day must be an ISO weekday between 1 and 7.',
    )
  }
}

function assertFrequency(frequency: RecurringFrequency): void {
  if (frequency !== 'monthly' && frequency !== 'weekly') {
    throw new RecurringValidationError('Recurring frequency must be monthly or weekly.')
  }
}

function assertRule(rule: RecurringRuleInput): number {
  if (typeof rule.id !== 'string' || rule.id.trim() === '') {
    throw new RecurringValidationError('Recurring rule ID must not be empty.')
  }
  assertFrequency(rule.frequency)
  assertDay(rule.frequency, rule.day)
  if (typeof rule.isActive !== 'boolean') {
    throw new RecurringValidationError('Recurring rule active state must be boolean.')
  }
  return assertUtcInstant(rule.nextRunAt, 'Recurring nextRunAt')
}

function parseNow(now: string | Date): number {
  if (now instanceof Date) {
    if (!Number.isFinite(now.getTime())) {
      throw new RecurringValidationError('Generation now must be a valid date.')
    }
    return now.getTime()
  }
  return assertUtcInstant(now, 'Generation now')
}

/**
 * Advances a schedule to its next occurrence.
 *
 * Monthly rules always use the configured calendar day in the following month.
 * Weekly rules use ISO weekdays and always move strictly forward (a Monday
 * rule advances to the following Monday when the current date is Monday).
 */
export function advanceRecurringDate(
  currentIso: string,
  frequency: RecurringFrequency,
  day: number,
): string {
  const timestamp = assertUtcInstant(currentIso, 'Recurring current date')
  assertFrequency(frequency)
  assertDay(frequency, day)

  const current = new Date(timestamp)
  if (frequency === 'monthly') {
    const next = new Date(current)
    next.setUTCDate(1)
    next.setUTCMonth(next.getUTCMonth() + 1)
    next.setUTCDate(day)
    return isoUtc(next.getTime(), 'Recurring next date')
  }

  // JavaScript uses Sunday=0; ISO weekdays use Monday=1..Sunday=7.
  const currentIsoWeekday = current.getUTCDay() === 0 ? 7 : current.getUTCDay()
  const daysUntil = (day - currentIsoWeekday + 7) % 7 || 7
  const next = new Date(current)
  next.setUTCDate(next.getUTCDate() + daysUntil)
  return isoUtc(next.getTime(), 'Recurring next date')
}

/**
 * Generates every occurrence due at or before `now` (the boundary is
 * inclusive), returning the next future run to persist on the rule.
 */
export function generateDueOccurrences(
  rule: RecurringRuleInput,
  now: string | Date,
): RecurringGenerationResult {
  const initialTimestamp = assertRule(rule)
  const nowTimestamp = parseNow(now)
  let cursorTimestamp = initialTimestamp
  const occurrences: RecurringGeneratedOccurrence[] = []

  while (cursorTimestamp <= nowTimestamp) {
    if (occurrences.length >= MAX_GENERATED_OCCURRENCES) {
      throw new RecurringValidationError('Recurring generation exceeded the safety limit.')
    }

    const occurredAt = isoUtc(cursorTimestamp, 'Recurring occurrence')
    const nextRunAt = advanceRecurringDate(occurredAt, rule.frequency, rule.day)
    const nextTimestamp = assertUtcInstant(nextRunAt, 'Recurring nextRunAt')
    if (nextTimestamp <= cursorTimestamp) {
      throw new RecurringValidationError('Recurring schedule did not advance.')
    }
    occurrences.push({ occurredAt, nextRunAt })
    cursorTimestamp = nextTimestamp
  }

  return {
    ruleId: rule.id,
    occurrences,
    nextRunAt: isoUtc(cursorTimestamp, 'Recurring nextRunAt'),
  }
}

/**
 * Generates due occurrences for active rules, ordered by their current
 * nextRunAt. Equal dates retain their input order (stable sort).
 */
export function generateDueRules(
  rules: readonly RecurringRuleInput[],
  now: string | Date,
): RecurringGenerationResult[] {
  const active = rules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => rule.isActive)
    .sort((left, right) => {
      const dateDifference =
        assertUtcInstant(left.rule.nextRunAt, 'Recurring nextRunAt') -
        assertUtcInstant(right.rule.nextRunAt, 'Recurring nextRunAt')
      return dateDifference || left.index - right.index
    })

  return active.map(({ rule }) => generateDueOccurrences(rule, now))
}
