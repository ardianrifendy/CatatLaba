import { History, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { Product } from '@/db/local/schema'
import type { ProductHistoryEntry } from '@/db/repositories/products'
import { useRepos } from '@/app/providers'
import { GlassBottomSheet, GlassBottomSheetContent, GlassBottomSheetTitle } from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { productsText } from '@/lib/ui-text/products'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onEdit: () => void
}

export function ProductDetailSheet({ open, onOpenChange, product, onEdit }: Props) {
  const repos = useRepos()
  const historyQuery = useQuery({
    queryKey: queryKeys.productHistory(product?.id ?? ''),
    queryFn: async () => unwrap(await repos.products.listHistory(product?.id ?? '')),
    enabled: open && product !== null,
  })

  return (
    <GlassBottomSheet open={open} onOpenChange={onOpenChange}>
      <GlassBottomSheetContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <GlassBottomSheetTitle className="mb-4 text-base font-semibold text-foreground">
          {productsText.detail.title}
        </GlassBottomSheetTitle>
        {product !== null ? (
          <div className="flex flex-col gap-4">
            <GlassCard className="grid grid-cols-3 gap-3 p-4 text-center">
              <Metric label={productsText.labels.stock} value={`${product.stockQty} ${product.unit}`} />
              <Metric label={productsText.labels.cost} value={formatIDR(product.costPrice)} />
              <Metric label={productsText.labels.salePrice} value={formatIDR(product.salePrice)} />
            </GlassCard>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-foreground truncate">{product.name}</h3>
              <div className="flex items-center gap-2">
                <GlassButton variant="primary" className="px-3 py-1.5 text-xs shrink-0" onClick={onEdit}>
                  <Plus aria-hidden className="size-4" />
                  Tambah Stok / Edit
                </GlassButton>
              </div>
            </div>
            {historyQuery.isPending ? <HistorySkeleton /> : null}
            {historyQuery.isError ? (
              <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
                <p className="text-sm font-normal text-muted-foreground">{productsText.detail.loadError}</p>
                <GlassButton variant="ghost" onClick={() => void historyQuery.refetch()}>
                  {productsText.detail.retry}
                </GlassButton>
              </GlassCard>
            ) : null}
            {!historyQuery.isPending && !historyQuery.isError && (historyQuery.data ?? []).length === 0 ? (
              <GlassEmptyState
                icon={<History aria-hidden className="size-6 text-muted-foreground" />}
                title={productsText.detail.noHistory}
              />
            ) : null}
            {!historyQuery.isPending && !historyQuery.isError && (historyQuery.data ?? []).length > 0 ? (
              <div className="flex flex-col gap-2">
                {(historyQuery.data ?? []).map((entry) => <HistoryRow key={entry.id} entry={entry} unit={product.unit} />)}
              </div>
            ) : null}
          </div>
        ) : null}
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
      <span className="truncate text-xs font-bold tabular-nums text-foreground">{value}</span>
    </div>
  )
}

function HistoryRow({ entry, unit }: { entry: ProductHistoryEntry; unit: string }) {
  const isSale = entry.type === 'income'
  const date = new Date(entry.occurredAt).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  return (
    <GlassCard className="grid grid-cols-[1fr_auto] gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {isSale ? productsText.detail.sale : productsText.detail.purchase}
        </p>
        <p className="text-xs font-normal text-muted-foreground">
          {date} · {entry.qty} {unit} · {formatIDR(entry.unitPrice)}
        </p>
      </div>
      <div className="text-right text-xs tabular-nums">
        <p className={isSale ? 'text-income font-bold' : 'text-foreground font-semibold'}>
          {entry.stockDelta > 0 ? '+' : ''}{entry.stockDelta} {unit}
        </p>
        <p className="text-muted-foreground">
          {productsText.labels.profit}: {formatIDR(entry.profit)}
        </p>
      </div>
    </GlassCard>
  )
}

function HistorySkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
      <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
    </div>
  )
}
