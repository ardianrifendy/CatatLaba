import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
import { GlassSelect } from '@/components/ui/GlassSelect'
import type { Budget, Category } from '@/db/local/schema'
import { budgetsText } from '@/lib/ui-text'
import {
  budgetFormSchema,
  collectBudgetFieldErrors,
  type BudgetFormErrors,
  type BudgetFormValues,
} from './schemas'
import {
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from './use-budget-mutations'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: Budget | null
  defaultMonth: string
  categories: Category[]
}

export function BudgetFormSheet({
  open,
  onOpenChange,
  budget,
  defaultMonth,
  categories,
}: Props) {
  const create = useCreateBudget()
  const update = useUpdateBudget()
  const remove = useDeleteBudget()
  const pending = create.isPending || update.isPending || remove.isPending

  function save(values: BudgetFormValues): void {
    if (budget === null) {
      create.mutate(values, { onSuccess: () => onOpenChange(false) })
    } else {
      update.mutate(
        { id: budget.id, amount: values.amount },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  function deleteBudget(): void {
    if (budget === null) return
    remove.mutate(budget.id, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <GlassBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && pending) return
        onOpenChange(nextOpen)
      }}
    >
      <GlassBottomSheetContent aria-describedby={undefined}>
        <GlassBottomSheetTitle className="mb-4 text-base font-medium text-foreground font-semibold">
          {budget === null ? budgetsText.form.createTitle : budgetsText.form.editTitle}
        </GlassBottomSheetTitle>
        <BudgetFormBody
          key={budget?.id ?? `new-${defaultMonth}`}
          budget={budget}
          defaultMonth={defaultMonth}
          categories={categories}
          pending={pending}
          onSave={save}
          onDelete={deleteBudget}
        />
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}

type BodyProps = {
  budget: Budget | null
  defaultMonth: string
  categories: Category[]
  pending: boolean
  onSave: (values: BudgetFormValues) => void
  onDelete: () => void
}

function BudgetFormBody({
  budget,
  defaultMonth,
  categories,
  pending,
  onSave,
  onDelete,
}: BodyProps) {
  const expenseCategories = categories.filter((category) => category.type === 'expense')
  const selectedCategory = expenseCategories.find(
    (category) => category.id === budget?.categoryId,
  )
  const [month, setMonth] = useState(budget?.month ?? defaultMonth)
  const [categoryId, setCategoryId] = useState<string | null>(
    budget?.categoryId ?? null,
  )
  const [amount, setAmount] = useState<number | null>(budget?.amount ?? null)
  const [errors, setErrors] = useState<BudgetFormErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  function clear(field: keyof BudgetFormErrors): void {
    if (errors[field] !== undefined) {
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (pending) return
    const parsed = budgetFormSchema.safeParse({ month, categoryId: categoryId ?? '', amount })
    if (!parsed.success) {
      setErrors(collectBudgetFieldErrors(parsed.error))
      return
    }
    if (
      budget === null &&
      !expenseCategories.some((category) => category.id === parsed.data.categoryId)
    ) {
      setErrors((current) => ({
        ...current,
        categoryId: budgetsText.validation.categoryInvalid,
      }))
      return
    }
    setErrors({})
    onSave(parsed.data)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <GlassField
        label={budgetsText.form.monthLabel}
        htmlFor="budget-month"
        error={errors.month ?? null}
        hint={budget === null ? budgetsText.form.monthHint : budgetsText.form.immutableHint}
      >
        <GlassInput
          id="budget-month"
          value={month}
          onChange={(event) => {
            setMonth(event.target.value)
            clear('month')
          }}
          placeholder={budgetsText.form.monthPlaceholder}
          inputMode="numeric"
          maxLength={7}
          autoComplete="off"
          disabled={pending || budget !== null}
          error={errors.month !== undefined}
        />
      </GlassField>

      <GlassField
        label={budgetsText.form.categoryLabel}
        htmlFor="budget-category"
        error={errors.categoryId ?? null}
        hint={
          expenseCategories.length === 0
            ? budgetsText.noExpenseCategories
            : budget !== null
              ? budgetsText.form.immutableHint
              : undefined
        }
      >
        <GlassSelect
          id="budget-category"
          value={categoryId}
          onChange={(value) => {
            setCategoryId(value)
            clear('categoryId')
          }}
          options={expenseCategories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          placeholder={budgetsText.form.categoryPlaceholder}
          title={budgetsText.form.categoryPickerTitle}
          searchable
          disabled={pending || budget !== null || expenseCategories.length === 0}
          error={errors.categoryId !== undefined}
        />
      </GlassField>

      <GlassField
        label={budgetsText.form.amountLabel}
        htmlFor="budget-amount"
        error={errors.amount ?? null}
      >
        <GlassAmountInput
          id="budget-amount"
          value={amount}
          onChange={(value) => {
            setAmount(value)
            clear('amount')
          }}
          placeholder={budgetsText.form.amountPlaceholder}
          disabled={pending}
          error={errors.amount !== undefined}
        />
      </GlassField>

      <GlassButton
        type="submit"
        className="w-full"
        disabled={pending || (budget === null && expenseCategories.length === 0)}
        aria-busy={pending}
      >
        {pending ? budgetsText.form.pending : budgetsText.form.save}
      </GlassButton>

      {budget !== null ? (
        <GlassButton
          variant="danger"
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
        >
          <Trash2 aria-hidden className="size-4" />
          {budgetsText.form.delete}
        </GlassButton>
      ) : null}

      {budget !== null ? (
        <GlassConfirmSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={budgetsText.confirmDelete.title}
          description={budgetsText.confirmDelete.description(
            selectedCategory?.name ?? budgetsText.title,
            budget.month,
          )}
          confirmLabel={budgetsText.confirmDelete.confirm}
          destructive
          loading={pending}
          onConfirm={() => {
            setConfirmOpen(false)
            onDelete()
          }}
        />
      ) : null}
    </form>
  )
}
