import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { totalBalance } from '@/domain/wallet-balance'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { commonText } from '@/lib/ui-text'

export function BerandaPage() {
  const repos = useRepos()

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets,
    queryFn: async () => unwrap(await repos.wallets.list()),
  })
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async () => unwrap(await repos.transactions.list()),
  })

  const retry = () => {
    if (walletsQuery.isError) void walletsQuery.refetch()
    if (transactionsQuery.isError) void transactionsQuery.refetch()
  }

  const wallets = walletsQuery.data
  const transactions = transactionsQuery.data

  let balance: ReactNode
  if (walletsQuery.isPending || transactionsQuery.isPending) {
    // Skeleton shimmer while both lists load.
    balance = <div aria-hidden="true" className="mt-2 h-9 w-44 animate-pulse rounded-xl bg-white/10" />
  } else if (wallets === undefined || transactions === undefined) {
    balance = (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-sm text-expense">{commonText.beranda.balanceLoadError}</p>
        <GlassButton variant="ghost" onClick={retry}>
          {commonText.actions.retry}
        </GlassButton>
      </div>
    )
  } else {
    // Balance is derived, never stored: initial balances + transaction effects,
    // over non-archived wallets only (integer IDR math in the domain layer).
    const activeWallets = wallets.filter((wallet) => !wallet.isArchived)
    const total = totalBalance(activeWallets, transactions)
    balance = (
      // Negative totals render in the expense color, same as WalletsScreen.
      <p className={cn('mt-1 text-3xl font-bold tabular-nums', total < 0 ? 'text-expense' : 'text-zinc-100')}>
        {formatIDR(total)}
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{commonText.tabs.beranda}</h2>
      <GlassCard className="p-6">
        <p className="text-xs font-light tracking-wide text-zinc-400 uppercase">
          {commonText.beranda.totalBalanceLabel}
        </p>
        {balance}
      </GlassCard>
      <p className="px-1 text-sm font-light text-zinc-500">
        {commonText.beranda.summaryComingSoon}
      </p>
    </section>
  )
}
