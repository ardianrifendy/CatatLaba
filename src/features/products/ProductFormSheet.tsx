import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Product } from '@/db/local/schema'
import { productsText } from '@/lib/ui-text'
import { useLanguageStore } from '@/stores/language'
import { GlassAmountInput } from '@/components/ui/GlassAmountInput'
import { GlassBottomSheet, GlassBottomSheetContent, GlassBottomSheetTitle } from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassField } from '@/components/ui/GlassField'
import { GlassInput } from '@/components/ui/GlassInput'
import { collectProductFieldErrors, productFormSchema, type ProductFormErrors, type ProductFormValues } from './schemas'
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from './use-product-mutations'

type Props = { open: boolean; onOpenChange: (open: boolean) => void; product: Product | null }

export function ProductFormSheet({ open, onOpenChange, product }: Props) {
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const pending = create.isPending || update.isPending || remove.isPending

  function save(values: ProductFormValues): void {
    if (product === null) {
      create.mutate(values, { onSuccess: () => onOpenChange(false) })
    } else {
      update.mutate(
        { id: product.id, patch: values, success: productsText.toasts.updated },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  function archive(): void {
    if (product === null) return
    update.mutate(
      {
        id: product.id,
        patch: { isArchived: !product.isArchived },
        success: product.isArchived ? productsText.toasts.unarchived : productsText.toasts.archived,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  function deleteProduct(): void {
    if (product === null) return
    remove.mutate({ id: product.id }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <GlassBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && pending) return
        onOpenChange(nextOpen)
      }}
    >
      <GlassBottomSheetContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <GlassBottomSheetTitle className="mb-4 text-base font-semibold text-foreground">
          {product === null ? productsText.form.createTitle : productsText.form.editTitle}
        </GlassBottomSheetTitle>
        <ProductFormBody key={product?.id ?? 'new'} product={product} pending={pending} onSave={save} onArchive={archive} onDelete={deleteProduct} />
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}

type BodyProps = { product: Product | null; pending: boolean; onSave: (values: ProductFormValues) => void; onArchive: () => void; onDelete: () => void }

function ProductFormBody({ product, pending, onSave, onArchive, onDelete }: BodyProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'pcs')
  const [salePrice, setSalePrice] = useState<number | null>(product?.salePrice ?? 0)
  const [stockQty, setStockQty] = useState<number>(product?.stockQty ?? 0)
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  function clear(field: keyof ProductFormErrors): void {
    if (errors[field] !== undefined) setErrors((old) => ({ ...old, [field]: undefined }))
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (pending) return
    const parsed = productFormSchema.safeParse({ name, sku, unit, salePrice, stockQty })
    if (!parsed.success) {
      setErrors(collectProductFieldErrors(parsed.error))
      return
    }
    setErrors({})
    onSave(parsed.data)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <GlassField label={productsText.form.nameLabel} htmlFor="product-name" error={errors.name ?? null}>
        <GlassInput id="product-name" value={name} onChange={(event) => { setName(event.target.value); clear('name') }} placeholder={productsText.form.namePlaceholder} maxLength={80} autoComplete="off" disabled={pending} error={errors.name !== undefined} />
      </GlassField>

      <div className="grid grid-cols-2 gap-3">
        <GlassField label={useLanguageStore.getState().lang === 'en' ? 'Current Product Stock' : 'Stok Produk Saat Ini'} htmlFor="product-stock" error={errors.stockQty ?? null}>
          <GlassInput id="product-stock" type="number" min={0} value={stockQty.toString()} onChange={(event) => { setStockQty(Math.max(0, parseInt(event.target.value || '0', 10))); clear('stockQty') }} placeholder="0" disabled={pending} error={errors.stockQty !== undefined} />
        </GlassField>

        <GlassField label={productsText.form.unitLabel} htmlFor="product-unit" error={errors.unit ?? null}>
          <GlassInput id="product-unit" value={unit} onChange={(event) => { setUnit(event.target.value); clear('unit') }} placeholder={productsText.form.unitPlaceholder} maxLength={20} autoComplete="off" disabled={pending} error={errors.unit !== undefined} />
        </GlassField>
      </div>

      <GlassField label={productsText.form.skuLabel} htmlFor="product-sku" error={errors.sku ?? null}>
        <GlassInput id="product-sku" value={sku} onChange={(event) => { setSku(event.target.value); clear('sku') }} placeholder={productsText.form.skuPlaceholder} maxLength={60} autoComplete="off" disabled={pending} error={errors.sku !== undefined} />
      </GlassField>

      <GlassField label={productsText.form.salePriceLabel} htmlFor="product-sale-price" error={errors.salePrice ?? null}>
        <GlassAmountInput id="product-sale-price" value={salePrice} onChange={(value) => { setSalePrice(value); clear('salePrice') }} placeholder={productsText.form.salePricePlaceholder} disabled={pending} error={errors.salePrice !== undefined} />
      </GlassField>

      <GlassButton type="submit" className="w-full mt-2" disabled={pending} aria-busy={pending}>
        {pending ? productsText.form.pending : productsText.form.save}
      </GlassButton>

      {product !== null ? (
        <div className="grid grid-cols-2 gap-3">
          <GlassButton variant="ghost" onClick={onArchive} disabled={pending}>
            {product.isArchived ? <ArchiveRestore aria-hidden className="size-4" /> : <Archive aria-hidden className="size-4" />}
            {product.isArchived ? productsText.form.unarchive : productsText.form.archive}
          </GlassButton>
          <GlassButton variant="danger" onClick={() => setConfirmOpen(true)} disabled={pending}>
            <Trash2 aria-hidden className="size-4" />
            {productsText.form.delete}
          </GlassButton>
        </div>
      ) : null}

      {product !== null ? (
        <GlassConfirmSheet open={confirmOpen} onOpenChange={setConfirmOpen} title={productsText.confirmDelete.title} description={productsText.confirmDelete.description(product.name)} confirmLabel={productsText.confirmDelete.confirm} destructive loading={pending} onConfirm={() => { setConfirmOpen(false); onDelete() }} />
      ) : null}
    </form>
  )
}
