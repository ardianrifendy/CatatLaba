import { describe, it, expect } from 'vitest'
import { formatIDR } from '@/lib/format'

describe('formatIDR', () => {
  it('groups thousands with dots and prefixes Rp ', () => {
    expect(formatIDR(1234567)).toBe('Rp 1.234.567')
    expect(formatIDR(1000)).toBe('Rp 1.000')
    expect(formatIDR(999)).toBe('Rp 999')
  })

  it('handles zero', () => {
    expect(formatIDR(0)).toBe('Rp 0')
  })

  it('handles negatives', () => {
    expect(formatIDR(-5000)).toBe('-Rp 5.000')
  })

  it('truncates fractional input (money is integer IDR)', () => {
    expect(formatIDR(1234.99)).toBe('Rp 1.234')
  })
})

