import { describe, expect, it } from 'vitest'
import {
  totalBalance,
  type TransactionLike,
  walletBalance,
  walletBalances,
  type WalletLike,
} from './wallet-balance'

const kas: WalletLike = { id: 'w-kas', initialBalance: 100_000 }
const bank: WalletLike = { id: 'w-bank', initialBalance: 0 }

// Terse fixture builder so each test reads as a ledger, not boilerplate.
function tx(partial: Partial<TransactionLike> & Pick<TransactionLike, 'type' | 'amount'>): TransactionLike {
  return { walletId: kas.id, counterWalletId: null, deletedAt: null, ...partial }
}

describe('walletBalance (single wallet)', () => {
  it('returns the initial balance when there are no transactions', () => {
    expect(walletBalance(kas, [])).toBe(100_000)
  })

  it('adds income and subtracts expense on the wallet', () => {
    const txs = [
      tx({ type: 'income', amount: 50_000 }),
      tx({ type: 'expense', amount: 30_000 }),
    ]
    expect(walletBalance(kas, txs)).toBe(120_000)
  })

  it('debits the source wallet of a transfer', () => {
    const txs = [tx({ type: 'transfer', amount: 40_000, walletId: kas.id, counterWalletId: bank.id })]
    expect(walletBalance(kas, txs)).toBe(60_000)
  })

  it('credits the destination wallet of a transfer', () => {
    const txs = [tx({ type: 'transfer', amount: 40_000, walletId: kas.id, counterWalletId: bank.id })]
    expect(walletBalance(bank, txs)).toBe(40_000)
  })

  it('ignores soft-deleted transactions', () => {
    const txs = [
      tx({ type: 'income', amount: 50_000 }),
      tx({ type: 'income', amount: 999_999, deletedAt: '2026-07-26T00:00:00.000Z' }),
    ]
    expect(walletBalance(kas, txs)).toBe(150_000)
  })

  it('ignores transactions that touch other wallets', () => {
    const txs = [tx({ type: 'expense', amount: 10_000, walletId: bank.id })]
    expect(walletBalance(kas, txs)).toBe(100_000)
  })
})

describe('walletBalances (many wallets, one pass)', () => {
  it('returns an entry for every wallet, including those with no activity', () => {
    const balances = walletBalances([kas, bank], [])
    expect(balances.get(kas.id)).toBe(100_000)
    expect(balances.get(bank.id)).toBe(0)
    expect(balances.size).toBe(2)
  })

  it('moves money from source to destination on a transfer', () => {
    const txs = [tx({ type: 'transfer', amount: 40_000, walletId: kas.id, counterWalletId: bank.id })]
    const balances = walletBalances([kas, bank], txs)
    expect(balances.get(kas.id)).toBe(60_000)
    expect(balances.get(bank.id)).toBe(40_000)
  })

  it('applies only the in-scope side when the counter wallet is not provided', () => {
    // bank is omitted: the transfer still debits kas, but the credit has nowhere
    // to land and is dropped.
    const txs = [tx({ type: 'transfer', amount: 40_000, walletId: kas.id, counterWalletId: bank.id })]
    const balances = walletBalances([kas], txs)
    expect(balances.get(kas.id)).toBe(60_000)
    expect(balances.has(bank.id)).toBe(false)
  })

  it('ignores a transaction whose wallet is not in scope', () => {
    const txs = [tx({ type: 'income', amount: 5000, walletId: 'w-unknown' })]
    const balances = walletBalances([kas, bank], txs)
    expect(balances.get(kas.id)).toBe(100_000)
    expect(balances.get(bank.id)).toBe(0)
  })

  it('agrees with the single-wallet function on a mixed ledger', () => {
    const txs = [
      tx({ type: 'income', amount: 50_000, walletId: kas.id }),
      tx({ type: 'expense', amount: 20_000, walletId: kas.id }),
      tx({ type: 'transfer', amount: 30_000, walletId: kas.id, counterWalletId: bank.id }),
      tx({ type: 'income', amount: 10_000, walletId: bank.id }),
    ]
    const balances = walletBalances([kas, bank], txs)
    expect(balances.get(kas.id)).toBe(walletBalance(kas, txs))
    expect(balances.get(bank.id)).toBe(walletBalance(bank, txs))
  })
})

describe('totalBalance', () => {
  it('sums the initial balances when there is no activity', () => {
    expect(totalBalance([kas, bank], [])).toBe(100_000)
  })

  it('is unchanged by a transfer between two in-scope wallets', () => {
    const txs = [tx({ type: 'transfer', amount: 40_000, walletId: kas.id, counterWalletId: bank.id })]
    expect(totalBalance([kas, bank], txs)).toBe(100_000)
  })

  it('rises with income and falls with expense', () => {
    const txs = [
      tx({ type: 'income', amount: 25_000, walletId: bank.id }),
      tx({ type: 'expense', amount: 5000, walletId: kas.id }),
    ]
    expect(totalBalance([kas, bank], txs)).toBe(120_000)
  })
})
