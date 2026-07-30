import { describe, expect, it } from 'vitest'
import { mergeRows, normalizeRemoteRow, serializeRow } from './serialization'

describe('sync serialization', () => {
  it('serializes SQLite flags as booleans', () => {
    expect(serializeRow('wallets', ['w1', 'Tunai', 'cash', 0, 1, 'a', 'b', null])).toEqual({
      id: 'w1', name: 'Tunai', type: 'cash', initial_balance: 0, is_archived: true, created_at: 'a', updated_at: 'b', deleted_at: null,
    })
  })

  it('keeps the newest row during a conflict merge', () => {
    const merged = mergeRows(
      [{ id: 'w1', updated_at: '2026-07-01T00:00:00.000Z', name: 'Lokal' }],
      [{ id: 'w1', updated_at: '2026-07-02T00:00:00.000Z', name: 'Cloud' }, { id: 'w2', updated_at: '2026-07-01T00:00:00.000Z' }],
    )
    expect(merged).toEqual([
      { id: 'w1', updated_at: '2026-07-02T00:00:00.000Z', name: 'Cloud' },
      { id: 'w2', updated_at: '2026-07-01T00:00:00.000Z' },
    ])
  })

  it('rejects incomplete remote payloads', () => {
    expect(normalizeRemoteRow('wallets', { id: 'w1', updated_at: 'now' })).toBeNull()
  })
})
