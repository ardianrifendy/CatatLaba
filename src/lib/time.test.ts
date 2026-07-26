import { describe, expect, it } from 'vitest'
import { nowIso } from './time'

describe('nowIso', () => {
  it('returns a UTC ISO-8601 string (Z suffix)', () => {
    const value = nowIso()
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    // Round-trips through Date without shifting.
    expect(new Date(value).toISOString()).toBe(value)
  })
})
