import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building,
  CreditCard,
  PieChart as PieChartIcon,
  Sparkles,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassProgress } from '@/components/ui/GlassProgress'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import {
  IosArrowDownCircleIcon,
  IosArrowUpCircleIcon,
  IosChartIcon,
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
import { toast } from '@/stores/toast'
import type { Transaction } from '@/db/local/schema'

import { useTranslation } from '@/lib/language'

type ActiveModalType = 'balance' | 'income' | 'expense' | 'budget' | 'trend' | null

function formatCompactIDR(num: number): string {
  if (num >= 1_000_000) {
    const v = (num / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `${v} Jt`
  }
  if (num >= 1_000) {
    return `${Math.round(num / 1_000)} rb`
  }
  return num.toString()
}

export function BerandaPage() {
  const { t, lang } = useTranslation()
  const repos = useRepos()
  const queryClient = useQueryClient()
  const currentMonth = currentJakartaMonthKey()

  const [activeModal, setActiveModal] = useState<ActiveModalType>(null)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

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
  const categories = categoriesQuery.data ?? []
  const budgets = budgetsQuery.data ?? []

  const currentMonthTx = filterTransactions(transactions, currentJakartaMonthPeriod())
  const summary = summarizeTransactions(currentMonthTx)
  const activeWallets = wallets.filter((wallet) => !wallet.isArchived)
  const balance = totalBalance(activeWallets, transactions)

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]))

  const budgetHighlights = budgets
    .filter((budget) => budget.month === currentMonth)
    .map((budget) => ({
      budget,
      progress: calculateBudgetProgress(budget, transactions),
      category: categoryNames.get(budget.categoryId) ?? commonText.beranda.budgetHighlightsLabel,
    }))
    .sort((left, right) => right.progress.percent - left.progress.percent)

  const trendData = calculate7DayTrend(transactions, lang)

  // Wallet balances breakdown
  const walletBalances = activeWallets.map((w) => {
    const wBalance = totalBalance([w], transactions)
    return {
      wallet: w,
      balance: wBalance,
      percent: balance > 0 ? Math.max(0, Math.round((wBalance / balance) * 100)) : 0,
    }
  })

  // Income by Category breakdown
  const incomeCategoryBreakdown = computeCategoryBreakdown(currentMonthTx, 'income', categoryNames)

  // Expense by Category breakdown
  const expenseCategoryBreakdown = computeCategoryBreakdown(currentMonthTx, 'expense', categoryNames)

  async function handleGenerateSampleData() {
    setIsGenerating(true)
    try {
      await generateSampleData(repos)
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets })
      toast.success(t('sampleGeneratedSuccess'))
    } catch {
      toast.error('Gagal generate data sampel')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleRetry(): void {
    if (walletsQuery.isError) void walletsQuery.refetch()
    if (transactionsQuery.isError) void transactionsQuery.refetch()
    if (budgetsQuery.isError) void budgetsQuery.refetch()
    if (categoriesQuery.isError) void categoriesQuery.refetch()
  }

  return (
    <section className="flex flex-col gap-4 pb-8">
      {/* Sample Data Generator Bar if database is empty */}
      {!isPending && !isError && transactions.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-2.5 p-4 text-center border-accent/30 bg-accent/10">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="size-4 animate-bounce" />
            <span className="text-xs font-bold">{t('databaseEmpty')}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('generateSampleHint')}
          </p>
          <GlassButton
            variant="primary"
            disabled={isGenerating}
            onClick={() => void handleGenerateSampleData()}
            className="h-9 px-4 text-xs font-bold"
          >
            {isGenerating ? t('processing') : t('generateSampleBtn')}
          </GlassButton>
        </GlassCard>
      ) : null}

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
          {/* 1. Hero Balance Card (Press -> Pop Up Detail Saldo) */}
          <GlassCard
            onClick={() => setActiveModal('balance')}
            className="group relative flex flex-col justify-between gap-2.5 p-4.5 overflow-hidden transition-all hover:border-accent/30 shadow-[0_4px_24px_rgba(0,122,255,0.12)] border-glass-border/80 cursor-pointer ios-pressable active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <IosWalletIcon size={20} className="shrink-0 text-accent" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                {t('totalBalance')}
              </span>
            </div>
            <div>
              <p className="text-[30px] sm:text-4xl font-black tracking-tight text-foreground tabular-nums leading-none my-0.5">
                {formatIDR(balance)}
              </p>
            </div>
            {/* Integrated Net Flow Sub-bar */}
            <div className="flex items-center justify-between border-t border-glass-border/60 pt-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <IosScaleIcon size={15} className="text-accent shrink-0" />
                <span>{t('monthlyNetFlow')}</span>
              </div>
              <span
                className={cn(
                  'font-bold tabular-nums text-xs sm:text-sm',
                  summary.net < 0 ? 'text-expense' : summary.net > 0 ? 'text-income' : 'text-foreground',
                )}
              >
                {formatIDR(summary.net)}
              </span>
            </div>
          </GlassCard>

          {/* 2. Symmetrical 2-Column Grid: Income & Expense (Press -> Pop Up Detail) */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label={t('income')}
              subLabel={t('thisMonth')}
              amount={summary.income}
              tone="income"
              icon={IosArrowUpCircleIcon}
              onClick={() => setActiveModal('income')}
            />
            <SummaryCard
              label={t('expense')}
              subLabel={t('thisMonth')}
              amount={summary.expense}
              tone="expense"
              icon={IosArrowDownCircleIcon}
              onClick={() => setActiveModal('expense')}
            />
          </div>
        </div>
      )}

      {/* 3. Mini Trend Chart Card: Apple iOS Style Clean Minimalist Chart (Day tap -> Local touch effect, Card tap -> Pop Up) */}
      {!isPending && !isError ? (() => {
        const selectedDay = selectedDayIdx !== null ? trendData.days[selectedDayIdx] : trendData.days[trendData.days.length - 1]

        return (
          <GlassCard className="flex flex-col gap-2.5 p-4 transition-all hover:border-glass-border">
            {/* Header with Title Press Touch Effect -> Opens Detail Modal */}
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => setActiveModal('trend')}
                className="flex items-center gap-2 cursor-pointer ios-pressable active:scale-[0.97] hover:opacity-85 py-0.5 px-1.5 -ml-1 rounded-xl transition-all border border-transparent hover:border-glass-border/40 hover:bg-glass-hover/40"
              >
                <IosChartIcon size={20} className="shrink-0 text-accent" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground whitespace-nowrap">
                  {t('trend7Days')}
                </h3>
              </div>
            </div>

            {/* Selected Day Nominal Insight Banner (iOS Glassmorphic Capsule) */}
            {selectedDay ? (
              <div className="flex items-center justify-between rounded-2xl bg-glass-hover/80 backdrop-blur-md px-3.5 py-2 text-xs border border-glass-border/60 shadow-glass">
                <span className="font-bold text-foreground tracking-tight">
                  {selectedDay.label}, {selectedDay.fullDateStr}
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold tabular-nums">
                  <span className="rounded-lg bg-income/15 text-income border border-income/25 px-2 py-0.5">
                    + {formatIDR(selectedDay.income)}
                  </span>
                  <span className="rounded-lg bg-expense/15 text-expense border border-expense/25 px-2 py-0.5">
                    - {formatIDR(selectedDay.expense)}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Clean Apple-Style Bar Chart (Day Labels sitting BELOW X-Axis Line) */}
            <div className="flex gap-1.5 pt-1">
              {/* Y-Axis Scale Column */}
              <div className="flex flex-col justify-between h-20 text-[9px] font-bold text-muted-foreground/80 text-right pr-1 border-r border-glass-border/40 select-none shrink-0 w-8 pb-0.5">
                <span>{formatCompactIDR(trendData.maxVal)}</span>
                <span>{formatCompactIDR(trendData.maxVal / 2)}</span>
                <span>0</span>
              </div>

              {/* Main Chart Section */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Bars Area with X-Axis Border line at bottom */}
                <div className="grid grid-cols-7 gap-1 h-20 pt-1 border-b border-glass-border/40">
                  {trendData.days.map((day, idx) => {
                    const incomeHeight = trendData.maxVal > 0 ? (day.income / trendData.maxVal) * 100 : 0
                    const expenseHeight = trendData.maxVal > 0 ? (day.expense / trendData.maxVal) * 100 : 0
                    const isSelected = selectedDayIdx === idx || (selectedDayIdx === null && idx === trendData.days.length - 1)

                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDayIdx(idx)
                        }}
                        className={cn(
                          'flex items-end justify-center gap-0.5 h-full cursor-pointer transition-all active:scale-95 select-none min-w-0',
                          isSelected ? 'opacity-100' : 'opacity-55 hover:opacity-90',
                        )}
                      >
                        {/* Income Bar */}
                        <div
                          style={{ height: `${Math.max(incomeHeight, day.income > 0 ? 10 : 3)}%` }}
                          className={cn(
                            'w-1.5 sm:w-2 rounded-full transition-all duration-300',
                            day.income > 0 ? 'bg-income shadow-[0_0_6px_rgba(48,209,88,0.3)]' : 'bg-glass-strong/40',
                          )}
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${Math.max(expenseHeight, day.expense > 0 ? 10 : 3)}%` }}
                          className={cn(
                            'w-1.5 sm:w-2 rounded-full transition-all duration-300',
                            day.expense > 0 ? 'bg-expense shadow-[0_0_6px_rgba(255,69,58,0.3)]' : 'bg-glass-strong/40',
                          )}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Day Labels Row BELOW X-Axis Line */}
                <div className="grid grid-cols-7 gap-1">
                  {trendData.days.map((day, idx) => {
                    const isSelected = selectedDayIdx === idx || (selectedDayIdx === null && idx === trendData.days.length - 1)

                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDayIdx(idx)
                        }}
                        className="cursor-pointer select-none"
                      >
                        <span
                          className={cn(
                            'w-full text-center text-[9px] uppercase font-bold py-0.5 rounded-md border transition-all duration-200 truncate block select-none',
                            isSelected
                              ? 'bg-accent/15 text-accent border-accent/30 shadow-[0_0_6px_rgba(0,122,255,0.15)] backdrop-blur-sm'
                              : 'bg-transparent text-muted-foreground border-transparent',
                          )}
                        >
                          {day.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </GlassCard>
        )
      })() : null}

      {/* 4. Budget Highlights Card (Press -> Pop Up Detail) */}
      {!isPending && !isError ? (
        <GlassCard
          onClick={() => setActiveModal('budget')}
          className="group flex flex-col gap-4 p-5 cursor-pointer ios-pressable transition-all hover:border-glass-border active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <IosTargetIcon size={20} className="shrink-0 text-accent" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              {t('monthlyBudget')}
            </h3>
          </div>

          {budgetHighlights.length === 0 ? (
            <p className="text-xs font-light text-muted-foreground">{commonText.beranda.noBudgets}</p>
          ) : (
            <div className="grid gap-3.5">
              {budgetHighlights.slice(0, 3).map(({ budget, category, progress }) => (
                <div key={budget.id} className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-[1fr_auto] gap-3 text-xs">
                    <p className="truncate font-semibold text-foreground">{category}</p>
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

      {/* ==================== POP-UP SHEETS ==================== */}

      {/* 1. SALDO TOTAL DETAIL SHEET */}
      <GlassBottomSheet open={activeModal === 'balance'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <GlassBottomSheetContent>
          <GlassBottomSheetTitle className="text-base font-bold text-foreground mb-1">
            Rincian Saldo & Kas
          </GlassBottomSheetTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Akumulasi saldo terkini dari seluruh akun dompet dan kas aktif.
          </p>

          <div className="flex flex-col gap-3">
            {walletBalances.map(({ wallet, balance: wBal, percent }) => {
              const WIcon = wallet.type === 'bank' ? Building : wallet.type === 'ewallet' ? CreditCard : WalletIcon
              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-glass border border-glass-border"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25">
                      <WIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{wallet.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{wallet.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-foreground tabular-nums">{formatIDR(wBal)}</p>
                    <p className="text-[10px] font-semibold text-accent">{percent}% dari total</p>
                  </div>
                </div>
              )
            })}

            <div className="mt-2 p-3.5 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-between">
              <span className="text-xs font-bold text-accent">Total Akumulasi Saldo</span>
              <span className="text-sm font-extrabold text-foreground tabular-nums">{formatIDR(balance)}</span>
            </div>
          </div>
        </GlassBottomSheetContent>
      </GlassBottomSheet>

      {/* 2. PEMASUKAN DETAIL SHEET */}
      <GlassBottomSheet open={activeModal === 'income'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <GlassBottomSheetContent>
          <GlassBottomSheetTitle className="text-base font-bold text-income mb-1 flex items-center gap-2">
            <ArrowUpRight className="size-5" /> Rincian Pemasukan Bulan Ini
          </GlassBottomSheetTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Total pemasukan: <strong className="text-income font-bold">{formatIDR(summary.income)}</strong>
          </p>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Breakdown Per Kategori
            </h4>
            {incomeCategoryBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Belum ada data pemasukan bulan ini.</p>
            ) : (
              incomeCategoryBreakdown.map((item) => (
                <div key={item.categoryName} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-foreground">{item.categoryName}</span>
                    <span className="font-bold text-income tabular-nums">{formatIDR(item.amount)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-glass-strong overflow-hidden">
                    <div
                      style={{ width: `${item.percent}%` }}
                      className="h-full bg-income rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassBottomSheetContent>
      </GlassBottomSheet>

      {/* 3. PENGELUARAN DETAIL SHEET */}
      <GlassBottomSheet open={activeModal === 'expense'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <GlassBottomSheetContent>
          <GlassBottomSheetTitle className="text-base font-bold text-expense mb-1 flex items-center gap-2">
            <ArrowDownRight className="size-5" /> Rincian Pengeluaran Bulan Ini
          </GlassBottomSheetTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Total pengeluaran: <strong className="text-expense font-bold">{formatIDR(summary.expense)}</strong>
          </p>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Breakdown Per Kategori
            </h4>
            {expenseCategoryBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Belum ada data pengeluaran bulan ini.</p>
            ) : (
              expenseCategoryBreakdown.map((item) => (
                <div key={item.categoryName} className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-foreground">{item.categoryName}</span>
                    <span className="font-bold text-expense tabular-nums">{formatIDR(item.amount)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-glass-strong overflow-hidden">
                    <div
                      style={{ width: `${item.percent}%` }}
                      className="h-full bg-expense rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassBottomSheetContent>
      </GlassBottomSheet>

      {/* 4. ANGGARAN DETAIL SHEET */}
      <GlassBottomSheet open={activeModal === 'budget'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <GlassBottomSheetContent>
          <GlassBottomSheetTitle className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
            <PieChartIcon className="size-5 text-accent" /> Status Anggaran Bulan Ini
          </GlassBottomSheetTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Pemantauan alokasi dan realisasi batas anggaran per kategori.
          </p>

          <div className="flex flex-col gap-3.5">
            {budgetHighlights.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Belum ada anggaran yang diatur untuk bulan ini.</p>
            ) : (
              budgetHighlights.map(({ budget, category, progress }) => (
                <div key={budget.id} className="p-3.5 rounded-2xl bg-glass border border-glass-border flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-foreground">{category}</span>
                    <span className="text-muted-foreground tabular-nums font-medium">
                      {formatIDR(progress.spent)} / {formatIDR(progress.budget)}
                    </span>
                  </div>
                  <GlassProgress
                    value={progress.percent}
                    label={category}
                    tone={progress.percent > 90 ? 'warning' : 'default'}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Sisa: {formatIDR(Math.max(0, progress.budget - progress.spent))}</span>
                    <span className="font-bold text-accent">{progress.percent}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassBottomSheetContent>
      </GlassBottomSheet>

      {/* 5. TREN GRAFIK DETAIL SHEET */}
      <GlassBottomSheet open={activeModal === 'trend'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <GlassBottomSheetContent>
          <GlassBottomSheetTitle className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
            <IosChartIcon size={22} className="text-accent" /> Rincian Tren Arus Kas 7 Hari
          </GlassBottomSheetTitle>
          <p className="text-xs text-muted-foreground mb-4">
            Tabel rincian harian nominal Pemasukan, Pengeluaran, dan Net Flow.
          </p>

          <div className="flex flex-col gap-2 divide-y divide-glass-border/40">
            {trendData.days.map((day, idx) => {
              const netDay = day.income - day.expense
              return (
                <div key={idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div>
                    <p className="font-bold text-foreground">{day.fullDateStr}</p>
                    <p className="text-[11px] text-muted-foreground">{day.label}</p>
                  </div>

                  <div className="text-right flex flex-col gap-0.5">
                    <div className="flex items-center justify-end gap-2 text-[11px]">
                      <span className="text-income font-medium">+ {formatIDR(day.income)}</span>
                      <span className="text-expense font-medium">- {formatIDR(day.expense)}</span>
                    </div>
                    <span
                      className={cn(
                        'font-bold tabular-nums',
                        netDay > 0 ? 'text-income' : netDay < 0 ? 'text-expense' : 'text-foreground',
                      )}
                    >
                      Bersih: {formatIDR(netDay)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassBottomSheetContent>
      </GlassBottomSheet>
    </section>
  )
}

function computeCategoryBreakdown(
  txs: Transaction[],
  type: 'income' | 'expense',
  categoryNames: Map<string, string>,
) {
  const filtered = txs.filter((t) => t.type === type)
  const total = filtered.reduce((acc, t) => acc + t.amount, 0)
  if (total === 0) return []

  const map = new Map<string, number>()
  for (const t of filtered) {
    const catName = (t.categoryId ? categoryNames.get(t.categoryId) : null) ?? 'Umum'
    map.set(catName, (map.get(catName) ?? 0) + t.amount)
  }

  return Array.from(map.entries())
    .map(([catName, amt]) => ({
      categoryName: catName,
      amount: amt,
      percent: Math.round((amt / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}

function calculate7DayTrend(transactions: Transaction[], lang: string = 'id') {
  const days: { label: string; fullDateStr: string; income: number; expense: number }[] = []
  const now = new Date()
  const locale = lang === 'en' ? 'en-US' : 'id-ID'

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = d.toLocaleDateString(locale, { weekday: 'long' })
    const fullDateStr = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })

    let dayIncome = 0
    let dayExpense = 0

    for (const tx of transactions) {
      if (tx.occurredAt.slice(0, 10) === dateStr) {
        if (tx.type === 'income') dayIncome += tx.amount
        else dayExpense += tx.amount
      }
    }

    days.push({ label: dayLabel, fullDateStr, income: dayIncome, expense: dayExpense })
  }

  const maxVal = Math.max(...days.map((d) => Math.max(d.income, d.expense)), 1)
  return { days, maxVal }
}

async function generateSampleData(repos: ReturnType<typeof useRepos>) {
  const now = new Date()

  // 1. Ensure Wallets exist
  let walletsRes = await repos.wallets.list()
  let walletsList = walletsRes.ok ? walletsRes.value : []
  if (walletsList.length === 0) {
    await repos.wallets.create({ name: 'Kas Tunai Toko', type: 'cash', initialBalance: 50000000 })
    await repos.wallets.create({ name: 'Bank BCA Utama', type: 'bank', initialBalance: 45000000 })
    await repos.wallets.create({ name: 'ShopeePay Business', type: 'ewallet', initialBalance: 4746468 })
    walletsRes = await repos.wallets.list()
    walletsList = walletsRes.ok ? walletsRes.value : []
  }
  const defaultWallet = walletsList[0]

  // 2. Ensure Categories exist
  let catRes = await repos.categories.list()
  let catList = catRes.ok ? catRes.value : []
  if (catList.length === 0) {
    await repos.categories.create({ name: 'Penjualan Produk', type: 'income', icon: 'ShoppingBag' })
    await repos.categories.create({ name: 'Jasa & Servis', type: 'income', icon: 'Wrench' })
    await repos.categories.create({ name: 'Bahan Baku', type: 'expense', icon: 'Package' })
    await repos.categories.create({ name: 'Listrik & Operasional', type: 'expense', icon: 'Zap' })
    catRes = await repos.categories.list()
    catList = catRes.ok ? catRes.value : []
  }

  const incomeCat = catList.find((c) => c.type === 'income') ?? catList[0]
  const expenseCat = catList.find((c) => c.type === 'expense') ?? catList[0]

  // 3. Ensure Budgets exist for current month
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (expenseCat) {
    await repos.budgets.create({
      categoryId: expenseCat.id,
      month: monthKey,
      amount: 1500000,
    })
  }

  // 4. Generate 7 Days Sample Transactions
  const samples = [
    { offsetDay: 6, type: 'income' as const, amount: 450000, note: 'Penjualan Toko' },
    { offsetDay: 6, type: 'expense' as const, amount: 120000, note: 'Beli Perlengkapan' },
    { offsetDay: 5, type: 'income' as const, amount: 750000, note: 'Order Tokopedia' },
    { offsetDay: 5, type: 'expense' as const, amount: 310000, note: 'Restok Bahan' },
    { offsetDay: 4, type: 'income' as const, amount: 620000, note: 'Penjualan Kasir' },
    { offsetDay: 4, type: 'expense' as const, amount: 180000, note: 'Token Listrik' },
    { offsetDay: 3, type: 'income' as const, amount: 980000, note: 'Order Shopee' },
    { offsetDay: 3, type: 'expense' as const, amount: 420000, note: 'Gaji Harian' },
    { offsetDay: 2, type: 'income' as const, amount: 540000, note: 'Penjualan QRIS' },
    { offsetDay: 2, type: 'expense' as const, amount: 250000, note: 'Biaya Kurir' },
    { offsetDay: 1, type: 'income' as const, amount: 890000, note: 'Servis HP' },
    { offsetDay: 1, type: 'expense' as const, amount: 340000, note: 'Beli Sparepart' },
    { offsetDay: 0, type: 'income' as const, amount: 1250000, note: 'Grosir Paket' },
    { offsetDay: 0, type: 'expense' as const, amount: 253532, note: 'Beli Kemasan' },
  ]

  for (const s of samples) {
    const d = new Date(now)
    d.setDate(d.getDate() - s.offsetDay)

    await repos.transactions.create({
      type: s.type,
      amount: s.amount,
      walletId: defaultWallet ? defaultWallet.id : '',
      categoryId: s.type === 'income' ? (incomeCat ? incomeCat.id : null) : (expenseCat ? expenseCat.id : null),
      channelId: null,
      counterWalletId: null,
      note: s.note,
      occurredAt: d.toISOString(),
      recurringRuleId: null,
    })
  }
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
  subLabel,
  amount,
  tone,
  icon: Icon,
  onClick,
}: {
  label: string
  subLabel?: string
  amount: number
  tone?: 'income' | 'expense'
  icon?: React.ComponentType<import('@/components/ui/IosIcons').IosIconProps>
  onClick?: () => void
}) {
  const amountClass =
    tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-foreground'

  const iconColor =
    tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-accent'

  return (
    <GlassCard
      onClick={onClick}
      className="group relative flex h-full flex-col justify-between gap-3 p-4 cursor-pointer ios-pressable transition-all hover:border-glass-border active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={20} className={cn('shrink-0', iconColor)} /> : null}
        <div className="flex flex-col leading-none gap-0.5 min-w-0">
          <span className="text-xs font-extrabold uppercase tracking-wider text-foreground truncate">
            {label}
          </span>
          {subLabel ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 truncate">
              {subLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-end justify-between gap-1">
        <p className={cn('text-xl font-black tabular-nums leading-tight sm:text-2xl', amountClass)}>
          {formatIDR(amount)}
        </p>
      </div>
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
