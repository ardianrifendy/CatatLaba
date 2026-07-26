import { describe, expect, it } from 'vitest'
import {
  isWalletDeleteBlocked,
  referencedWalletIds,
  type TransactionRefLike,
} from './wallet-guards'

// Terse fixture builder so each test reads as a ledger, not boilerplate.
function tx(
  partial: Partial<TransactionRefLike> & Pick<TransactionRefLike, 'walletId'>,
): TransactionRefLike {
  return { counterWalletId: null, deletedAt: null, ...partial }
}

describe('referencedWalletIds', () => {
  it('returns an empty set for an empty ledger', () => {
    expect(referencedWalletIds([]).size).toBe(0)
  })

  it('collects the source wallet of a transaction', () => {
    const ids = referencedWalletIds([tx({ walletId: 'w-kas' })])
    expect(ids.has('w-kas')).toBe(true)
    expect(ids.size).toBe(1)
  })

  it('collects both sides of a transfer', () => {
    const ids = referencedWalletIds([
      tx({ walletId: 'w-kas', counterWalletId: 'w-bank' }),
    ])
    expect(ids.has('w-kas')).toBe(true)
    expect(ids.has('w-bank')).toBe(true)
    expect(ids.size).toBe(2)
  })

  it('ignores soft-deleted transactions on both sides', () => {
    const ids = referencedWalletIds([
      tx({
        walletId: 'w-kas',
        counterWalletId: 'w-bank',
        deletedAt: '2026-07-26T00:00:00.000Z',
      }),
    ])
    expect(ids.size).toBe(0)
  })
})

describe('isWalletDeleteBlocked', () => {
  it('blocks the source wallet of a live transaction', () => {
    expect(isWalletDeleteBlocked([tx({ walletId: 'w-kas' })], 'w-kas')).toBe(true)
  })

  it('blocks the destination wallet of a live transfer', () => {
    const txs = [tx({ walletId: 'w-kas', counterWalletId: 'w-bank' })]
    expect(isWalletDeleteBlocked(txs, 'w-bank')).toBe(true)
  })

  it('does not block once every referencing transaction is soft-deleted', () => {
    const txs = [tx({ walletId: 'w-kas', deletedAt: '2026-07-26T00:00:00.000Z' })]
    expect(isWalletDeleteBlocked(txs, 'w-kas')).toBe(false)
  })

  it('does not block a wallet no transaction references', () => {
    const txs = [tx({ walletId: 'w-kas', counterWalletId: 'w-bank' })]
    expect(isWalletDeleteBlocked(txs, 'w-gopay')).toBe(false)
  })

  it('does not block any wallet on an empty ledger', () => {
    expect(isWalletDeleteBlocked([], 'w-kas')).toBe(false)
  })
})
