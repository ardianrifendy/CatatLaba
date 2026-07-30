import { useQuery } from '@tanstack/react-query'
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import { buildReport, type ReportPeriod, type ReportTransaction } from '@/domain/reporting'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { reportsText } from '@/lib/ui-text/reports'
import {
  CategoryExpenseChart,
  ChannelProfitChart,
  ChartSection,
  ProfitTrendChart,
  TopProducts,
} from './ReportCharts'

type PeriodMode = 'month' | 'quarter' | 'year'

const periodOptions: ReadonlyArray<{ value: PeriodMode; label: string }> = [
  { value: 'month', label: reportsText.period.month },
  { value: 'quarter', label: reportsText.period.quarter },
  { value: 'year', label: reportsText.period.year },
]

export function ReportsScreen() {
  const repos = useRepos()
  const [mode, setMode] = useState<PeriodMode>('month')
  const [cursor, setCursor] = useState(currentJakartaMonth)
  const periodView = useMemo(() => makePeriod(cursor, mode), [cursor, mode])

  const reportQuery = useQuery({
    queryKey: queryKeys.reports(periodView.period.from, periodView.period.to),
    queryFn: async () => {
      const [transactionRows, channels, categories, products] = await Promise.all([
        repos.transactions.listWithItems({
          from: periodView.period.from,
          to: periodView.period.to,
        }).then(unwrap),
        repos.channels.list().then(unwrap),
        repos.categories.list().then(unwrap),
        repos.products.list().then(unwrap),
      ])
      const transactions: ReportTransaction[] = transactionRows.map(({ transaction, items }) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        channelId: transaction.channelId,
        categoryId: transaction.categoryId,
        occurredAt: transaction.occurredAt,
        items: items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
        })),
      }))
      return {
        transactionCount: transactions.filter((transaction) => transaction.type !== 'transfer').length,
        report: buildReport({
          transactions,
          labels: {
            channels: toNameLookup(channels),
            categories: toNameLookup(categories),
            products: toNameLookup(products),
            unknown: reportsText.labels.unknown,
          },
          period: periodView.period,
        }),
      }
    },
  })

  function changeMode(nextMode: PeriodMode): void {
    setMode(nextMode)
    setCursor((current) => alignCursor(current, nextMode))
  }

  function movePeriod(direction: -1 | 1): void {
    setCursor((current) => addMonths(current, direction * periodStep(mode)))
  }

  return (
    <section className="flex flex-col gap-4">
      <GlassSegmented
        aria-label={reportsText.period.label}
        value={mode}
        onChange={changeMode}
        options={periodOptions}
        disabled={reportQuery.isFetching}
        className="w-full"
      />

      <GlassCard className="flex items-center gap-3 p-2.5">
        <GlassButton
          variant="ghost"
          className="size-10 px-0"
          aria-label={reportsText.period.previous}
          onClick={() => movePeriod(-1)}
        >
          <ChevronLeft aria-hidden className="size-5 text-foreground" />
        </GlassButton>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-foreground">{periodView.label}</p>
        <GlassButton
          variant="ghost"
          className="size-10 px-0"
          aria-label={reportsText.period.next}
          onClick={() => movePeriod(1)}
        >
          <ChevronRight aria-hidden className="size-5 text-foreground" />
        </GlassButton>
      </GlassCard>

      {reportQuery.isPending ? <ReportsSkeleton /> : null}
      {reportQuery.isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-normal text-muted-foreground">{reportsText.loadError}</p>
          <GlassButton variant="ghost" onClick={() => void reportQuery.refetch()}>
            {reportsText.retry}
          </GlassButton>
        </GlassCard>
      ) : null}
      {!reportQuery.isPending && !reportQuery.isError && reportQuery.data.transactionCount === 0 ? (
        <GlassCard>
          <GlassEmptyState
            icon={<BarChart3 aria-hidden className="size-6 text-muted-foreground" />}
            title={reportsText.empty.title}
            description={reportsText.empty.description}
          />
        </GlassCard>
      ) : null}
      {!reportQuery.isPending && !reportQuery.isError && reportQuery.data.transactionCount > 0 ? (
        <ReportContent report={reportQuery.data.report} />
      ) : null}
    </section>
  )
}

function ReportContent({ report }: { report: ReturnType<typeof buildReport> }) {
  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="grid grid-cols-3 gap-2 p-3.5 text-center">
        <SummaryMetric label={reportsText.summary.revenue} value={report.summary.revenue} tone="income" />
        <SummaryMetric label={reportsText.summary.expense} value={report.summary.expense} tone="expense" />
        <SummaryMetric label={reportsText.summary.profit} value={report.summary.profit} tone="profit" />
      </GlassCard>
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <ChartSection title={reportsText.sections.profitByChannel}>
          <ChannelProfitChart rows={report.profitByChannel} />
        </ChartSection>
        <ChartSection title={reportsText.sections.expenseByCategory}>
          <CategoryExpenseChart rows={report.expenseByCategory} />
        </ChartSection>
      </div>
      <ChartSection title={reportsText.sections.profitTrend}>
        <ProfitTrendChart rows={report.profitTrend} />
      </ChartSection>
      <ChartSection title={reportsText.sections.topProducts}>
        <TopProducts rows={report.topProducts} />
      </ChartSection>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'income' | 'expense' | 'profit'
}) {
  const color =
    tone === 'expense'
      ? 'text-expense'
      : tone === 'profit' && value < 0
        ? 'text-expense'
        : 'text-income'
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`truncate text-base font-extrabold tabular-nums sm:text-xl ${color}`}>{formatIDR(value)}</span>
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-3xl border border-glass-border bg-glass" />
        <div className="h-24 animate-pulse rounded-3xl border border-glass-border bg-glass" />
        <div className="h-24 animate-pulse rounded-3xl border border-glass-border bg-glass" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-3xl border border-glass-border bg-glass" />
        <div className="h-64 animate-pulse rounded-3xl border border-glass-border bg-glass" />
      </div>
      <div className="h-64 animate-pulse rounded-3xl border border-glass-border bg-glass" />
    </div>
  )
}

type CalendarCursor = {
  year: number
  month: number
}

function currentJakartaMonth(): CalendarCursor {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date())
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value ?? '1970'),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? '1') - 1,
  }
}

function makePeriod(cursor: CalendarCursor, mode: PeriodMode): { period: ReportPeriod; label: string } {
  const start = alignCursor(cursor, mode)
  const end = addMonths(start, periodStep(mode))
  return {
    period: {
      from: jakartaMonthBoundary(start),
      to: jakartaMonthBoundary(end),
      granularity: mode === 'month' ? 'day' : 'month',
    },
    label: periodLabel(start, end, mode),
  }
}

function alignCursor(cursor: CalendarCursor, mode: PeriodMode): CalendarCursor {
  if (mode === 'month') return cursor
  if (mode === 'quarter') return { year: cursor.year, month: Math.floor(cursor.month / 3) * 3 }
  return { year: cursor.year, month: 0 }
}

function periodStep(mode: PeriodMode): number {
  if (mode === 'month') return 1
  if (mode === 'quarter') return 3
  return 12
}

function addMonths(cursor: CalendarCursor, delta: number): CalendarCursor {
  const date = new Date(Date.UTC(cursor.year, cursor.month + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

function jakartaMonthBoundary(cursor: CalendarCursor): string {
  return new Date(Date.UTC(cursor.year, cursor.month, 1, -7)).toISOString()
}

function periodLabel(start: CalendarCursor, end: CalendarCursor, mode: PeriodMode): string {
  if (mode === 'month') return formatMonth(start, 'long')
  if (mode === 'year') return String(start.year)
  const finalMonth = addMonths(end, -1)
  return `${formatMonth(start, 'short')} – ${formatMonth(finalMonth, 'short')}`
}

function formatMonth(cursor: CalendarCursor, month: 'short' | 'long'): string {
  return new Intl.DateTimeFormat('id-ID', {
    month,
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(cursor.year, cursor.month, 1)))
}

function toNameLookup<T extends { id: string; name: string }>(rows: readonly T[]): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.id, row.name]))
}
