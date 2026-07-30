import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Wallet } from '@/db/local/schema'
import { walletsText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'
import { GlassAmountInput } from '@/components/ui/GlassAmountInput'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassField } from '@/components/ui/GlassField'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import {
  collectFieldErrors,
  walletFormSchema,
  type WalletFormErrors,
  type WalletFormValues,
} from './schemas'
import { useCreateWallet, useDeleteWallet, useUpdateWallet } from './use-wallet-mutations'
import { walletTypeOptions, type WalletType } from './wallet-types'

type WalletFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = create mode; a wallet = edit mode (with archive/delete actions). */
  wallet: Wallet | null
  /** True when any non-deleted transaction references the wallet — blocks delete. */
  walletHasTransactions: (walletId: string) => boolean
}

/**
 * Create/edit bottom sheet. Mutations live in this outer component (it stays
 * mounted while the screen lives, so optimistic callbacks always run); form
 * state lives in the body, which Radix unmounts on close — every open starts
 * from a fresh snapshot of the wallet.
 */
export function WalletFormSheet({
  open,
  onOpenChange,
  wallet,
  walletHasTransactions,
}: WalletFormSheetProps) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const deleteWallet = useDeleteWallet()

  function handleSave(values: WalletFormValues): void {
    if (wallet === null) {
      createWallet.mutate(values)
    } else {
      updateWallet.mutate({
        id: wallet.id,
        patch: values,
        successMessage: walletsText.toasts.updated,
      })
    }
    // Optimistic UX: close immediately; the toast reports the outcome.
    onOpenChange(false)
  }

  function handleToggleArchive(target: Wallet): void {
    updateWallet.mutate({
      id: target.id,
      patch: { isArchived: !target.isArchived },
      successMessage: target.isArchived
        ? walletsText.toasts.unarchived
        : walletsText.toasts.archived,
    })
    onOpenChange(false)
  }

  function handleDelete(target: Wallet): void {
    // Re-check at confirm time: a wallet referenced by any transaction must be
    // archived, never deleted (its history keeps balances honest).
    if (walletHasTransactions(target.id)) {
      toast.error(walletsText.toasts.deleteBlocked)
      onOpenChange(false)
      return
    }
    deleteWallet.mutate({ id: target.id })
    onOpenChange(false)
  }

  return (
    <GlassBottomSheet open={open} onOpenChange={onOpenChange}>
      <GlassBottomSheetContent aria-describedby={undefined}>
        <GlassBottomSheetTitle className="mb-4 text-base font-medium text-foreground font-semibold">
          {wallet === null ? walletsText.form.createTitle : walletsText.form.editTitle}
        </GlassBottomSheetTitle>
        <WalletFormBody
          wallet={wallet}
          onSave={handleSave}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
          walletHasTransactions={walletHasTransactions}
        />
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}

type WalletFormBodyProps = {
  wallet: Wallet | null
  onSave: (values: WalletFormValues) => void
  onToggleArchive: (wallet: Wallet) => void
  onDelete: (wallet: Wallet) => void
  walletHasTransactions: (walletId: string) => boolean
}

function WalletFormBody({
  wallet,
  onSave,
  onToggleArchive,
  onDelete,
  walletHasTransactions,
}: WalletFormBodyProps) {
  const [name, setName] = useState(wallet?.name ?? '')
  const [type, setType] = useState<WalletType>(wallet?.type ?? 'cash')
  const [initialBalance, setInitialBalance] = useState<number | null>(
    wallet?.initialBalance ?? null,
  )
  const [errors, setErrors] = useState<WalletFormErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  function clearError(field: keyof WalletFormErrors): void {
    if (errors[field] !== undefined) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const parsed = walletFormSchema.safeParse({ name, type, initialBalance })
    if (!parsed.success) {
      setErrors(collectFieldErrors<keyof WalletFormErrors>(parsed.error))
      return
    }
    onSave(parsed.data)
  }

  function handleDeletePressed(): void {
    if (wallet === null) return
    // Blocked wallets get the explanatory toast right away — no confirm sheet.
    if (walletHasTransactions(wallet.id)) {
      toast.error(walletsText.toasts.deleteBlocked)
      return
    }
    setConfirmOpen(true)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <GlassField
        label={walletsText.form.nameLabel}
        htmlFor="wallet-name"
        error={errors.name ?? null}
      >
        <GlassInput
          id="wallet-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            clearError('name')
          }}
          placeholder={walletsText.form.namePlaceholder}
          maxLength={40}
          autoComplete="off"
          error={errors.name !== undefined}
        />
      </GlassField>

      <GlassField label={walletsText.form.typeLabel}>
        <GlassSegmented
          value={type}
          onChange={setType}
          options={walletTypeOptions}
          aria-label={walletsText.form.typeLabel}
        />
      </GlassField>

      <GlassField
        label={walletsText.form.initialBalanceLabel}
        htmlFor="wallet-initial-balance"
        error={errors.initialBalance ?? null}
        hint={walletsText.form.initialBalanceHint}
      >
        <GlassAmountInput
          id="wallet-initial-balance"
          value={initialBalance}
          onChange={(value) => {
            setInitialBalance(value)
            clearError('initialBalance')
          }}
          placeholder={walletsText.form.initialBalancePlaceholder}
          error={errors.initialBalance !== undefined}
        />
      </GlassField>

      <GlassButton type="submit" className="w-full">
        {walletsText.form.save}
      </GlassButton>

      {wallet !== null ? (
        <div className="grid grid-cols-2 gap-3">
          <GlassButton variant="ghost" onClick={() => onToggleArchive(wallet)}>
            {wallet.isArchived ? (
              <ArchiveRestore aria-hidden className="size-4" />
            ) : (
              <Archive aria-hidden className="size-4" />
            )}
            {wallet.isArchived ? walletsText.form.unarchive : walletsText.form.archive}
          </GlassButton>
          <GlassButton variant="danger" onClick={handleDeletePressed}>
            <Trash2 aria-hidden className="size-4" />
            {walletsText.form.delete}
          </GlassButton>
        </div>
      ) : null}

      {wallet !== null ? (
        <GlassConfirmSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={walletsText.confirmDelete.title}
          description={walletsText.confirmDelete.description(wallet.name)}
          confirmLabel={walletsText.confirmDelete.confirm}
          destructive
          onConfirm={() => {
            setConfirmOpen(false)
            onDelete(wallet)
          }}
        />
      ) : null}
    </form>
  )
}
