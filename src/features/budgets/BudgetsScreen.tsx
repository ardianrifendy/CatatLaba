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
import { budgetsText } from '@/lib/ui-text/budgets'
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
      <div className="flex items-center gap-3">
        <h2 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">
          {budgetsText.title}
        </h2>
        <GlassIconButton
          aria-label={budgetsText.addLabel}
          onClick={openCreate}
          disabled={isPending}
        >
          <Plus aria-hidden className="size-5" />
        </GlassIconButton>
      </div>

      <div className="flex items-center gap-2">
        <GlassIconButton
          aria-label={budgetsText.previousMonth}
          onClick={() => setSelectedMonth((month) => shiftMonth(month, -1))}
        >
          <ChevronLeft aria-hidden className="size-5" />
        </GlassIconButton>
        <GlassButton
          variant="ghost"
          onClick={() => setSelectedMonth(currentJakartaMonth())}
          className="min-w-0 flex-1 capitalize"
          title={budgetsText.currentMonth}
        >
          <span className="truncate">{monthLabel(selectedMonth)}</span>
        </GlassButton>
        <GlassIconButton
          aria-label={budgetsText.nextMonth}
          onClick={() => setSelectedMonth((month) => shiftMonth(month, 1))}
        >
          <ChevronRight aria-hidden className="size-5" />
        </GlassIconButton>
      </div>

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
          <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3">
            <SummaryCard label={budgetsText.summary.allocated} value={summary.allocated} />
            <SummaryCard label={budgetsText.summary.spent} value={summary.spent} />
            <SummaryCard
              className="col-span-2 sm:col-span-1"
              label={summary.remaining < 0 ? budgetsText.summary.over : budgetsText.summary.remaining}
              value={Math.abs(summary.remaining)}
              danger={summary.remaining < 0}
            />
          </div>
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

function SummaryCard({
  label,
  value,
  danger = false,
  className,
}: {
  label: string
  value: number
  danger?: boolean
  className?: string
}) {
  return (
    <GlassCard className={cn('flex h-full min-w-0 flex-col gap-1 p-3', className)}>
      <p className="truncate text-xs font-normal text-zinc-500">{label}</p>
      <p
        className={cn(
          'break-words text-right text-xs font-semibold tabular-nums sm:text-sm',
          danger ? 'text-expense' : 'text-foreground font-semibold',
        )}
      >
        {formatIDR(value)}
      </p>
    </GlassCard>
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

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground font-semibold">
            {category?.name ?? budgetsText.form.categoryLabel}
          </p>
          <p className="text-xs font-normal text-zinc-500">
            {formatIDR(progress.spent)} / {formatIDR(progress.budget)}
          </p>
        </div>
        <GlassIconButton aria-label={budgetsText.form.editTitle} onClick={onEdit}>
          <Pencil aria-hidden className="size-4" />
        </GlassIconButton>
      </div>
      <GlassProgress
        value={progress.percent}
        label={`${category?.name ?? budgetsText.title}: ${progress.percent}%`}
        tone={isOverBudget ? 'warning' : 'default'}
      />
      <div className="grid grid-cols-2 gap-3 text-xs">
        <p className="text-zinc-500">{progress.percent}% {budgetsText.progress.used}</p>
        <p
          className={cn(
            'text-right font-medium tabular-nums',
            isOverBudget ? 'text-expense' : 'text-zinc-300',
          )}
        >
          {isOverBudget ? budgetsText.progress.over : budgetsText.progress.remaining}{' '}
          {formatIDR(Math.abs(progress.remaining))}
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
