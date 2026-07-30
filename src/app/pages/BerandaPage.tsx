import { useQuery } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import { GlassProgress } from '@/components/ui/GlassProgress'
import {
  IosArrowDownCircleIcon,
  IosArrowUpCircleIcon,
  IosScaleIcon,
  IosTargetIcon,
  IosWalletIcon,
} from '@/components/ui/IosIcons'
import { calculateBudgetProgress } from '@/domain/budget-progress'
import { summarizeTransactions } from '@/domain/transaction-summary'
import { totalBalance } from '@/domain/wallet-balance'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { currentJakartaMonthPeriod, filterTransactions } from '@/lib/transaction-filter'
import { commonText } from '@/lib/ui-text'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'

export function BerandaPage() {
  const repos = useRepos()
  const currentMonth = currentJakartaMonthKey()

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets,
    queryFn: async () => unwrap(await repos.wallets.list()),
  })
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: async () => unwrap(await repos.transactions.list()),
  })
  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets,
    queryFn: async () => unwrap(await repos.budgets.list()),
  })
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => unwrap(await repos.categories.list()),
  })

  const isPending =
    walletsQuery.isPending ||
    transactionsQuery.isPending ||
    budgetsQuery.isPending ||
    categoriesQuery.isPending
  const isError =
    walletsQuery.isError ||
    transactionsQuery.isError ||
    budgetsQuery.isError ||
    categoriesQuery.isError
  const wallets = walletsQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const summary = summarizeTransactions(filterTransactions(transactions, currentJakartaMonthPeriod()))
  const balance = totalBalance(wallets.filter((wallet) => !wallet.isArchived), transactions)
  const categoryNames = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category.name]),
  )
  const budgetHighlights = (budgetsQuery.data ?? [])
    .filter((budget) => budget.month === currentMonth)
    .map((budget) => ({
      budget,
      progress: calculateBudgetProgress(budget, transactions),
      category: categoryNames.get(budget.categoryId) ?? commonText.beranda.budgetHighlightsLabel,
    }))
    .sort((left, right) => right.progress.percent - left.progress.percent)
    .slice(0, 3)

  function handleRetry(): void {
    if (walletsQuery.isError) void walletsQuery.refetch()
    if (transactionsQuery.isError) void transactionsQuery.refetch()
    if (budgetsQuery.isError) void budgetsQuery.refetch()
    if (categoriesQuery.isError) void categoriesQuery.refetch()
  }

  return (
    <section className="flex flex-col gap-4">
      {isPending ? (
        <BerandaSkeleton />
      ) : isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-light text-muted-foreground">{commonText.beranda.balanceLoadError}</p>
          <GlassButton variant="ghost" onClick={handleRetry}>
            {commonText.actions.retry}
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3.5">
          {/* Hero Balance Card with Integrated Net Profit Bar */}
          <GlassCard className="group relative flex flex-col justify-between gap-4 p-5 overflow-hidden bg-gradient-to-br from-accent/15 via-glass to-glass-strong border-accent/25 shadow-glass">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {commonText.beranda.totalBalanceLabel}
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent border border-accent/30 shadow-[0_0_14px_rgba(0,122,255,0.2)] transition-transform duration-300 group-hover:scale-110">
                <IosWalletIcon size={22} className="shrink-0" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
                {formatIDR(balance)}
              </p>
            </div>
            {/* Integrated Net Flow Sub-bar */}
            <div className="flex items-center justify-between border-t border-glass-border/60 pt-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <IosScaleIcon size={16} className="text-accent shrink-0" />
                <span>{commonText.beranda.monthlyNetLabel}</span>
              </div>
              <span
                className={cn(
                  'font-bold tabular-nums text-sm',
                  summary.net < 0 ? 'text-expense' : summary.net > 0 ? 'text-income' : 'text-foreground',
                )}
              >
                {formatIDR(summary.net)}
              </span>
            </div>
          </GlassCard>

          {/* Symmetrical 2-Column Grid: Income & Expense */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label={commonText.beranda.monthlyIncomeLabel}
              amount={summary.income}
              tone="income"
              icon={IosArrowUpCircleIcon}
            />
            <SummaryCard
              label={commonText.beranda.monthlyExpenseLabel}
              amount={summary.expense}
              tone="expense"
              icon={IosArrowDownCircleIcon}
            />
          </div>
        </div>
      )}

      {!isPending && !isError && transactions.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <p className="text-sm font-light text-muted-foreground">
            {commonText.beranda.noTransactions}
          </p>
        </GlassCard>
      ) : null}

      {!isPending && !isError ? (
        <GlassCard className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2">
            <IosTargetIcon size={20} className="text-accent shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">
              {commonText.beranda.budgetHighlightsLabel}
            </h3>
          </div>
          {budgetHighlights.length === 0 ? (
            <p className="text-sm font-light text-muted-foreground">{commonText.beranda.noBudgets}</p>
          ) : (
            <div className="grid gap-4">
              {budgetHighlights.map(({ budget, category, progress }) => (
                <div key={budget.id} className="flex flex-col gap-2">
                  <div className="grid grid-cols-[1fr_auto] gap-3 text-xs">
                    <p className="truncate font-medium text-foreground-subtle">{category}</p>
                    <p className="text-right tabular-nums text-muted-foreground">
                      {formatIDR(progress.spent)} / {formatIDR(progress.budget)}
                    </p>
                  </div>
                  <GlassProgress
                    value={progress.percent}
                    label={category}
                    tone={progress.percent > 90 ? 'warning' : 'default'}
                  />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ) : null}
    </section>
  )
}

function currentJakartaMonthKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

function SummaryCard({
  label,
  amount,
  tone,
  icon: Icon,
}: {
  label: string
  amount: number
  tone?: 'income' | 'expense'
  icon?: React.ComponentType<import('@/components/ui/IosIcons').IosIconProps>
}) {
  const amountClass =
    tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-foreground'

  const iconBg =
    tone === 'income'
      ? 'bg-income/20 text-income border border-income/30 shadow-[0_0_12px_rgba(48,209,88,0.2)]'
      : tone === 'expense'
        ? 'bg-expense/20 text-expense border border-expense/30 shadow-[0_0_12px_rgba(255,69,58,0.2)]'
        : 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_12px_rgba(0,122,255,0.2)]'

  return (
    <GlassCard className="group relative flex h-full flex-col justify-between gap-3 p-4 hover:border-glass-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
          {label}
        </span>
        {Icon ? (
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110', iconBg)}>
            <Icon size={18} className="shrink-0" />
          </div>
        ) : null}
      </div>
      <p className={cn('text-xl font-bold tabular-nums leading-tight sm:text-2xl', amountClass)}>
        {formatIDR(amount)}
      </p>
    </GlassCard>
  )
}

function BerandaSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3.5">
      <GlassCard className="h-32 animate-pulse bg-glass/40" />
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="h-24 animate-pulse bg-glass/40" />
        <GlassCard className="h-24 animate-pulse bg-glass/40" />
      </div>
    </div>
  )
}
