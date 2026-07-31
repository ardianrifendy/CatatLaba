import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Pencil, PiggyBank, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassProgress } from '@/components/ui/GlassProgress'
import type { Budget, Category } from '@/db/local/schema'
import {
  computeBudgetProgress,
  type BudgetProgress,
} from '@/domain/budget-progress'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { jakartaMonthPeriod } from '@/lib/transaction-filter'
import { budgetsText } from '@/lib/ui-text'
import { BudgetFormSheet } from './BudgetFormSheet'

function currentJakartaMonth(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

function shiftMonth(month: string, offset: number): string {
  const [yearValue = 1970, monthValue = 1] = month.split('-').map(Number)
  const date = new Date(Date.UTC(yearValue, monthValue - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthRange(month: string): { from: string; to: string } {
  const [yearValue = 1970, monthValue = 1] = month.split('-').map(Number)
  return jakartaMonthPeriod(yearValue, monthValue)
}

function monthLabel(month: string): string {
  const [yearValue = 1970, monthValue = 1] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(Date.UTC(yearValue, monthValue - 1, 15)))
}

export function BudgetsScreen() {
  const repos = useRepos()
  const [selectedMonth, setSelectedMonth] = useState(currentJakartaMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const range = monthRange(selectedMonth)

  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets,
    queryFn: async () => unwrap(await repos.budgets.list()),
  })
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => unwrap(await repos.categories.list()),
  })
  const transactionsQuery = useQuery({
    queryKey: [...queryKeys.transactions, 'budget-progress', selectedMonth],
    queryFn: async () =>
      unwrap(
        await repos.transactions.list({
          type: 'expense',
          from: range.from,
          to: range.to,
        }),
      ),
  })

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const monthBudgets = useMemo(
    () => (budgetsQuery.data ?? []).filter((budget) => budget.month === selectedMonth),
    [budgetsQuery.data, selectedMonth],
  )
  const progressRows = useMemo(
    () =>
      monthBudgets.map((budget) => ({
        budget,
        progress: computeBudgetProgress(budget, transactionsQuery.data ?? []),
      })),
    [monthBudgets, transactionsQuery.data],
  )
  const summary = useMemo(
    () =>
      progressRows.reduce(
        (total, row) => ({
          allocated: total.allocated + row.progress.budget,
          spent: total.spent + row.progress.spent,
          remaining: total.remaining + row.progress.remaining,
        }),
        { allocated: 0, spent: 0, remaining: 0 },
      ),
    [progressRows],
  )
  const isPending =
    budgetsQuery.isPending || categoriesQuery.isPending || transactionsQuery.isPending
  const isError =
    budgetsQuery.isError || categoriesQuery.isError || transactionsQuery.isError

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(budget: Budget): void {
    setEditing(budget)
    setFormOpen(true)
  }

  function retry(): void {
    void Promise.all([
      budgetsQuery.refetch(),
      categoriesQuery.refetch(),
      transactionsQuery.refetch(),
    ])
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          ANGGARAN BULANAN
        </span>
        <GlassButton
          variant="primary"
          onClick={openCreate}
          disabled={isPending}
          className="px-3 text-xs"
        >
          <Plus aria-hidden className="size-4" />
          <span>Tambah Anggaran</span>
        </GlassButton>
      </div>

      {/* Sleek Integrated Month Navigator */}
      <GlassCard className="flex items-center justify-between p-1.5 backdrop-blur-xl">
        <GlassIconButton
          aria-label={budgetsText.previousMonth}
          onClick={() => setSelectedMonth((month) => shiftMonth(month, -1))}
          className="size-8"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </GlassIconButton>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground capitalize">
            {monthLabel(selectedMonth)}
          </span>
          {selectedMonth !== currentJakartaMonth() ? (
            <button
              onClick={() => setSelectedMonth(currentJakartaMonth())}
              className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent border border-accent/25 hover:bg-accent/25 transition-colors"
            >
              Bulan Ini
            </button>
          ) : null}
        </div>

        <GlassIconButton
          aria-label={budgetsText.nextMonth}
          onClick={() => setSelectedMonth((month) => shiftMonth(month, 1))}
          className="size-8"
        >
          <ChevronRight aria-hidden className="size-4" />
        </GlassIconButton>
      </GlassCard>

      {isPending && !isError ? <BudgetSkeleton /> : null}
      {isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-normal text-zinc-400">{budgetsText.loadError}</p>
          <GlassButton variant="ghost" onClick={retry}>
            {budgetsText.retry}
          </GlassButton>
        </GlassCard>
      ) : null}

      {!isPending && !isError && progressRows.length === 0 ? (
        <GlassCard>
          <GlassEmptyState
            icon={<PiggyBank aria-hidden className="size-6" />}
            title={budgetsText.empty.title}
            description={budgetsText.empty.description}
            action={
              <GlassButton onClick={openCreate}>
                <Plus aria-hidden className="size-4" />
                {budgetsText.empty.cta}
              </GlassButton>
            }
          />
        </GlassCard>
      ) : null}

      {!isPending && !isError && progressRows.length > 0 ? (
        <>
          {/* iOS 26 Glassmorphic 3-Column Summary Widget */}
          <GlassCard className="grid grid-cols-3 divide-x divide-glass-border/40 p-3.5 backdrop-blur-xl">
            <div className="flex flex-col gap-0.5 px-1 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {budgetsText.summary.allocated}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-foreground tabular-nums truncate">
                {formatIDR(summary.allocated)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 px-1 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {budgetsText.summary.spent}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-foreground tabular-nums truncate">
                {formatIDR(summary.spent)}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 px-1 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {summary.remaining < 0 ? budgetsText.summary.over : budgetsText.summary.remaining}
              </span>
              <span
                className={cn(
                  'text-xs sm:text-sm font-extrabold tabular-nums truncate',
                  summary.remaining < 0 ? 'text-expense' : 'text-accent',
                )}
              >
                {formatIDR(Math.abs(summary.remaining))}
              </span>
            </div>
          </GlassCard>

          <div className="grid gap-3">
            {progressRows.map(({ budget, progress }) => (
              <BudgetProgressCard
                key={budget.id}
                category={categoryById.get(budget.categoryId)}
                progress={progress}
                onEdit={() => openEdit(budget)}
              />
            ))}
          </div>
        </>
      ) : null}

      <BudgetFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        budget={editing}
        defaultMonth={selectedMonth}
        categories={categories}
      />
    </section>
  )
}

function BudgetProgressCard({
  category,
  progress,
  onEdit,
}: {
  category: Category | undefined
  progress: BudgetProgress
  onEdit: () => void
}) {
  const isOverBudget = progress.status === 'over-budget'
  const isNearLimit = progress.percent >= 80 && !isOverBudget

  return (
    <GlassCard className="flex flex-col gap-3.5 p-4 transition-all hover:border-glass-border">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-foreground">
            {category?.name ?? budgetsText.form.categoryLabel}
          </h4>
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            {formatIDR(progress.spent)} <span className="text-muted-foreground/60">/</span> {formatIDR(progress.budget)}
          </p>
        </div>

        <GlassIconButton
          aria-label={budgetsText.form.editTitle}
          onClick={onEdit}
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <Pencil aria-hidden className="size-3.5" />
        </GlassIconButton>
      </div>

      <GlassProgress
        value={progress.percent}
        label={`${category?.name ?? budgetsText.title}: ${progress.percent}%`}
        tone={isOverBudget ? 'danger' : isNearLimit ? 'warning' : 'default'}
      />

      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors',
            isOverBudget
              ? 'bg-expense/15 text-expense border border-expense/25'
              : isNearLimit
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25'
                : 'bg-accent/10 text-accent border border-accent/20',
          )}
        >
          {progress.percent}% terpakai
        </span>

        <p
          className={cn(
            'text-right text-xs font-semibold tabular-nums',
            isOverBudget ? 'text-expense font-extrabold' : 'text-muted-foreground',
          )}
        >
          {isOverBudget ? 'Terlampaui' : 'Sisa'} {formatIDR(Math.abs(progress.remaining))}
        </p>
      </div>
    </GlassCard>
  )
}

function BudgetSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="h-16 animate-pulse rounded-lg bg-glass" />
        <div className="h-16 animate-pulse rounded-lg bg-glass" />
        <div className="col-span-2 h-16 animate-pulse rounded-lg bg-glass sm:col-span-1" />
      </div>
      <div className="h-32 animate-pulse rounded-lg bg-glass" />
      <div className="h-32 animate-pulse rounded-lg bg-glass" />
    </div>
  )
}
