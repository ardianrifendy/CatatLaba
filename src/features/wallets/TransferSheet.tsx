import { ArrowLeftRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Wallet } from '@/db/local/schema'
import { formatIDR } from '@/lib/format'
import { nowIso } from '@/lib/time'
import { walletsText } from '@/lib/ui-text'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import { GlassAmountInput } from '@/components/ui/GlassAmountInput'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassField } from '@/components/ui/GlassField'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSelect, type GlassSelectOption } from '@/components/ui/GlassSelect'
import {
  collectFieldErrors,
  transferFormSchema,
  type TransferFormErrors,
} from './schemas'
import { useCreateTransfer, type TransferInput } from './use-wallet-mutations'
import { WalletTypeIcon } from './wallet-types'

type TransferSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Non-archived wallets only — transfers move money between active wallets. */
  activeWallets: Wallet[]
  /** Derived balances (initial balance + transactions) keyed by wallet id. */
  balances: Map<string, number>
}

/**
 * Transfer bottom sheet. The mutation lives here (stays mounted so optimistic
 * callbacks always run); form state lives in the body, which unmounts on close.
 */
export function TransferSheet({ open, onOpenChange, activeWallets, balances }: TransferSheetProps) {
  const createTransfer = useCreateTransfer()

  function handleSubmit(input: TransferInput): void {
    createTransfer.mutate(input)
    // Optimistic UX: close immediately; the toast reports the outcome.
    onOpenChange(false)
  }

  return (
    <GlassBottomSheet open={open} onOpenChange={onOpenChange}>
      <GlassBottomSheetContent aria-describedby={undefined}>
        <GlassBottomSheetTitle className="mb-4 text-base font-medium text-zinc-100">
          {walletsText.transfer.title}
        </GlassBottomSheetTitle>
        <TransferFormBody
          activeWallets={activeWallets}
          balances={balances}
          onSubmit={handleSubmit}
        />
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}

type TransferFormBodyProps = {
  activeWallets: Wallet[]
  balances: Map<string, number>
  onSubmit: (input: TransferInput) => void
}

function TransferFormBody({ activeWallets, balances, onSubmit }: TransferFormBodyProps) {
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<TransferFormErrors>({})

  function clearError(field: keyof TransferFormErrors): void {
    if (errors[field] !== undefined) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const walletOptions: GlassSelectOption[] = activeWallets.map((wallet) => ({
    value: wallet.id,
    label: wallet.name,
    // Current derived balance as the option hint.
    hint: formatIDR(balances.get(wallet.id) ?? wallet.initialBalance),
    icon: <WalletTypeIcon type={wallet.type} className="size-4" />,
  }))
  // The chosen source can never be the destination.
  const destinationOptions = walletOptions.filter((option) => option.value !== fromId)

  function handleFromChange(value: string): void {
    setFromId(value)
    // Source now equals the chosen destination — clear the destination.
    if (value === toId) setToId(null)
    clearError('fromWalletId')
  }

  const sourceBalance = fromId !== null ? (balances.get(fromId) ?? 0) : null
  // Non-blocking: overdrawing is allowed, but warn about it (warning token).
  const showInsufficientWarning =
    sourceBalance !== null && amount !== null && amount > sourceBalance

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const parsed = transferFormSchema.safeParse({
      fromWalletId: fromId ?? '',
      toWalletId: toId ?? '',
      amount,
      note,
    })
    if (!parsed.success) {
      setErrors(collectFieldErrors<keyof TransferFormErrors>(parsed.error))
      return
    }
    const fromWallet = activeWallets.find((wallet) => wallet.id === parsed.data.fromWalletId)
    const toWallet = activeWallets.find((wallet) => wallet.id === parsed.data.toWalletId)
    if (fromWallet === undefined || toWallet === undefined) return
    onSubmit({
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      amount: parsed.data.amount,
      note: parsed.data.note === '' ? null : parsed.data.note,
      occurredAt: nowIso(),
      fromWalletName: fromWallet.name,
      toWalletName: toWallet.name,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <GlassField
        label={walletsText.transfer.fromLabel}
        htmlFor="transfer-from"
        error={errors.fromWalletId ?? null}
      >
        <GlassSelect
          id="transfer-from"
          value={fromId}
          onChange={handleFromChange}
          options={walletOptions}
          placeholder={walletsText.transfer.fromPlaceholder}
          title={walletsText.transfer.fromSheetTitle}
          error={errors.fromWalletId !== undefined}
        />
      </GlassField>

      <GlassField
        label={walletsText.transfer.toLabel}
        htmlFor="transfer-to"
        error={errors.toWalletId ?? null}
      >
        <GlassSelect
          id="transfer-to"
          value={toId}
          onChange={(value) => {
            setToId(value)
            clearError('toWalletId')
          }}
          options={destinationOptions}
          placeholder={walletsText.transfer.toPlaceholder}
          title={walletsText.transfer.toSheetTitle}
          error={errors.toWalletId !== undefined}
        />
      </GlassField>

      <div className="flex flex-col gap-1.5">
        <GlassField
          label={walletsText.transfer.amountLabel}
          htmlFor="transfer-amount"
          error={errors.amount ?? null}
        >
          <GlassAmountInput
            id="transfer-amount"
            value={amount}
            onChange={(value) => {
              setAmount(value)
              clearError('amount')
            }}
            error={errors.amount !== undefined}
          />
        </GlassField>
        {showInsufficientWarning ? (
          <p role="status" className="text-xs text-warning">
            {walletsText.transfer.insufficientWarning}
          </p>
        ) : null}
      </div>

      <GlassField
        label={walletsText.transfer.noteLabel}
        htmlFor="transfer-note"
        error={errors.note ?? null}
      >
        <GlassInput
          id="transfer-note"
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
            clearError('note')
          }}
          placeholder={walletsText.transfer.notePlaceholder}
          maxLength={200}
          autoComplete="off"
          error={errors.note !== undefined}
        />
      </GlassField>

      <GlassButton type="submit" className="w-full">
        <ArrowLeftRight aria-hidden className="size-4" />
        {walletsText.transfer.submit}
      </GlassButton>
    </form>
  )
}
