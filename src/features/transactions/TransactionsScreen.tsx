import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Filter, Pencil, Plus, ReceiptText, RotateCcw } from 'lucide-react'
import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { useGlobalActionStore } from '@/stores/action'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassSelect, type GlassSelectOption } from '@/components/ui/GlassSelect'
import {
  IosArrowDownCircleIcon,
  IosArrowUpCircleIcon,
  IosScaleIcon,
} from '@/components/ui/IosIcons'
import type { Category, Channel, Transaction, Wallet } from '@/db/local/schema'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { currentJakartaMonthPeriod, filterTransactions } from '@/lib/transaction-filter'
import { transactionsText } from '@/lib/ui-text/transactions'
import type { TransactionFormValues } from './schemas'
import { TransactionFormSheet } from './TransactionFormSheet'
import { useTransactionMutations } from './use-transaction-mutations'

const FILTER_ALL = 'all'

type FilterType = 'all' | Transaction['type']
type PeriodFilter = 'all-time' | 'this-month'

function formatDate(iso: string): string {
  return transactionDateFormatter.format(new Date(iso))
}

const transactionDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function transactionLabel(transaction: Transaction, wallets: ReadonlyMap<string, Wallet>): string {
  if (transaction.type !== 'transfer') return transaction.note?.trim() || transactionsText.filters[transaction.type]
  const destination = transaction.counterWalletId === null
    ? undefined
    : wallets.get(transaction.counterWalletId)
  return destination === undefined
    ? transactionsText.filters.transfer
    : `${transactionsText.filters.transfer} · ${destination.name}`
}

function TransactionRow({
  transaction,
  wallets,
  categories,
  channels,
  onEdit,
}: {
  transaction: Transaction
  wallets: ReadonlyMap<string, Wallet>
  categories: ReadonlyMap<string, Category>
  channels: ReadonlyMap<string, Channel>
  onEdit: () => void
}) {
  const wallet = wallets.get(transaction.walletId)
  const category = transaction.categoryId === null ? undefined : categories.get(transaction.categoryId)
  const channel = transaction.channelId === null ? undefined : channels.get(transaction.channelId)
  const isIncome = transaction.type === 'income'
  const isTransfer = transaction.type === 'transfer'
  const Icon = isTransfer ? IosScaleIcon : isIncome ? IosArrowUpCircleIcon : IosArrowDownCircleIcon
  const amountClass = isTransfer ? 'text-accent' : isIncome ? 'text-income' : 'text-expense'
  const iconBg = isTransfer
    ? 'bg-accent/15 text-accent border border-accent/25'
    : isIncome
      ? 'bg-income/15 text-income border border-income/25'
      : 'bg-expense/15 text-expense border border-expense/25'
  const sign = isTransfer ? '' : isIncome ? '+' : '-'
  const meta = [wallet?.name, category?.name, channel?.name].filter(Boolean).join(' · ')

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="ios-pressable flex min-h-16 w-full items-center gap-3 rounded-2xl border border-glass-border/70 bg-glass p-3.5 text-left backdrop-blur-md transition-all hover:bg-glass-hover hover:border-glass-border active:bg-glass-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          <Icon size={20} className="shrink-0" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {transactionLabel(transaction, wallets)}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {meta === '' ? '—' : meta}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
            {formatDate(transaction.occurredAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn('text-right text-sm font-bold tabular-nums', amountClass)}>
              {sign}{formatIDR(transaction.amount)}
            </span>
            <Pencil aria-hidden className="size-3.5 text-muted-foreground" />
          </span>
        </span>
      </button>
    </li>
  )
}

function ListSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
      ))}
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      {children}
    </div>
  )
}

export function TransactionsScreen() {
  const repos = useRepos()
  const { create, update, remove } = useTransactionMutations()
  const [typeFilter, setTypeFilter] = useState<FilterType>(FILTER_ALL)
  const [walletFilter, setWalletFilter] = useState(FILTER_ALL)
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL)
  const [channelFilter, setChannelFilter] = useState(FILTER_ALL)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all-time')
  const [filterOpen, setFilterOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (typeFilter !== FILTER_ALL) count++
    if (walletFilter !== FILTER_ALL) count++
    if (categoryFilter !== FILTER_ALL) count++
    if (channelFilter !== FILTER_ALL) count++
    if (periodFilter !== 'all-time') count++
    return count
  }, [typeFilter, walletFilter, categoryFilter, channelFilter, periodFilter])

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async () => unwrap(await repos.transactions.list()),
  })
  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets,
    queryFn: async () => unwrap(await repos.wallets.list()),
  })
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => unwrap(await repos.categories.list()),
  })
  const channelsQuery = useQuery({
    queryKey: queryKeys.channels,
    queryFn: async () => unwrap(await repos.channels.list()),
  })
  const productsQuery = useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => unwrap(await repos.products.list()),
  })
  const editingItemsQuery = useQuery({
    queryKey: ['transactions', editing?.id, 'items'],
    queryFn: async () => {
      if (editing === null) throw new Error('Transaksi yang diedit tidak tersedia.')
      return unwrap(await repos.transactions.getById(editing.id))
    },
    enabled: formOpen && editing !== null,
  })

  const wallets = useMemo(() => walletsQuery.data ?? [], [walletsQuery.data])
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const channels = useMemo(() => channelsQuery.data ?? [], [channelsQuery.data])
  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const walletMap = useMemo(() => new Map(wallets.map((wallet) => [wallet.id, wallet])), [wallets])
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const channelMap = useMemo(() => new Map(channels.map((channel) => [channel.id, channel])), [channels])
  const initialItems = editingItemsQuery.data?.items ?? []
  const filtered = useMemo(() => {
    const period = periodFilter === 'this-month' ? currentJakartaMonthPeriod() : undefined
    return filterTransactions(transactionsQuery.data ?? [], {
      type: typeFilter === FILTER_ALL ? undefined : typeFilter,
      walletId: walletFilter === FILTER_ALL ? undefined : walletFilter,
      categoryId: categoryFilter === FILTER_ALL ? undefined : categoryFilter,
      channelId: channelFilter === FILTER_ALL ? undefined : channelFilter,
      ...period,
    })
  }, [transactionsQuery.data, typeFilter, walletFilter, categoryFilter, channelFilter, periodFilter])

  const typeOptions: GlassSelectOption[] = [
    { value: FILTER_ALL, label: transactionsText.filters.allType },
    { value: 'income', label: transactionsText.filters.income },
    { value: 'expense', label: transactionsText.filters.expense },
    { value: 'transfer', label: transactionsText.filters.transfer },
  ]
  const walletOptions: GlassSelectOption[] = [
    { value: FILTER_ALL, label: transactionsText.filters.allWallets },
    ...wallets.map((wallet) => ({ value: wallet.id, label: wallet.name })),
  ]
  const categoryOptions: GlassSelectOption[] = [
    { value: FILTER_ALL, label: transactionsText.filters.allCategories },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]
  const channelOptions: GlassSelectOption[] = [
    { value: FILTER_ALL, label: transactionsText.filters.allChannels },
    ...channels.map((channel) => ({ value: channel.id, label: channel.name })),
  ]
  const periodOptions: GlassSelectOption[] = [
    { value: 'all-time', label: transactionsText.filters.allTime },
    { value: 'this-month', label: transactionsText.filters.thisMonth },
  ]

  const isLoading = transactionsQuery.isPending || walletsQuery.isPending || categoriesQuery.isPending || channelsQuery.isPending || productsQuery.isPending
  const isError = transactionsQuery.isError || walletsQuery.isError || categoriesQuery.isError || channelsQuery.isError || productsQuery.isError
  const mutationPending = create.isPending || update.isPending

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(transaction: Transaction): void {
    setEditing(transaction)
    setFormOpen(true)
  }

  function resetFilters(): void {
    setTypeFilter(FILTER_ALL)
    setWalletFilter(FILTER_ALL)
    setCategoryFilter(FILTER_ALL)
    setChannelFilter(FILTER_ALL)
    setPeriodFilter('all-time')
  }

  function retry(): void {
    void transactionsQuery.refetch()
    void walletsQuery.refetch()
    void categoriesQuery.refetch()
    void channelsQuery.refetch()
    void productsQuery.refetch()
  }

  function submit(values: TransactionFormValues & { occurredAt: string }): void {
    if (mutationPending) return
    const save = editing === null
      ? create.mutateAsync(values)
      : update.mutateAsync({ ...values, id: editing.id })
    void save.then(() => {
      setFormOpen(false)
      setEditing(null)
    }).catch(() => undefined)
  }

  function confirmDelete(): void {
    if (deleteTarget === null || remove.isPending) return
    void remove.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null)).catch(() => undefined)
  }

  const pendingAction = useGlobalActionStore((s) => s.pendingAction)
  const clearAction = useGlobalActionStore((s) => s.clearAction)

  useEffect(() => {
    if (pendingAction === 'create-transaction') {
      setEditing(null)
      setFormOpen(true)
      clearAction()
    }
  }, [pendingAction, clearAction])

  return (
    <section className="flex flex-col gap-4">
      {isLoading ? <ListSkeleton /> : isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">{transactionsText.loadError}</p>
          <GlassButton variant="ghost" onClick={retry}>{transactionsText.retry}</GlassButton>
        </GlassCard>
      ) : (
        <>
          {/* Unified Transaksi Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <GlassButton
              variant={activeFilterCount > 0 ? 'primary' : 'ghost'}
              onClick={() => setFilterOpen((prev) => !prev)}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Filter className="size-4" />
              <span>Filter Transaksi</span>
              {activeFilterCount > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              ) : null}
              {filterOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </GlassButton>

            <div className="flex items-center gap-2">
              {activeFilterCount > 0 ? (
                <GlassButton
                  variant="ghost"
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  {transactionsText.filters.clear}
                </GlassButton>
              ) : null}
              <GlassButton variant="primary" onClick={openCreate} className="px-3 text-xs">
                <Plus aria-hidden className="size-4" />
                {transactionsText.addLabel}
              </GlassButton>
            </div>
          </div>

          {filterOpen ? (
            <GlassCard className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <FilterField label={transactionsText.filters.type}>
                <GlassSelect value={typeFilter} onChange={(value) => setTypeFilter(value as FilterType)} options={typeOptions} placeholder={transactionsText.filters.allType} title={transactionsText.filters.type} />
              </FilterField>
              <FilterField label={transactionsText.filters.wallet}>
                <GlassSelect value={walletFilter} onChange={setWalletFilter} options={walletOptions} placeholder={transactionsText.filters.allWallets} title={transactionsText.filters.wallet} searchable />
              </FilterField>
              <FilterField label={transactionsText.filters.category}>
                <GlassSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} placeholder={transactionsText.filters.allCategories} title={transactionsText.filters.category} searchable />
              </FilterField>
              <FilterField label={transactionsText.filters.channel}>
                <GlassSelect value={channelFilter} onChange={setChannelFilter} options={channelOptions} placeholder={transactionsText.filters.allChannels} title={transactionsText.filters.channel} searchable />
              </FilterField>
              <FilterField label={transactionsText.filters.period}>
                <GlassSelect value={periodFilter} onChange={(value) => setPeriodFilter(value as PeriodFilter)} options={periodOptions} placeholder={transactionsText.filters.period} title={transactionsText.filters.period} />
              </FilterField>
            </GlassCard>
          ) : null}

          {filtered.length === 0 ? (
            <GlassCard>
              <GlassEmptyState
                icon={<ReceiptText aria-hidden className="size-6" />}
                title={transactionsText.empty.title}
                description={transactionsText.empty.description}
                action={<GlassButton onClick={openCreate}><Plus aria-hidden className="size-4" />{transactionsText.empty.action}</GlassButton>}
              />
            </GlassCard>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} wallets={walletMap} categories={categoryMap} channels={channelMap} onEdit={() => openEdit(transaction)} />)}
            </ul>
          )}
        </>
      )}

      <TransactionFormSheet
        key={`${editing?.id ?? 'create'}-${initialItems.map((item) => `${item.id}:${item.updatedAt}`).join('|')}`}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open && !mutationPending) setEditing(null)
        }}
        editing={editing}
        wallets={wallets}
        categories={categories}
        channels={channels}
        products={products}
        initialItems={initialItems}
        pending={mutationPending}
        itemsLoading={formOpen && editing !== null && (editingItemsQuery.isPending || editingItemsQuery.isFetching)}
        itemsError={formOpen && editing !== null && editingItemsQuery.isError}
        onRetryItems={() => {
          void editingItemsQuery.refetch()
        }}
        onSubmit={submit}
        onDelete={() => {
          if (editing !== null) {
            setFormOpen(false)
            setDeleteTarget(editing)
          }
        }}
      />

      <GlassConfirmSheet
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleteTarget(null)
        }}
        title={transactionsText.confirmDelete.title}
        description={transactionsText.confirmDelete.description}
        confirmLabel={transactionsText.confirmDelete.confirm}
        cancelLabel={transactionsText.form.cancel}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />

    </section>
  )
}
