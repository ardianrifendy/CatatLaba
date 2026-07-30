import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowLeftRight, Plus, Wallet as WalletIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRepos } from '@/app/providers'
import type { Wallet } from '@/db/local/schema'
import { walletBalances } from '@/domain/wallet-balance'
import { referencedWalletIds } from '@/domain/wallet-guards'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { walletsText } from '@/lib/ui-text'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { TransferSheet } from './TransferSheet'
import { WalletFormSheet } from './WalletFormSheet'
import { walletTypeLabel } from './wallet-types'
import { IosWalletIcon } from '@/components/ui/IosIcons'

export function WalletsScreen({ onBack }: { onBack: () => void }) {
  const repos = useRepos()

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets,
    queryFn: async () => unwrap(await repos.wallets.list()),
  })
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async () => unwrap(await repos.transactions.list()),
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  const wallets = walletsQuery.data
  const transactions = transactionsQuery.data

  const balances = useMemo(
    () => walletBalances(wallets ?? [], transactions ?? []),
    [wallets, transactions],
  )
  const activeWallets = useMemo(
    () => (wallets ?? []).filter((wallet) => !wallet.isArchived),
    [wallets],
  )
  const archivedWallets = useMemo(
    () => (wallets ?? []).filter((wallet) => wallet.isArchived),
    [wallets],
  )
  const total = useMemo(() => {
    let sum = 0
    for (const wallet of activeWallets) sum += balances.get(wallet.id) ?? 0
    return sum
  }, [activeWallets, balances])

  const referencedIds = useMemo(
    () => referencedWalletIds(transactions ?? []),
    [transactions],
  )

  const isPending = walletsQuery.isPending || transactionsQuery.isPending
  const isError = walletsQuery.isError || transactionsQuery.isError

  function openCreate(): void {
    setEditingWallet(null)
    setFormOpen(true)
  }

  function openEdit(wallet: Wallet): void {
    setEditingWallet(wallet)
    setFormOpen(true)
  }

  function handleRetry(): void {
    if (walletsQuery.isError) void walletsQuery.refetch()
    if (transactionsQuery.isError) void transactionsQuery.refetch()
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label={walletsText.backLabel} onClick={onBack}>
          <ArrowLeft aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
        <h2 className="flex-1 truncate text-lg font-bold tracking-tight text-foreground">
          {walletsText.title}
        </h2>
        <GlassIconButton aria-label={walletsText.addLabel} onClick={openCreate}>
          <Plus aria-hidden className="size-5 text-foreground" />
        </GlassIconButton>
      </div>

      {isPending ? (
        <ScreenSkeleton />
      ) : isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-normal text-muted-foreground">{walletsText.loadError}</p>
          <GlassButton variant="ghost" onClick={handleRetry}>
            {walletsText.retry}
          </GlassButton>
        </GlassCard>
      ) : (wallets ?? []).length === 0 ? (
        <GlassCard>
          <GlassEmptyState
            icon={<WalletIcon aria-hidden className="size-6 text-muted-foreground" />}
            title={walletsText.empty.title}
            description={walletsText.empty.description}
            action={
              <GlassButton onClick={openCreate}>
                <Plus aria-hidden className="size-4" />
                {walletsText.empty.cta}
              </GlassButton>
            }
          />
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-6">
          <div className="flex flex-col gap-4">
            <GlassCard className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {walletsText.totalBalanceLabel}
              </p>
              <p
                className={cn(
                  'mt-1 text-3xl font-extrabold tabular-nums tracking-tight',
                  total < 0 ? 'text-expense' : 'text-foreground',
                )}
              >
                {formatIDR(total)}
              </p>
            </GlassCard>
            {activeWallets.length >= 2 ? (
              <GlassButton
                variant="ghost"
                onClick={() => setTransferOpen(true)}
                className="w-full"
              >
                <ArrowLeftRight aria-hidden className="size-4" />
                {walletsText.transferButton}
              </GlassButton>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {activeWallets.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activeWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    balance={balances.get(wallet.id) ?? wallet.initialBalance}
                    onClick={() => openEdit(wallet)}
                  />
                ))}
              </div>
            ) : null}

            {archivedWallets.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {walletsText.archivedSection}
                </h3>
                {archivedWallets.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    balance={balances.get(wallet.id) ?? wallet.initialBalance}
                    archived
                    onClick={() => openEdit(wallet)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <WalletFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        wallet={editingWallet}
        walletHasTransactions={(walletId) => referencedIds.has(walletId)}
      />
      <TransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        activeWallets={activeWallets}
        balances={balances}
      />
    </section>
  )
}

type WalletRowProps = {
  wallet: Wallet
  balance: number
  archived?: boolean
  onClick: () => void
}

function WalletRow({ wallet, balance, archived = false, onClick }: WalletRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'ios-pressable flex min-h-14 w-full items-center gap-3 rounded-2xl border border-glass-border/70 bg-glass px-4 py-3 text-left backdrop-blur-md transition-all hover:bg-glass-hover hover:border-glass-border active:bg-glass-active',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        archived && 'opacity-60',
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25 shadow-[0_0_10px_rgba(0,122,255,0.15)]"
      >
        <IosWalletIcon size={20} className="shrink-0" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {wallet.name}
        </span>
        <span className="block text-xs font-medium text-muted-foreground">
          {walletTypeLabel(wallet.type)}
        </span>
      </span>
      <span
        className={cn(
          'shrink-0 text-sm font-bold tabular-nums',
          balance < 0 ? 'text-expense' : 'text-foreground',
        )}
      >
        {formatIDR(balance)}
      </span>
    </button>
  )
}

function ScreenSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="h-24 animate-pulse rounded-3xl border border-glass-border bg-glass" />
      <div className="flex flex-col gap-2">
        <div className="h-14 animate-pulse rounded-2xl border border-glass-border bg-glass" />
        <div className="h-14 animate-pulse rounded-2xl border border-glass-border bg-glass" />
        <div className="h-14 animate-pulse rounded-2xl border border-glass-border bg-glass" />
      </div>
    </div>
  )
}
