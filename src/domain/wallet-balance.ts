// Pure wallet-balance derivation. SCHEMA.md: "Balance is derived (initial_balance
// + Σ transactions), never stored." This module holds that rule with no I/O — the
// caller fetches rows and passes them in, which keeps the arithmetic unit-testable
// and the domain decoupled from Drizzle. All amounts are integer IDR, so every
// operation here is integer add/subtract: no floats, no division, no rounding.

// Structural input shapes: only the fields the derivation reads. The real Drizzle
// `Wallet` / `Transaction` rows carry more, but are assignable to these, so
// callers can pass rows straight through without mapping.
export interface WalletLike {
  readonly id: string
  readonly initialBalance: number
}

export interface TransactionLike {
  readonly type: 'income' | 'expense' | 'transfer'
  readonly amount: number
  readonly walletId: string
  // Present (and different from walletId) only for transfers.
  readonly counterWalletId?: string | null
  // Soft-deleted rows have no ledger effect.
  readonly deletedAt?: string | null
}

// Signed effect of one transaction on a single wallet:
//   income   → +amount on wallet_id
//   expense  → −amount on wallet_id
//   transfer → −amount on wallet_id (source), +amount on counter_wallet_id (dest)
// A soft-deleted transaction, or one that doesn't touch this wallet, contributes 0.
function deltaForWallet(tx: TransactionLike, walletId: string): number {
  if (tx.deletedAt != null) return 0
  if (tx.walletId === walletId) {
    // Source side: income credits, expense and transfer both debit.
    return tx.type === 'income' ? tx.amount : -tx.amount
  }
  if (tx.type === 'transfer' && tx.counterWalletId === walletId) {
    // Destination side of a transfer.
    return tx.amount
  }
  return 0
}

// Balance of a single wallet = its initial balance plus the effect of every
// (non-deleted) transaction that touches it.
export function walletBalance(wallet: WalletLike, transactions: readonly TransactionLike[]): number {
  let balance = wallet.initialBalance
  for (const tx of transactions) balance += deltaForWallet(tx, wallet.id)
  return balance
}

// Balances for many wallets in a single pass over the transactions (O(wallets +
// transactions) rather than O(wallets × transactions)). Returns a Map keyed by
// wallet id; every provided wallet appears, even with no transactions. A
// transaction referencing a wallet id that isn't in `wallets` is ignored for the
// missing side — the caller controls which wallets are in scope.
export function walletBalances(
  wallets: readonly WalletLike[],
  transactions: readonly TransactionLike[],
): Map<string, number> {
  const balances = new Map<string, number>()
  for (const wallet of wallets) balances.set(wallet.id, wallet.initialBalance)

  for (const tx of transactions) {
    if (tx.deletedAt != null) continue

    const source = balances.get(tx.walletId)
    if (source !== undefined) {
      balances.set(tx.walletId, source + (tx.type === 'income' ? tx.amount : -tx.amount))
    }

    if (tx.type === 'transfer' && tx.counterWalletId != null) {
      const dest = balances.get(tx.counterWalletId)
      if (dest !== undefined) balances.set(tx.counterWalletId, dest + tx.amount)
    }
  }

  return balances
}

// Combined balance across all provided wallets. Transfers between two in-scope
// wallets net to zero (money moved, net worth unchanged), so the total reflects
// only real inflows and outflows.
export function totalBalance(
  wallets: readonly WalletLike[],
  transactions: readonly TransactionLike[],
): number {
  let total = 0
  for (const balance of walletBalances(wallets, transactions).values()) total += balance
  return total
}
