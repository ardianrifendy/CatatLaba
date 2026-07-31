import { useEffect, useState, type FormEvent } from 'react'
import type { Category, Channel, Product, Transaction, TransactionItem, Wallet } from '@/db/local/schema'
import { GlassAmountInput } from '@/components/ui/GlassAmountInput'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassField } from '@/components/ui/GlassField'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import { GlassSelect, type GlassSelectOption } from '@/components/ui/GlassSelect'
import { transactionsText } from '@/lib/ui-text'
import { formatIDR } from '@/lib/format'
import {
  collectTransactionErrors,
  TRANSACTION_NONE,
  transactionItemFormSchema,
  transactionFormSchema,
  type TransactionFormErrors,
  type TransactionFormValues,
} from './schemas'

type TransactionFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Transaction | null
  wallets: readonly Wallet[]
  categories: readonly Category[]
  channels: readonly Channel[]
  products: readonly Product[]
  initialItems: readonly TransactionItem[]
  pending: boolean
  itemsLoading?: boolean
  itemsError?: boolean
  onRetryItems?: () => void
  onSubmit: (values: TransactionFormValues & { occurredAt: string }) => void
  onDelete: () => void
}

const typeOptions: ReadonlyArray<{ value: Transaction['type']; label: string }> = [
  { value: 'expense', label: transactionsText.filters.expense },
  { value: 'income', label: transactionsText.filters.income },
  { value: 'transfer', label: transactionsText.filters.transfer },
]

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function localDate(iso: string): string {
  const instant = new Date(iso)
  const safeInstant = Number.isNaN(instant.getTime()) ? new Date() : instant
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(safeInstant)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return year !== undefined && month !== undefined && day !== undefined
    ? `${year}-${month}-${day}`
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(safeInstant)
}

function toOccurredAt(date: string): string {
  const match = CALENDAR_DATE.exec(date)
  if (match === null) throw new RangeError('Date must use YYYY-MM-DD.')
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const candidate = new Date(Date.UTC(year, month - 1, day))
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new RangeError('Date must be a real calendar date.')
  }
  // Store the selected calendar date at midnight Asia/Jakarta in UTC.
  return new Date(Date.UTC(year, month - 1, day, -7)).toISOString()
}

export function TransactionFormSheet({
  open,
  onOpenChange,
  editing,
  wallets,
  categories,
  channels,
  products,
  initialItems,
  pending,
  itemsLoading = false,
  itemsError = false,
  onRetryItems,
  onSubmit,
  onDelete,
}: TransactionFormSheetProps) {
  const [type, setType] = useState<Transaction['type']>(editing?.type ?? 'expense')
  const [amount, setAmount] = useState<number | null>(editing?.amount ?? null)
  const [walletId, setWalletId] = useState(editing?.walletId ?? '')
  const [counterWalletId, setCounterWalletId] = useState(editing?.counterWalletId ?? '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [channelId, setChannelId] = useState(editing?.channelId ?? TRANSACTION_NONE)
  const [date, setDate] = useState(localDate(editing?.occurredAt ?? new Date().toISOString()))
  const [note, setNote] = useState(editing?.note ?? '')
  const [items, setItems] = useState<TransactionFormValues['items']>(() =>
    initialItems.map(({ productId, qty, unitPrice }) => ({ productId, qty, unitPrice })),
  )
  const [productId, setProductId] = useState('')
  const [itemQty, setItemQty] = useState('')
  const [itemUnitPrice, setItemUnitPrice] = useState<number | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)
  const [errors, setErrors] = useState<TransactionFormErrors>({})

  const walletOptions: GlassSelectOption[] = wallets
    .filter((wallet) => !wallet.isArchived)
    .map((wallet) => ({ value: wallet.id, label: wallet.name }))
  const counterWalletOptions = walletOptions.filter((wallet) => wallet.value !== walletId)
  const categoryOptions: GlassSelectOption[] = categories
    .filter((category) => category.type === type)
    .map((category) => ({
      value: category.id,
      label: category.parentId === null ? category.name : `↳ ${category.name}`,
      icon: category.icon === null ? undefined : <span>{category.icon}</span>,
    }))
  const channelOptions: GlassSelectOption[] = [
    { value: TRANSACTION_NONE, label: transactionsText.form.optionalNone },
    ...channels
      .filter((channel) => !channel.isArchived)
      .map((channel) => ({ value: channel.id, label: channel.name })),
  ]
  const productOptions: GlassSelectOption[] = products
    .filter((product) => !product.isArchived)
    .map((product) => ({ value: product.id, label: `${product.name} (${product.unit})` }))
  const itemsTotal = items.reduce((total, item) => total + item.qty * item.unitPrice, 0)
  const itemsReady = editing === null || (!itemsLoading && !itemsError)
  const formDisabled = pending || !itemsReady
  const submitDisabled = pending || !itemsReady

  useEffect(() => {
    if (type !== 'transfer' && items.length > 0 && amount !== itemsTotal) {
      setAmount(itemsTotal)
      setErrors((current) => (
        current.amount === undefined ? current : { ...current, amount: undefined }
      ))
    }
  }, [amount, items.length, itemsTotal, type])

  function clearError(field: keyof TransactionFormErrors): void {
    if (errors[field] !== undefined) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleTypeChange(next: Transaction['type']): void {
    if (next === type) return
    setType(next)
    setCategoryId('')
    setCounterWalletId('')
    if (next === 'transfer') setItems([])
    setItemError(null)
    setErrors({})
  }

  function addItem(): void {
    if (pending || type === 'transfer') return
    const parsed = transactionItemFormSchema.safeParse({
      productId,
      qty: itemQty === '' ? undefined : Number(itemQty),
      unitPrice: itemUnitPrice,
    })
    if (!parsed.success) {
      setItemError(parsed.error.issues[0]?.message ?? transactionsText.validation.productRequired)
      return
    }
    if (items.some((item) => item.productId === parsed.data.productId)) {
      setItemError(transactionsText.validation.duplicateProduct)
      return
    }
    setItems((current) => [...current, parsed.data])
    setProductId('')
    setItemQty('')
    setItemUnitPrice(null)
    setItemError(null)
    clearError('items')
  }

  function chooseProduct(nextProductId: string): void {
    setProductId(nextProductId)
    const product = products.find((item) => item.id === nextProductId)
    if (product !== undefined) setItemUnitPrice(type === 'income' ? product.salePrice : product.costPrice)
    setItemError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (pending || !itemsReady) return
    const parsed = transactionFormSchema.safeParse({
      type,
      amount,
      walletId,
      counterWalletId,
      categoryId,
      channelId: channelId === TRANSACTION_NONE ? '' : channelId,
      date,
      note,
      items,
    })
    if (!parsed.success) {
      setErrors(collectTransactionErrors(parsed.error))
      return
    }
    onSubmit({ ...parsed.data, occurredAt: toOccurredAt(parsed.data.date) })
  }

  return (
    <GlassBottomSheet open={open} onOpenChange={onOpenChange}>
      <GlassBottomSheetContent aria-describedby={undefined} className="max-h-[90dvh] overflow-y-auto">
        <GlassBottomSheetTitle className="mb-4 text-base font-semibold text-foreground">
          {editing === null ? transactionsText.form.createTitle : transactionsText.form.editTitle}
        </GlassBottomSheetTitle>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <GlassField label={transactionsText.form.typeLabel}>
            <GlassSegmented
              value={type}
              onChange={handleTypeChange}
              options={typeOptions}
              disabled={formDisabled}
              aria-label={transactionsText.form.typeLabel}
            />
          </GlassField>

          <GlassField label={transactionsText.form.amountLabel} htmlFor="transaction-amount" error={errors.amount ?? null}>
            <GlassAmountInput
              id="transaction-amount"
              value={amount}
              onChange={(value) => {
                setAmount(value)
                clearError('amount')
              }}
              error={errors.amount !== undefined}
              disabled={formDisabled}
            />
          </GlassField>

          {type !== 'transfer' ? (
            <GlassField
              label={transactionsText.form.itemsLabel}
              error={errors.items ?? itemError}
              hint={items.length === 0 ? transactionsText.form.noItems : undefined}
            >
              <div className="flex flex-col gap-3">
                {editing !== null && itemsLoading ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Memuat detail produk transaksi…
                  </p>
                ) : null}
                {editing !== null && itemsError ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-expense/40 bg-expense/10 p-3">
                    <p role="alert" className="text-sm text-foreground">
                      Detail produk gagal dimuat. Simpan dinonaktifkan.
                    </p>
                    {onRetryItems !== undefined ? (
                      <GlassButton type="button" variant="ghost" onClick={onRetryItems} disabled={pending}>
                        Coba lagi
                      </GlassButton>
                    ) : null}
                  </div>
                ) : null}
                {items.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {items.map((item) => {
                      const product = products.find((candidate) => candidate.id === item.productId)
                      return (
                        <li key={item.productId} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-glass-border bg-glass p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{product?.name ?? item.productId}</p>
                            <p className="text-xs text-muted-foreground">{item.qty} × {formatIDR(item.unitPrice)} · {formatIDR(item.qty * item.unitPrice)}</p>
                          </div>
                          <GlassButton
                            type="button"
                            variant="ghost"
                            className="h-9 px-3 text-xs"
                            disabled={formDisabled}
                            onClick={() => {
                              setItems((current) => current.filter((candidate) => candidate.productId !== item.productId))
                              clearError('items')
                            }}
                          >
                            {transactionsText.form.removeItem}
                          </GlassButton>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <GlassSelect
                    value={productId === '' ? null : productId}
                    onChange={chooseProduct}
                    options={productOptions}
                    placeholder={transactionsText.form.productPlaceholder}
                    title={transactionsText.form.productSheetTitle}
                    searchable
                    disabled={formDisabled}
                  />
                  <GlassInput
                    value={itemQty}
                    onChange={(event) => {
                      setItemQty(event.target.value.replace(/\D/g, ''))
                      setItemError(null)
                    }}
                    placeholder={transactionsText.form.quantityPlaceholder}
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={formDisabled}
                    aria-label={transactionsText.form.quantityLabel}
                  />
                  <GlassAmountInput
                    value={itemUnitPrice}
                    onChange={(value) => {
                      setItemUnitPrice(value)
                      setItemError(null)
                    }}
                    placeholder={transactionsText.form.unitPriceLabel}
                    disabled={formDisabled}
                  />
                </div>
                <GlassButton type="button" variant="ghost" onClick={addItem} disabled={formDisabled}>
                  {transactionsText.form.addItem}
                </GlassButton>
                {items.length > 0 ? (
                  <p className="text-right text-sm font-bold tabular-nums text-foreground">
                    {transactionsText.form.itemsTotal}: {formatIDR(itemsTotal)}
                  </p>
                ) : null}
              </div>
            </GlassField>
          ) : null}

          <GlassField label={transactionsText.form.walletLabel} htmlFor="transaction-wallet" error={errors.walletId ?? null}>
            <GlassSelect
              id="transaction-wallet"
              value={walletId === '' ? null : walletId}
              onChange={(value) => {
                setWalletId(value)
                if (value === counterWalletId) setCounterWalletId('')
                clearError('walletId')
              }}
              options={walletOptions}
              placeholder={transactionsText.form.walletPlaceholder}
              title={transactionsText.form.walletSheetTitle}
              searchable
              disabled={formDisabled}
              error={errors.walletId !== undefined}
            />
          </GlassField>

          {type === 'transfer' ? (
            <GlassField label={transactionsText.form.counterWalletLabel} htmlFor="transaction-counter-wallet" error={errors.counterWalletId ?? null}>
              <GlassSelect
                id="transaction-counter-wallet"
                value={counterWalletId === '' ? null : counterWalletId}
                onChange={(value) => {
                  setCounterWalletId(value)
                  clearError('counterWalletId')
                }}
                options={counterWalletOptions}
                placeholder={transactionsText.form.counterWalletPlaceholder}
                title={transactionsText.form.counterWalletSheetTitle}
                searchable
                disabled={formDisabled || walletId === ''}
                error={errors.counterWalletId !== undefined}
              />
            </GlassField>
          ) : (
            <GlassField label={transactionsText.form.categoryLabel} htmlFor="transaction-category" error={errors.categoryId ?? null}>
              <GlassSelect
                id="transaction-category"
                value={categoryId === '' ? null : categoryId}
                onChange={(value) => {
                  setCategoryId(value)
                  clearError('categoryId')
                }}
                options={categoryOptions}
                placeholder={transactionsText.form.categoryPlaceholder}
                title={transactionsText.form.categorySheetTitle}
                searchable
                disabled={formDisabled}
                error={errors.categoryId !== undefined}
              />
            </GlassField>
          )}

          {type !== 'transfer' ? (
            <GlassField label={transactionsText.form.channelLabel} htmlFor="transaction-channel">
              <GlassSelect
                id="transaction-channel"
                value={channelId}
                onChange={setChannelId}
                options={channelOptions}
                placeholder={transactionsText.form.channelPlaceholder}
                title={transactionsText.form.channelSheetTitle}
                searchable
                disabled={formDisabled}
              />
            </GlassField>
          ) : null}

          <GlassField label={transactionsText.form.dateLabel} htmlFor="transaction-date" error={errors.date ?? null}>
            <GlassInput
              id="transaction-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                clearError('date')
              }}
              error={errors.date !== undefined}
              disabled={formDisabled}
            />
          </GlassField>

          <GlassField label={transactionsText.form.noteLabel} htmlFor="transaction-note" error={errors.note ?? null}>
            <GlassInput
              id="transaction-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
                clearError('note')
              }}
              placeholder={transactionsText.form.notePlaceholder}
              maxLength={200}
              autoComplete="off"
              error={errors.note !== undefined}
              disabled={formDisabled}
            />
          </GlassField>

          <div className="grid grid-cols-2 gap-3">
            <GlassButton variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              {transactionsText.form.cancel}
            </GlassButton>
            <GlassButton type="submit" disabled={submitDisabled}>
              {editing === null ? transactionsText.form.save : transactionsText.form.update}
            </GlassButton>
          </div>
          {editing !== null ? (
            <GlassButton type="button" variant="danger" onClick={onDelete} disabled={pending}>
              {transactionsText.form.delete}
            </GlassButton>
          ) : null}
        </form>
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}
