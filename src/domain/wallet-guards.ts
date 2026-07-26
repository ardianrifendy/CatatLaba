// Pure wallet delete-guard. A wallet referenced by any non-deleted transaction
// (as source `walletId` or transfer destination `counterWalletId`) may only be
// archived, never deleted: those rows are the history that derived balances are
// computed from (initial_balance + Σ transactions), so deleting the wallet would
// orphan them and silently corrupt every total built on top. This module holds
// that rule with no I/O — the caller fetches rows and passes them in, keeping
// the guard unit-testable and decoupled from Drizzle.

// Structural input shape: only the fields the guard reads. The real Drizzle
// `Transaction` rows (and wallet-balance's `TransactionLike`) carry more, but
// are assignable to this, so callers can pass rows straight through.
export interface TransactionRefLike {
  readonly walletId: string
  // Present (and different from walletId) only for transfers.
  readonly counterWalletId?: string | null
  // Soft-deleted rows no longer pin their wallets.
  readonly deletedAt?: string | null
}

/**
 * Wallet ids referenced by at least one non-soft-deleted transaction, on
 * either side (source `walletId` or transfer destination `counterWalletId`).
 * Every wallet in this set may only be archived, never deleted — its history
 * keeps balances honest. One pass; callers that check many wallets should
 * reuse the returned Set.
 */
export function referencedWalletIds(
  transactions: readonly TransactionRefLike[],
): Set<string> {
  const ids = new Set<string>()
  for (const tx of transactions) {
    if (tx.deletedAt != null) continue
    ids.add(tx.walletId)
    if (tx.counterWalletId != null) ids.add(tx.counterWalletId)
  }
  return ids
}

/**
 * Whether deleting `walletId` must be blocked because some non-deleted
 * transaction still references it (offer archive instead). Single-wallet
 * convenience over `referencedWalletIds`.
 */
export function isWalletDeleteBlocked(
  transactions: readonly TransactionRefLike[],
  walletId: string,
): boolean {
  return referencedWalletIds(transactions).has(walletId)
}
