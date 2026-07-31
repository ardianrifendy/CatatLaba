import { useQuery } from '@tanstack/react-query'
import { Filter, Pencil, Plus, ReceiptText, RotateCcw, Search, X } from 'lucide-react'
import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react'
import { useGlobalActionStore } from '@/stores/action'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSelect, type GlassSelectOption } from '@/components/ui/GlassSelect'
import {
  IosArrowDownCircleIcon,
  IosArrowUpCircleIcon,
  IosScaleIcon,
} from '@/components/ui/IosIcons'
import { useLanguageStore } from '@/stores/language'
import type { Category, Channel, Transaction, Wallet } from '@/db/local/schema'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { currentJakartaMonthPeriod, filterTransactions, jakartaDayPeriod } from '@/lib/transaction-filter'
import { transactionsText } from '@/lib/ui-text'
import type { TransactionFormValues } from './schemas'
import { TransactionFormSheet } from './TransactionFormSheet'
import { useTransactionMutations } from './use-transaction-mutations'

const FILTER_ALL = 'all'

type FilterType = 'all' | Transaction['type']
type PeriodFilter = 'all-time' | 'today' | '7-days' | 'this-month' | 'custom'

function formatDate(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(iso))
}

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
  const lang = useLanguageStore((s) => s.lang)
  const wallet = wallets.get(transaction.walletId)
  const category = transaction.categoryId === null ? undefined : categories.get(transaction.categoryId)
  const channel = transaction.channelId === null ? undefined : channels.get(transaction.channelId)
  const isIncome = transaction.type === 'income'
  const isTransfer = transaction.type === 'transfer'
  const Icon = isTransfer ? IosScaleIcon : isIncome ? IosArrowUpCircleIcon : IosArrowDownCircleIcon
  const amountClass = isTransfer ? 'text-accent' : isIncome ? 'text-income' : 'text-expense'
  const sign = isTransfer ? '' : isIncome ? '+' : '-'
  const meta = [wallet?.name, category?.name, channel?.name].filter(Boolean).join(' · ')

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="ios-pressable flex min-h-16 w-full items-center gap-3 rounded-2xl border border-glass-border/70 bg-glass p-3.5 text-left backdrop-blur-md transition-all hover:bg-glass-hover hover:border-glass-border active:bg-glass-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Icon size={22} className={cn('shrink-0', amountClass)} />
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
            {formatDate(transaction.occurredAt, lang)}
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
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    if (periodFilter === 'custom' && (customStartDate || customEndDate)) count++
    return count
  }, [typeFilter, walletFilter, categoryFilter, channelFilter, periodFilter, customStartDate, customEndDate])

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
    let period: { from?: string; to?: string } | undefined
    if (periodFilter === 'this-month') {
      period = currentJakartaMonthPeriod()
    } else if (periodFilter === 'today') {
      const nowParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date())
      const year = nowParts.find((p) => p.type === 'year')?.value
      const month = nowParts.find((p) => p.type === 'month')?.value
      const day = nowParts.find((p) => p.type === 'day')?.value
      if (year && month && day) {
        period = jakartaDayPeriod(`${year}-${month}-${day}`)
      }
    } else if (periodFilter === '7-days') {
      const now = new Date()
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      period = { from: past.toISOString(), to: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() }
    } else if (periodFilter === 'custom') {
      const from = customStartDate ? jakartaDayPeriod(customStartDate).from : undefined
      const to = customEndDate ? jakartaDayPeriod(customEndDate).to : undefined
      period = { from, to }
    }

    const baseFiltered = filterTransactions(transactionsQuery.data ?? [], {
      type: typeFilter === FILTER_ALL ? undefined : typeFilter,
      walletId: walletFilter === FILTER_ALL ? undefined : walletFilter,
      categoryId: categoryFilter === FILTER_ALL ? undefined : categoryFilter,
      channelId: channelFilter === FILTER_ALL ? undefined : channelFilter,
      ...period,
    })

    if (!searchQuery.trim()) return baseFiltered

    const q = searchQuery.toLowerCase().trim()
    return baseFiltered.filter((tx) => {
      const note = (tx.note ?? '').toLowerCase()
      const walletName = (walletMap.get(tx.walletId)?.name ?? '').toLowerCase()
      const categoryName = tx.categoryId ? (categoryMap.get(tx.categoryId)?.name ?? '').toLowerCase() : ''
      const channelName = tx.channelId ? (channelMap.get(tx.channelId)?.name ?? '').toLowerCase() : ''
      const amountStr = tx.amount.toString()
      const formattedAmount = formatIDR(tx.amount).toLowerCase()

      return (
        note.includes(q) ||
        walletName.includes(q) ||
        categoryName.includes(q) ||
        channelName.includes(q) ||
        amountStr.includes(q) ||
        formattedAmount.includes(q)
      )
    })
  }, [
    transactionsQuery.data,
    typeFilter,
    walletFilter,
    categoryFilter,
    channelFilter,
    periodFilter,
    customStartDate,
    customEndDate,
    searchQuery,
    walletMap,
    categoryMap,
    channelMap,
  ])

  const lang = useLanguageStore((s) => s.lang)
  const isEn = lang === 'en'

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
    { value: 'today', label: isEn ? 'Today' : 'Hari Ini' },
    { value: '7-days', label: isEn ? 'Last 7 Days' : '7 Hari Terakhir' },
    { value: 'this-month', label: transactionsText.filters.thisMonth },
    { value: 'custom', label: isEn ? 'Custom Date Range' : 'Pilih Tanggal (Custom)' },
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
    setCustomStartDate('')
    setCustomEndDate('')
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isEn ? 'Transaction List' : 'Daftar Transaksi'}
            </span>

            <div className="flex items-center gap-2">
              {activeFilterCount > 0 || searchQuery ? (
                <GlassButton
                  variant="ghost"
                  onClick={() => {
                    resetFilters()
                    setSearchQuery('')
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2"
                >
                  <RotateCcw className="size-3.5" />
                  {transactionsText.filters.clear}
                </GlassButton>
              ) : null}

              <GlassButton
                variant={searchOpen || searchQuery ? 'primary' : 'ghost'}
                onClick={() => {
                  setSearchOpen((prev) => !prev)
                  if (!searchOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 100)
                  }
                }}
                className="flex items-center gap-2 text-xs font-semibold px-3"
              >
                <Search className="size-4" />
                <span>{isEn ? 'Search' : 'Cari Transaksi'}</span>
              </GlassButton>

              <GlassButton
                variant={activeFilterCount > 0 || filterOpen ? 'primary' : 'ghost'}
                onClick={() => setFilterOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-semibold px-3"
              >
                <Filter className="size-4" />
                <span>Filter</span>
                {activeFilterCount > 0 ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                ) : null}
              </GlassButton>

              <GlassButton variant="primary" onClick={openCreate} className="px-3 text-xs">
                <Plus aria-hidden className="size-4" />
                {transactionsText.addLabel}
              </GlassButton>
            </div>
          </div>

          {searchOpen || searchQuery ? (
            <div className="relative flex items-center animate-in fade-in slide-in-from-top-1 duration-200">
              <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
              <GlassInput
                ref={searchInputRef}
                type="text"
                placeholder={isEn ? "Search name, amount, wallet, or category..." : "Cari nama, nominal, dompet, atau kategori..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}

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
              {periodFilter === 'custom' ? (
                <>
                  <FilterField label={isEn ? "From Date" : "Dari Tanggal"}>
                    <GlassInput
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </FilterField>
                  <FilterField label={isEn ? "To Date" : "Sampai Tanggal"}>
                    <GlassInput
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </FilterField>
                </>
              ) : null}
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
