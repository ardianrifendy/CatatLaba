import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGlobalActionStore } from '@/stores/action'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import type { Product } from '@/db/local/schema'
import { IosPackageIcon } from '@/components/ui/IosIcons'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { productsText } from '@/lib/ui-text/products'
import { ProductDetailSheet } from './ProductDetailSheet'
import { ProductFormSheet } from './ProductFormSheet'

export function ProductsScreen({ onBack }: { onBack?: () => void }) {
  const repos = useRepos()
  const productsQuery = useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => unwrap(await repos.products.list()),
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const products = productsQuery.data ?? []
  const active = products.filter((product) => !product.isArchived)
  const archived = products.filter((product) => product.isArchived)

  const pendingAction = useGlobalActionStore((s) => s.pendingAction)
  const clearAction = useGlobalActionStore((s) => s.clearAction)

  useEffect(() => {
    if (pendingAction === 'create-product') {
      setEditing(null)
      setFormOpen(true)
      clearAction()
    }
  }, [pendingAction, clearAction])

  function openCreate(): void {
    setEditing(null)
    setFormOpen(true)
  }

  function openDetail(product: Product): void {
    setSelected(product)
    setDetailOpen(true)
  }

  function openEdit(product: Product): void {
    setEditing(product)
    setFormOpen(true)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <GlassIconButton aria-label={productsText.backLabel} onClick={onBack}>
            <ArrowLeft aria-hidden className="size-5" />
          </GlassIconButton>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {productsText.title}
          </span>
        )}
        <GlassButton variant="primary" onClick={openCreate} disabled={productsQuery.isPending}>
          <Plus aria-hidden className="size-4" />
          {productsText.addLabel}
        </GlassButton>
      </div>

      {productsQuery.isPending ? <ScreenSkeleton /> : null}
      {productsQuery.isError ? <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm font-light text-zinc-400">{productsText.loadError}</p>
        <GlassButton variant="ghost" onClick={() => void productsQuery.refetch()}>{productsText.retry}</GlassButton>
      </GlassCard> : null}
      {!productsQuery.isPending && !productsQuery.isError && products.length === 0 ? <GlassCard>
        <GlassEmptyState icon={<Package aria-hidden className="size-6" />} title={productsText.empty.title} description={productsText.empty.description} action={<GlassButton onClick={openCreate}><Plus aria-hidden className="size-4" />{productsText.empty.cta}</GlassButton>} />
      </GlassCard> : null}
      {!productsQuery.isPending && !productsQuery.isError && products.length > 0 ? <div className="flex flex-col gap-4">
        {active.length > 0 ? <div className="flex flex-col gap-2">{active.map((product) => <ProductRow key={product.id} product={product} onClick={() => openDetail(product)} />)}</div> : null}
        {archived.length > 0 ? <div className="flex flex-col gap-2">
          <h3 className="px-1 text-xs font-light tracking-wide text-zinc-500 uppercase">{productsText.archivedSection}</h3>
          {archived.map((product) => <ProductRow key={product.id} product={product} archived onClick={() => openDetail(product)} />)}
        </div> : null}
      </div> : null}
      <ProductDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        product={selected}
        onEdit={() => {
          setDetailOpen(false)
          if (selected !== null) openEdit(selected)
        }}
      />
      <ProductFormSheet open={formOpen} onOpenChange={setFormOpen} product={editing} />
    </section>
  )
}

function ProductRow({ product, archived = false, onClick }: { product: Product; archived?: boolean; onClick: () => void }) {
  const stock = `${product.stockQty} ${product.unit}`
  const stockBadgeClass = product.stockQty <= 0
    ? 'text-expense bg-expense/10 border-expense/25'
    : 'text-income bg-income/10 border-income/25'

  return (
    <GlassButton
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto min-h-16 w-full items-center justify-between gap-3 px-3.5 py-3 text-left border border-glass-border/70 bg-glass hover:bg-glass-hover hover:border-glass-border rounded-2xl',
        archived && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25 shadow-[0_0_10px_rgba(0,122,255,0.15)]">
          <IosPackageIcon size={20} className="shrink-0" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">{product.name}</span>
            <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums', stockBadgeClass)}>
              {stock}
            </span>
          </div>
          <span className="block truncate text-xs text-muted-foreground">
            {product.sku ? `SKU: ${product.sku}` : productsText.labels.skuMissing}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="block text-sm font-extrabold text-foreground tabular-nums">{formatIDR(product.salePrice)}</span>
        <span className="block text-[11px] text-muted-foreground tabular-nums">Modal: {formatIDR(product.costPrice)}</span>
      </div>
    </GlassButton>
  )
}

function ScreenSkeleton() {
  return <div aria-hidden className="flex flex-col gap-2">
    <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
    <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
    <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
  </div>
}
