import type {
  CategoryExpense,
  ChannelProfit,
  ProductPerformance,
  ProfitTrendPoint,
} from '@/domain/reporting'
import { GlassCard } from '@/components/ui/GlassCard'
import { formatIDR } from '@/lib/format'
import { reportsText } from '@/lib/ui-text/reports'

type ChartSectionProps = {
  title: string
  children: React.ReactNode
}

const gradientIds = [
  'donut-grad-0',
  'donut-grad-1',
  'donut-grad-2',
  'donut-grad-3',
  'donut-grad-4',
] as const

const legendDotClasses = [
  'bg-accent shadow-accent/40',
  'bg-income shadow-income/40',
  'bg-warning shadow-warning/40',
  'bg-expense shadow-expense/40',
  'bg-muted-foreground shadow-muted-foreground/40',
] as const

export function ChartSection({ title, children }: ChartSectionProps) {
  return (
    <GlassCard className="flex h-full flex-col gap-4 p-4 shadow-glass backdrop-blur-xl">
      <h3 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{title}</h3>
      <div className="flex-1">{children}</div>
    </GlassCard>
  )
}

export function ChannelProfitChart({ rows }: { rows: readonly ChannelProfit[] }) {
  if (rows.length === 0) return <SectionEmpty />
  const maximum = Math.max(...rows.map((row) => Math.abs(row.profit)), 1)

  return (
    <div className="flex flex-col gap-3.5">
      {rows.slice(0, 6).map((row) => {
        const percentage = Math.min(100, Math.max(6, (Math.abs(row.profit) / maximum) * 100))
        const isPositive = row.profit >= 0
        return (
          <div key={row.channelId ?? 'none'} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground truncate max-w-[180px]">{row.label}</span>
              <span className={`font-bold tabular-nums ${isPositive ? 'text-income' : 'text-expense'}`}>
                {isPositive ? '+' : ''}{formatIDR(row.profit)}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-glass border border-glass-border overflow-hidden p-0.5 relative">
              <div
                style={{ width: `${percentage}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isPositive
                    ? 'bg-gradient-to-r from-income/80 to-income shadow-sm shadow-income/30'
                    : 'bg-gradient-to-r from-expense/80 to-expense shadow-sm shadow-expense/30'
                }`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CategoryExpenseChart({ rows }: { rows: readonly CategoryExpense[] }) {
  if (rows.length === 0) return <SectionEmpty />
  const visibleRows = collapseDonutRows(rows)
  const total = visibleRows.reduce((sum, row) => sum + row.expense, 0)
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative flex shrink-0 items-center justify-center">
        <svg
          role="img"
          aria-label={`${reportsText.sections.expenseByCategory}: ${formatIDR(total)}`}
          viewBox="0 0 140 140"
          className="size-44 sm:size-48 drop-shadow-md"
        >
          <defs>
            <linearGradient id="donut-grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#007aff" />
              <stop offset="100%" stopColor="#0055ff" />
            </linearGradient>
            <linearGradient id="donut-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#30d158" />
              <stop offset="100%" stopColor="#248a3d" />
            </linearGradient>
            <linearGradient id="donut-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9f0a" />
              <stop offset="100%" stopColor="#d67900" />
            </linearGradient>
            <linearGradient id="donut-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff453a" />
              <stop offset="100%" stopColor="#c92a2a" />
            </linearGradient>
            <linearGradient id="donut-grad-4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#af52de" />
              <stop offset="100%" stopColor="#7b2cbf" />
            </linearGradient>
          </defs>
          {visibleRows.map((row, index) => {
            const start = offset
            offset += total === 0 ? 0 : row.expense / total
            return (
              <path
                key={row.categoryId ?? row.label}
                d={donutSlicePath(70, 70, 62, 40, start, offset)}
                fill={`url(#${gradientIds[index % gradientIds.length]})`}
                className="transition-all duration-300 hover:opacity-90 cursor-pointer"
              />
            )
          })}
        </svg>

        {/* Donut Center Glass Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
          <span className="text-xs font-extrabold tabular-nums text-foreground">{compactIDR(total)}</span>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
        {visibleRows.map((row, index) => {
          const percent = total > 0 ? Math.round((row.expense / total) * 100) : 0
          return (
            <div
              key={row.categoryId ?? row.label}
              className="flex items-center gap-2.5 text-xs rounded-xl border border-glass-border/40 bg-glass/40 px-3 py-2 backdrop-blur-sm"
            >
              <span
                aria-hidden
                className={`size-2.5 rounded-full shadow-sm ${legendDotClasses[index % legendDotClasses.length]}`}
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{row.label}</span>
              <span className="text-muted-foreground text-[11px] font-medium">{percent}%</span>
              <span className="text-right font-bold tabular-nums text-foreground ml-1">
                {formatIDR(row.expense)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ProfitTrendChart({ rows }: { rows: readonly ProfitTrendPoint[] }) {
  if (rows.length === 0) return <SectionEmpty />
  const maximum = Math.max(...rows.map((row) => Math.abs(row.profit)), 1)
  const points = rows.map((row, index) => {
    const x = rows.length === 1 ? 150 : 16 + (index / (rows.length - 1)) * 268
    const y = 60 - (row.profit / maximum) * 44
    return { ...row, x, y }
  })

  // Build smooth curved path (Catmull-Rom / Spline interpolation)
  const strokePath = buildSmoothPath(points)
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const areaPath = firstPoint && lastPoint
    ? `${strokePath} L ${lastPoint.x} 108 L ${firstPoint.x} 108 Z`
    : ''

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass/30 p-2 backdrop-blur-md">
        <svg
          role="img"
          aria-label={reportsText.sections.profitTrend}
          viewBox="0 0 300 120"
          className="h-44 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trend-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#007aff" />
              <stop offset="50%" stopColor="#af52de" />
              <stop offset="100%" stopColor="#30d158" />
            </linearGradient>
            <linearGradient id="trend-fill-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#007aff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#007aff" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#007aff" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="12" y1="16" x2="288" y2="16" className="stroke-glass-border/40" strokeDasharray="3 3" />
          <line x1="12" y1="60" x2="288" y2="60" className="stroke-glass-border/60" />
          <line x1="12" y1="104" x2="288" y2="104" className="stroke-glass-border/40" strokeDasharray="3 3" />

          {/* Translucent Area Under Curve */}
          {areaPath !== '' ? <path d={areaPath} fill="url(#trend-fill-grad)" /> : null}

          {/* Smooth Curved Line */}
          <path
            d={strokePath}
            fill="none"
            stroke="url(#trend-line-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-shadow)"
            vectorEffect="non-scaling-stroke"
          />

          {/* Glowing Points */}
          {points.map((point) => (
            <g key={point.key}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                className={point.profit >= 0 ? 'fill-income/30' : 'fill-expense/30'}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                className={point.profit >= 0 ? 'fill-income stroke-white' : 'fill-expense stroke-white'}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {labelPoints(points).map((point) => (
          <div
            key={point.key}
            className="flex flex-col rounded-xl border border-glass-border/50 bg-glass/40 p-2 text-xs backdrop-blur-sm"
          >
            <p className="truncate text-[11px] font-medium text-muted-foreground">{formatTrendKey(point.key)}</p>
            <p className={`truncate font-bold tabular-nums ${point.profit >= 0 ? 'text-income' : 'text-expense'}`}>
              {compactIDR(point.profit)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopProducts({ rows }: { rows: readonly ProductPerformance[] }) {
  if (rows.length === 0) return <SectionEmpty />
  return (
    <div className="flex flex-col gap-2.5">
      {rows.slice(0, 5).map((row, index) => {
        const isGold = index === 0
        const isSilver = index === 1
        const isBronze = index === 2
        const badgeBg = isGold
          ? 'bg-amber-400/20 text-amber-500 border border-amber-400/40 shadow-sm shadow-amber-400/20'
          : isSilver
            ? 'bg-slate-300/20 text-slate-400 border border-slate-300/40'
            : isBronze
              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
              : 'bg-accent/15 text-accent border border-accent/25'

        return (
          <div
            key={row.productId}
            className="ios-pressable flex items-center gap-3 rounded-2xl border border-glass-border/70 bg-glass p-3 backdrop-blur-md transition-colors hover:bg-glass-hover"
          >
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${badgeBg}`}>
              #{index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{row.label}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {row.qty} {reportsText.labels.quantity} · {reportsText.labels.revenue} {formatIDR(row.revenue)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">{reportsText.labels.profit}</p>
              <p className={`text-sm font-bold tabular-nums ${row.profit >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatIDR(row.profit)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SectionEmpty() {
  return <p className="py-8 text-center text-sm font-medium text-muted-foreground">{reportsText.sectionEmpty}</p>
}

function collapseDonutRows(rows: readonly CategoryExpense[]): CategoryExpense[] {
  if (rows.length <= 5) return [...rows]
  const first = rows.slice(0, 4)
  const otherExpense = rows.slice(4).reduce((sum, row) => sum + row.expense, 0)
  return [
    ...first,
    { categoryId: '__other__', label: reportsText.labels.other, expense: otherExpense },
  ]
}

function donutSlicePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  start: number,
  end: number,
): string {
  const safeEnd = end - Math.min(0.002, Math.max(0, end - start) / 4)
  const startAngle = start * Math.PI * 2 - Math.PI / 2
  const endAngle = safeEnd * Math.PI * 2 - Math.PI / 2
  const outerStartX = cx + Math.cos(startAngle) * outerRadius
  const outerStartY = cy + Math.sin(startAngle) * outerRadius
  const outerEndX = cx + Math.cos(endAngle) * outerRadius
  const outerEndY = cy + Math.sin(endAngle) * outerRadius
  const innerEndX = cx + Math.cos(endAngle) * innerRadius
  const innerEndY = cy + Math.sin(endAngle) * innerRadius
  const innerStartX = cx + Math.cos(startAngle) * innerRadius
  const innerStartY = cy + Math.sin(startAngle) * innerRadius
  const largeArc = safeEnd - start > 0.5 ? 1 : 0
  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`,
    'Z',
  ].join(' ')
}

function compactIDR(value: number): string {
  return formatIDR(value)
}

function labelPoints<T extends { key: string }>(points: readonly T[]): T[] {
  if (points.length <= 4) return [...points]
  const indexes = new Set([0, Math.round((points.length - 1) / 3), Math.round(((points.length - 1) * 2) / 3), points.length - 1])
  return [...indexes].map((index) => points[index]).filter((point): point is T => point !== undefined)
}

function formatTrendKey(key: string): string {
  const [year = '', month = '', day] = key.split('-')
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day ?? '1')))
  return new Intl.DateTimeFormat('id-ID', {
    day: day === undefined ? undefined : '2-digit',
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

function buildSmoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  const first = points[0]
  if (first === undefined) return ''
  if (points.length === 1) return `M ${first.x} ${first.y}`
  if (points.length === 2) {
    const second = points[1]
    return second ? `M ${first.x} ${first.y} L ${second.x} ${second.y}` : `M ${first.x} ${first.y}`
  }

  let d = `M ${first.x} ${first.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    if (!p1 || !p2 || !p0 || !p3) continue

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}
