import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalActionStore } from '@/stores/action'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { useLanguageStore } from '@/stores/language'
import type { Product } from '@/db/local/schema'
import { IosPackageIcon } from '@/components/ui/IosIcons'
import { cn } from '@/lib/cn'
import { formatIDR } from '@/lib/format'
import { queryKeys, unwrap } from '@/lib/query'
import { productsText } from '@/lib/ui-text'
import { ProductDetailSheet } from './ProductDetailSheet'
import { ProductFormSheet } from './ProductFormSheet'

export function ProductsScreen({ onBack }: { onBack?: () => void }) {
  const lang = useLanguageStore((s) => s.lang)
  const isEn = lang === 'en'
  const repos = useRepos()
  const productsQuery = useQuery({
    queryKey: queryKeys.products,
    queryFn: async () => unwrap(await repos.products.list()),
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const products = productsQuery.data ?? []

  const pendingAction = useGlobalActionStore((s) => s.pendingAction)
  const clearAction = useGlobalActionStore((s) => s.clearAction)

  useEffect(() => {
    if (pendingAction === 'create-product') {
      setEditing(null)
      setFormOpen(true)
      clearAction()
    } else if (pendingAction === 'search-product') {
      setSearchOpen(true)
      clearAction()
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [pendingAction, clearAction])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return products

    return products.filter((product) => {
      const matchName = product.name.toLowerCase().includes(q)
      const matchSku = product.sku ? product.sku.toLowerCase().includes(q) : false
      return matchName || matchSku
    })
  }, [products, searchQuery])

  const active = filteredProducts.filter((product) => !product.isArchived)
  const archived = filteredProducts.filter((product) => product.isArchived)

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
        <div className="flex items-center gap-2">
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
            <span>{isEn ? 'Search' : 'Cari Produk'}</span>
          </GlassButton>

          <GlassButton variant="primary" onClick={openCreate} disabled={productsQuery.isPending} className="px-3 text-xs">
            <Plus aria-hidden className="size-4" />
            {productsText.addLabel}
          </GlassButton>
        </div>
      </div>

      {/* Search Input Bar */}
      {searchOpen || searchQuery ? (
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
          <GlassInput
            ref={searchInputRef}
            type="text"
            placeholder={isEn ? "Search product name or SKU..." : "Cari nama produk atau SKU..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 h-11"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {productsQuery.isPending ? <ScreenSkeleton /> : null}
      {productsQuery.isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-light text-zinc-400">{productsText.loadError}</p>
          <GlassButton variant="ghost" onClick={() => void productsQuery.refetch()}>
            {productsText.retry}
          </GlassButton>
        </GlassCard>
      ) : null}
      {!productsQuery.isPending && !productsQuery.isError && products.length === 0 ? (
        <GlassCard>
          <GlassEmptyState
            icon={<Package aria-hidden className="size-6" />}
            title={productsText.empty.title}
            description={productsText.empty.description}
            action={
              <GlassButton onClick={openCreate}>
                <Plus aria-hidden className="size-4" />
                {productsText.empty.cta}
              </GlassButton>
            }
          />
        </GlassCard>
      ) : null}
      {!productsQuery.isPending &&
      !productsQuery.isError &&
      products.length > 0 &&
      filteredProducts.length === 0 ? (
        <GlassCard className="py-8 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium text-foreground">{isEn ? 'Product not found' : 'Produk tidak ditemukan'}</p>
          <p className="text-xs text-muted-foreground">
            {isEn ? `No products matching "${searchQuery}".` : `Tidak ada produk yang cocok dengan "${searchQuery}".`}
          </p>
        </GlassCard>
      ) : null}

      {!productsQuery.isPending && !productsQuery.isError && filteredProducts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {active.length > 0 ? (
            <div className="flex flex-col gap-2">
              {active.map((product) => (
                <ProductRow key={product.id} product={product} onClick={() => openDetail(product)} />
              ))}
            </div>
          ) : null}
          {archived.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="px-1 text-xs font-light tracking-wide text-zinc-500 uppercase">
                {productsText.archivedSection}
              </h3>
              {archived.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  archived
                  onClick={() => openDetail(product)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
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

function ProductRow({
  product,
  archived = false,
  onClick,
}: {
  product: Product
  archived?: boolean
  onClick: () => void
}) {
  const lang = useLanguageStore((s) => s.lang)
  const isEn = lang === 'en'
  const stock = `${product.stockQty} ${product.unit}`
  const stockBadgeClass =
    product.stockQty <= 0
      ? 'text-expense bg-expense/10 border-expense/25'
      : 'text-income bg-income/10 border-income/25'

  return (
    <GlassButton
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-auto min-h-16 w-full items-center justify-between gap-3 px-3.5 py-3 text-left border border-glass-border/70 bg-glass hover:bg-glass-hover hover:border-glass-border rounded-2xl',
        archived && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25 shadow-[0_0_10px_rgba(0,122,255,0.15)]">
          <IosPackageIcon size={20} className="shrink-0" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-foreground">{product.name}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                stockBadgeClass,
              )}
            >
              {stock}
            </span>
          </div>
          <span className="block truncate text-xs text-muted-foreground">
            {product.sku ? `SKU: ${product.sku}` : productsText.labels.skuMissing}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="block text-sm font-extrabold text-foreground tabular-nums">
          {formatIDR(product.salePrice)}
        </span>
        <span className="block text-[11px] text-muted-foreground tabular-nums">
          {isEn ? 'Cost:' : 'Modal:'} {formatIDR(product.costPrice)}
        </span>
      </div>
    </GlassButton>
  )
}

function ScreenSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
      <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
      <div className="h-16 animate-pulse rounded-2xl border border-glass-border bg-glass" />
    </div>
  )
}
