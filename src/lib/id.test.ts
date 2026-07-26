import { afterEach, describe, expect, it, vi } from 'vitest'
import { uuidv7 } from './id'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

afterEach(() => {
  vi.restoreAllMocks()
})

describe('uuidv7', () => {
  it('produces a canonically formatted UUID string', () => {
    expect(uuidv7()).toMatch(UUID_RE)
  })

  it('sets the version nibble to 7 and the RFC 4122 variant', () => {
    const id = uuidv7()
    expect(id[14]).toBe('7') // version
    expect(['8', '9', 'a', 'b']).toContain(id[19]) // variant 10xx
  })

  it('encodes the timestamp in the leading bytes (time-ordered)', () => {
    const spy = vi.spyOn(Date, 'now')
    spy.mockReturnValue(1_000_000_000_000)
    const earlier = uuidv7()
    spy.mockReturnValue(2_000_000_000_000)
    const later = uuidv7()
    // Lexicographic order follows chronological order across milliseconds.
    expect(earlier < later).toBe(true)
  })

  it('is collision-free across many rapid calls', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 5000; i++) ids.add(uuidv7())
    expect(ids.size).toBe(5000)
  })
})
