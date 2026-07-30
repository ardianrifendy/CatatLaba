import { describe, expect, it } from 'vitest'
import {
  RecurringValidationError,
  advanceRecurringDate,
  generateDueOccurrences,
  generateDueRules,
  type RecurringRuleInput,
} from './recurring'

function rule(partial: Partial<RecurringRuleInput> = {}): RecurringRuleInput {
  return {
    id: 'rule-1',
    frequency: 'monthly',
    day: 1,
    nextRunAt: '2026-01-01T00:00:00.000Z',
    isActive: true,
    ...partial,
  }
}

describe('advanceRecurringDate', () => {
  it('advances monthly rules on the configured day, including year boundaries', () => {
    expect(advanceRecurringDate('2026-01-01T09:30:00.000Z', 'monthly', 28)).toBe(
      '2026-02-28T09:30:00.000Z',
    )
    expect(advanceRecurringDate('2026-12-28T09:30:00.000Z', 'monthly', 1)).toBe(
      '2027-01-01T09:30:00.000Z',
    )
  })

  it('advances weekly rules using ISO weekday semantics', () => {
    expect(advanceRecurringDate('2026-07-06T00:00:00.000Z', 'weekly', 1)).toBe(
      '2026-07-13T00:00:00.000Z',
    )
    expect(advanceRecurringDate('2026-07-06T00:00:00.000Z', 'weekly', 7)).toBe(
      '2026-07-12T00:00:00.000Z',
    )
  })
})

describe('generateDueOccurrences', () => {
  it('returns no occurrence when the next run is in the future', () => {
    const result = generateDueOccurrences(
      rule({ nextRunAt: '2026-08-01T00:00:00.000Z' }),
      '2026-07-30T00:00:00.000Z',
    )
    expect(result.occurrences).toEqual([])
    expect(result.nextRunAt).toBe('2026-08-01T00:00:00.000Z')
  })

  it('includes an occurrence exactly on the now boundary', () => {
    const result = generateDueOccurrences(
      rule({ nextRunAt: '2026-07-01T00:00:00.000Z' }),
      '2026-07-01T00:00:00.000Z',
    )
    expect(result.occurrences).toHaveLength(1)
    expect(result.occurrences[0]).toEqual({
      occurredAt: '2026-07-01T00:00:00.000Z',
      nextRunAt: '2026-08-01T00:00:00.000Z',
    })
  })

  it('generates every due monthly run and leaves the first future run', () => {
    const result = generateDueOccurrences(
      rule({ nextRunAt: '2026-01-28T12:00:00.000Z', day: 28 }),
      '2026-04-28T12:00:00.000Z',
    )
    expect(result.occurrences.map((entry) => entry.occurredAt)).toEqual([
      '2026-01-28T12:00:00.000Z',
      '2026-02-28T12:00:00.000Z',
      '2026-03-28T12:00:00.000Z',
      '2026-04-28T12:00:00.000Z',
    ])
    expect(result.nextRunAt).toBe('2026-05-28T12:00:00.000Z')
  })

  it('generates weekly runs across a month boundary', () => {
    const result = generateDueOccurrences(
      rule({
        frequency: 'weekly',
        day: 1,
        nextRunAt: '2026-06-29T06:00:00.000Z',
      }),
      '2026-07-13T06:00:00.000Z',
    )
    expect(result.occurrences).toHaveLength(3)
    expect(result.nextRunAt).toBe('2026-07-20T06:00:00.000Z')
  })
})

describe('generateDueRules', () => {
  it('ignores inactive rules and stable-sorts active rules by nextRunAt', () => {
    const result = generateDueRules(
      [
        rule({ id: 'later', nextRunAt: '2026-07-02T00:00:00.000Z' }),
        rule({ id: 'inactive', nextRunAt: '2026-07-01T00:00:00.000Z', isActive: false }),
        rule({ id: 'first', nextRunAt: '2026-07-01T00:00:00.000Z' }),
      ],
      '2026-07-01T00:00:00.000Z',
    )
    expect(result.map((entry) => entry.ruleId)).toEqual(['first', 'later'])
  })
})

describe('recurring validation', () => {
  it('rejects invalid days and frequencies', () => {
    expect(() => advanceRecurringDate(rule().nextRunAt, 'monthly', 29)).toThrow(
      RecurringValidationError,
    )
    expect(() => advanceRecurringDate(rule().nextRunAt, 'weekly', 8)).toThrow(
      RecurringValidationError,
    )
    expect(() =>
      advanceRecurringDate(rule().nextRunAt, 'yearly' as 'monthly', 1),
    ).toThrow(RecurringValidationError)
  })

  it('rejects timezone-less and invalid ISO dates', () => {
    expect(() => generateDueOccurrences(rule({ nextRunAt: '2026-07-01' }), '2026-07-02T00:00:00Z')).toThrow(
      RecurringValidationError,
    )
    expect(() =>
      generateDueOccurrences(rule(), 'not-a-date'),
    ).toThrow(RecurringValidationError)
  })

  it('cannot loop forever when the schedule fails to move forward', () => {
    expect(() =>
      generateDueOccurrences(
        rule({ frequency: 'weekly', day: 1, nextRunAt: '2026-07-06T00:00:00.000Z' }),
        '2026-07-06T00:00:00.000Z',
      ),
    ).not.toThrow()
  })
})
