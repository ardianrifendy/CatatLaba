import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { GlassAmountInput } from '@/components/ui/GlassAmountInput'
import { GlassBottomSheet, GlassBottomSheetContent, GlassBottomSheetTitle } from '@/components/ui/GlassBottomSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassField } from '@/components/ui/GlassField'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import { GlassSelect, type GlassSelectOption } from '@/components/ui/GlassSelect'
import type { Category, Channel, RecurringRule, Wallet } from '@/db/local/schema'
import { recurringText } from '@/lib/ui-text/recurring'
import { RECURRING_NONE, collectRecurringErrors, recurringFormSchema, type RecurringFormErrors, type RecurringFormValues } from './schemas'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: RecurringRule | null
  wallets: readonly Wallet[]
  categories: readonly Category[]
  channels: readonly Channel[]
  pending: boolean
  onSave: (values: RecurringFormValues) => void
  onDelete: () => void
}

const frequencyOptions = [
  { value: 'monthly', label: recurringText.form.monthly },
  { value: 'weekly', label: recurringText.form.weekly },
] as const

const typeOptions = [
  { value: 'expense', label: recurringText.form.expense },
  { value: 'income', label: recurringText.form.income },
] as const

function dateInputValue(iso: string): string {
  return iso.slice(0, 10)
}

export function RecurringFormSheet(props: Props) {
  return (
    <GlassBottomSheet
      open={props.open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && props.pending) return
        props.onOpenChange(nextOpen)
      }}
    >
      <GlassBottomSheetContent aria-describedby={undefined} className="max-h-[90dvh] overflow-y-auto">
        <GlassBottomSheetTitle className="mb-4 text-base font-medium text-foreground font-semibold">
          {props.rule === null ? recurringText.form.createTitle : recurringText.form.editTitle}
        </GlassBottomSheetTitle>
        <RecurringFormBody key={props.rule?.id ?? 'new'} {...props} />
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}

function RecurringFormBody({ rule, wallets, categories, channels, pending, onSave, onDelete }: Props) {
  const [name, setName] = useState(rule?.name ?? '')
  const [frequency, setFrequency] = useState<RecurringRule['frequency']>(rule?.frequency ?? 'monthly')
  const [day, setDay] = useState(rule?.day.toString() ?? '')
  const [nextRunDate, setNextRunDate] = useState(rule === null ? new Date().toISOString().slice(0, 10) : dateInputValue(rule.nextRunAt))
  const [templateType, setTemplateType] = useState<RecurringRule['templateType']>(rule?.templateType ?? 'expense')
  const [templateAmount, setTemplateAmount] = useState<number | null>(rule?.templateAmount ?? null)
  const [templateWalletId, setTemplateWalletId] = useState(rule?.templateWalletId ?? '')
  const [templateCategoryId, setTemplateCategoryId] = useState(rule?.templateCategoryId ?? '')
  const [templateChannelId, setTemplateChannelId] = useState(rule?.templateChannelId ?? RECURRING_NONE)
  const [templateNote, setTemplateNote] = useState(rule?.templateNote ?? '')
  const [errors, setErrors] = useState<RecurringFormErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const walletOptions: GlassSelectOption[] = wallets.filter((wallet) => !wallet.isArchived).map((wallet) => ({ value: wallet.id, label: wallet.name }))
  const categoryOptions: GlassSelectOption[] = categories.filter((category) => category.type === templateType).map((category) => ({ value: category.id, label: category.parentId === null ? category.name : `↳ ${category.name}`, icon: category.icon === null ? undefined : <span>{category.icon}</span> }))
  const channelOptions: GlassSelectOption[] = [{ value: RECURRING_NONE, label: recurringText.form.optionalNone }, ...channels.filter((channel) => !channel.isArchived).map((channel) => ({ value: channel.id, label: channel.name }))]

  function clear(field: keyof RecurringFormErrors): void {
    if (errors[field] !== undefined) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function changeType(value: RecurringRule['templateType']): void {
    setTemplateType(value)
    setTemplateCategoryId('')
    clear('templateType')
    clear('templateCategoryId')
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (pending) return
    const parsed = recurringFormSchema.safeParse({ name, frequency, day: day === '' ? undefined : Number(day), nextRunDate, templateType, templateAmount, templateWalletId, templateCategoryId, templateChannelId: templateChannelId === RECURRING_NONE ? '' : templateChannelId, templateNote })
    if (!parsed.success) {
      setErrors(collectRecurringErrors(parsed.error))
      return
    }
    if (!categoryOptions.some((category) => category.value === parsed.data.templateCategoryId)) {
      setErrors((current) => ({ ...current, templateCategoryId: recurringText.validation.categoryInvalid }))
      return
    }
    setErrors({})
    onSave(parsed.data)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <GlassField label={recurringText.form.nameLabel} htmlFor="recurring-name" error={errors.name ?? null}>
        <GlassInput id="recurring-name" value={name} onChange={(event) => { setName(event.target.value); clear('name') }} placeholder={recurringText.form.namePlaceholder} maxLength={80} autoComplete="off" disabled={pending} error={errors.name !== undefined} />
      </GlassField>
      <GlassField label={recurringText.form.frequencyLabel}>
        <GlassSegmented value={frequency} onChange={(value) => { setFrequency(value); clear('day') }} options={frequencyOptions} disabled={pending} aria-label={recurringText.form.frequencyLabel} />
      </GlassField>
      <GlassField label={recurringText.form.dayLabel} htmlFor="recurring-day" error={errors.day ?? null} hint={frequency === 'monthly' ? recurringText.form.monthlyDayHint : recurringText.form.weeklyDayHint}>
        <GlassInput id="recurring-day" value={day} onChange={(event) => { setDay(event.target.value.replace(/\D/g, '')); clear('day') }} inputMode="numeric" maxLength={2} autoComplete="off" disabled={pending} error={errors.day !== undefined} />
      </GlassField>
      <GlassField label={recurringText.form.nextRunAtLabel} htmlFor="recurring-next-run" error={errors.nextRunDate ?? null} hint={recurringText.form.nextRunAtHint}>
        <GlassInput id="recurring-next-run" value={nextRunDate} onChange={(event) => { setNextRunDate(event.target.value); clear('nextRunDate') }} placeholder={recurringText.form.nextRunAtPlaceholder} inputMode="numeric" maxLength={10} autoComplete="off" disabled={pending} error={errors.nextRunDate !== undefined} />
      </GlassField>
      <GlassField label={recurringText.form.typeLabel}>
        <GlassSegmented value={templateType} onChange={changeType} options={typeOptions} disabled={pending} aria-label={recurringText.form.typeLabel} />
      </GlassField>
      <GlassField label={recurringText.form.amountLabel} htmlFor="recurring-amount" error={errors.templateAmount ?? null}>
        <GlassAmountInput id="recurring-amount" value={templateAmount} onChange={(value) => { setTemplateAmount(value); clear('templateAmount') }} disabled={pending} error={errors.templateAmount !== undefined} />
      </GlassField>
      <GlassField label={recurringText.form.walletLabel} htmlFor="recurring-wallet" error={errors.templateWalletId ?? null} hint={walletOptions.length === 0 ? recurringText.noWallets : undefined}>
        <GlassSelect id="recurring-wallet" value={templateWalletId === '' ? null : templateWalletId} onChange={(value) => { setTemplateWalletId(value); clear('templateWalletId') }} options={walletOptions} placeholder={recurringText.form.walletPlaceholder} title={recurringText.form.walletPickerTitle} searchable disabled={pending || walletOptions.length === 0} error={errors.templateWalletId !== undefined} />
      </GlassField>
      <GlassField label={recurringText.form.categoryLabel} htmlFor="recurring-category" error={errors.templateCategoryId ?? null} hint={categoryOptions.length === 0 ? recurringText.noCategories : undefined}>
        <GlassSelect id="recurring-category" value={templateCategoryId === '' ? null : templateCategoryId} onChange={(value) => { setTemplateCategoryId(value); clear('templateCategoryId') }} options={categoryOptions} placeholder={recurringText.form.categoryPlaceholder} title={recurringText.form.categoryPickerTitle} searchable disabled={pending || categoryOptions.length === 0} error={errors.templateCategoryId !== undefined} />
      </GlassField>
      <GlassField label={recurringText.form.channelLabel} htmlFor="recurring-channel">
        <GlassSelect id="recurring-channel" value={templateChannelId} onChange={setTemplateChannelId} options={channelOptions} placeholder={recurringText.form.channelPlaceholder} title={recurringText.form.channelPickerTitle} searchable disabled={pending} />
      </GlassField>
      <GlassField label={recurringText.form.noteLabel} htmlFor="recurring-note" error={errors.templateNote ?? null}>
        <GlassInput id="recurring-note" value={templateNote} onChange={(event) => { setTemplateNote(event.target.value); clear('templateNote') }} placeholder={recurringText.form.notePlaceholder} maxLength={200} autoComplete="off" disabled={pending} error={errors.templateNote !== undefined} />
      </GlassField>
      <GlassButton
        type="submit"
        className="w-full"
        disabled={pending || walletOptions.length === 0 || categoryOptions.length === 0}
        aria-busy={pending}
      >
        {pending ? recurringText.form.pending : recurringText.form.save}
      </GlassButton>
      {rule !== null ? <GlassButton variant="danger" onClick={() => setConfirmOpen(true)} disabled={pending}><Trash2 aria-hidden className="size-4" />{recurringText.form.delete}</GlassButton> : null}
      {rule !== null ? <GlassConfirmSheet open={confirmOpen} onOpenChange={setConfirmOpen} title={recurringText.confirmDelete.title} description={recurringText.confirmDelete.description(rule.name)} confirmLabel={recurringText.confirmDelete.confirm} destructive loading={pending} onConfirm={() => { setConfirmOpen(false); onDelete() }} /> : null}
    </form>
  )
}
