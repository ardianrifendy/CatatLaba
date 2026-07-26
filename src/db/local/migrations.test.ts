import { describe, expect, it } from 'vitest'
import { type Migration, pendingMigrations } from './migrations'

const sample: Migration[] = [
  { id: '0000_init', statements: [] },
  { id: '0001_wallets', statements: [] },
  { id: '0002_tx', statements: [] },
]

describe('pendingMigrations', () => {
  it('returns all migrations in declared order when none are applied', () => {
    const result = pendingMigrations(sample, new Set())
    expect(result.map((m) => m.id)).toEqual(['0000_init', '0001_wallets', '0002_tx'])
  })

  it('skips already-applied migrations', () => {
    const result = pendingMigrations(sample, new Set(['0000_init', '0001_wallets']))
    expect(result.map((m) => m.id)).toEqual(['0002_tx'])
  })

  it('returns nothing when everything is applied', () => {
    const result = pendingMigrations(sample, new Set(['0000_init', '0001_wallets', '0002_tx']))
    expect(result).toEqual([])
  })

  it('preserves declared order regardless of applied-set contents', () => {
    const result = pendingMigrations(sample, new Set(['0001_wallets']))
    expect(result.map((m) => m.id)).toEqual(['0000_init', '0002_tx'])
  })
})
