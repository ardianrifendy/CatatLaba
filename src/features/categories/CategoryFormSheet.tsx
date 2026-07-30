import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import type { Category } from '@/db/local/schema'
import { canBeParentOf, candidateParents, hasChildren } from '@/domain/category-tree'
import { categoriesText } from '@/lib/ui-text'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassField } from '@/components/ui/GlassField'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import { GlassSelect, type GlassSelectOption } from '@/components/ui/GlassSelect'
import {
  GlassBottomSheet,
  GlassBottomSheetContent,
  GlassBottomSheetTitle,
} from '@/components/ui/GlassBottomSheet'

// Sentinel option value mapping to `parentId: null` (GlassSelect values are
// strings, never null-as-option).
const PARENT_NONE = 'none'

// Form input parsed with Zod before submit (RULES.md). `icon` normalizes an
// empty string to null so the row stores "no icon" rather than ''. The icon is
// validated by grapheme count (Intl.Segmenter), not UTF-16 length, so flag /
// skin-tone / ZWJ emoji count as one icon; the input's maxLength={16} is only
// a loose abuse bound in code units.
const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, categoriesText.validation.nameRequired)
    .max(40, categoriesText.validation.nameTooLong),
  type: z.enum(['income', 'expense']),
  parentId: z.string().nullable(),
  icon: z
    .string()
    .trim()
    .refine(
      (value) => value == null || [...new Intl.Segmenter().segment(value)].length <= 1,
      categoriesText.validation.iconTooLong,
    )
    .transform((value) => (value === '' ? null : value)),
})

export type CategoryFormValues = z.output<typeof formSchema>

// One nullable message per field keeps GlassField wiring trivial.
type FormErrors = {
  name: string | null
  parent: string | null
  icon: string | null
}

const noErrors: FormErrors = { name: null, parent: null, icon: null }

const typeOptions: ReadonlyArray<{ value: Category['type']; label: string }> = [
  { value: 'expense', label: categoriesText.typeExpense },
  { value: 'income', label: categoriesText.typeIncome },
]

type CategoryFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Full active category list, used to derive valid parent candidates. */
  categories: readonly Category[]
  /** Row being edited, or null when creating. */
  editing: Category | null
  /** Initial type for a new category (the screen's active filter). */
  defaultType: Category['type']
  onSubmit: (values: CategoryFormValues) => void
  /** Delete requested from the edit sheet (screen decides block/confirm). */
  onDelete: () => void
}

/**
 * Create/edit category bottom sheet. The parent remounts this component (via a
 * `key`) each time it opens, so plain useState initializers snapshot the row
 * being edited. Type is locked after creation; the parent picker only offers
 * roots that the domain layer allows (one level, same type).
 */
export function CategoryFormSheet({
  open,
  onOpenChange,
  categories,
  editing,
  defaultType,
  onSubmit,
  onDelete,
}: CategoryFormSheetProps) {
  const isEditing = editing !== null
  const [name, setName] = useState(editing?.name ?? '')
  const [type, setType] = useState<Category['type']>(editing?.type ?? defaultType)
  const [parentValue, setParentValue] = useState<string>(editing?.parentId ?? PARENT_NONE)
  const [icon, setIcon] = useState(editing?.icon ?? '')
  const [errors, setErrors] = useState<FormErrors>(noErrors)

  // A category that already has children must stay a root: lock the parent
  // field entirely (with a hint) instead of offering an empty picker.
  const editingHasChildren = isEditing && hasChildren(categories, editing.id)

  const parentOptions: GlassSelectOption[] = [
    { value: PARENT_NONE, label: categoriesText.form.parentNone },
    ...candidateParents(categories, { type, excludeId: editing?.id ?? null }).map(
      (candidate): GlassSelectOption =>
        candidate.icon != null && candidate.icon !== ''
          ? { value: candidate.id, label: candidate.name, icon: <span>{candidate.icon}</span> }
          : { value: candidate.id, label: candidate.name },
    ),
  ]

  function handleTypeChange(next: Category['type']): void {
    // Tapping the already-active segment must not wipe the chosen parent.
    if (next === type) return
    setType(next)
    // Parent candidates are per-type; a previous pick is no longer valid.
    setParentValue(PARENT_NONE)
    setErrors((prev) => ({ ...prev, parent: null }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const result = formSchema.safeParse({
      name,
      type,
      parentId: parentValue === PARENT_NONE ? null : parentValue,
      icon,
    })
    if (!result.success) {
      const next: FormErrors = { ...noErrors }
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (field === 'name' && next.name === null) next.name = issue.message
        else if (field === 'icon' && next.icon === null) next.icon = issue.message
        else if (field === 'parentId' && next.parent === null) next.parent = issue.message
      }
      setErrors(next)
      return
    }
    // Defensive re-check of the hierarchy rules (the picker already filters):
    // guards against a stale pick, e.g. the chosen parent gained a parent or
    // was deleted meanwhile.
    if (
      result.data.parentId !== null &&
      !canBeParentOf(categories, result.data.parentId, editing?.id)
    ) {
      setErrors({ ...noErrors, parent: categoriesText.validation.parentInvalid })
      return
    }
    setErrors(noErrors)
    onSubmit(result.data)
  }

  return (
    <GlassBottomSheet open={open} onOpenChange={onOpenChange}>
      <GlassBottomSheetContent aria-describedby={undefined}>
        <GlassBottomSheetTitle className="mb-4 text-base font-medium text-foreground font-semibold">
          {isEditing ? categoriesText.form.editTitle : categoriesText.form.createTitle}
        </GlassBottomSheetTitle>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <GlassField
            label={categoriesText.form.nameLabel}
            htmlFor="category-name"
            error={errors.name}
          >
            <GlassInput
              id="category-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((prev) => ({ ...prev, name: null }))
              }}
              placeholder={categoriesText.form.namePlaceholder}
              maxLength={40}
              autoComplete="off"
              error={errors.name !== null}
            />
          </GlassField>

          <GlassField
            label={categoriesText.form.typeLabel}
            hint={isEditing ? categoriesText.form.typeLockedHint : undefined}
          >
            <GlassSegmented
              value={type}
              onChange={handleTypeChange}
              options={typeOptions}
              disabled={isEditing}
              aria-label={categoriesText.form.typeLabel}
            />
          </GlassField>

          <GlassField
            label={categoriesText.form.parentLabel}
            htmlFor="category-parent"
            error={errors.parent}
            hint={editingHasChildren ? categoriesText.form.parentLockedHint : undefined}
          >
            <GlassSelect
              id="category-parent"
              value={editingHasChildren ? PARENT_NONE : parentValue}
              onChange={(value) => {
                setParentValue(value)
                setErrors((prev) => ({ ...prev, parent: null }))
              }}
              options={parentOptions}
              placeholder={categoriesText.form.parentPlaceholder}
              title={categoriesText.form.parentSheetTitle}
              disabled={editingHasChildren}
              error={errors.parent !== null}
            />
          </GlassField>

          <GlassField
            label={categoriesText.form.iconLabel}
            htmlFor="category-icon"
            error={errors.icon}
            hint={categoriesText.form.iconHint}
          >
            <GlassInput
              id="category-icon"
              value={icon}
              onChange={(event) => {
                setIcon(event.target.value)
                setErrors((prev) => ({ ...prev, icon: null }))
              }}
              placeholder={categoriesText.form.iconPlaceholder}
              maxLength={16}
              autoComplete="off"
              error={errors.icon !== null}
            />
          </GlassField>

          <div className="mt-1 flex flex-col gap-2">
            <GlassButton type="submit" variant="primary">
              {categoriesText.form.save}
            </GlassButton>
            {isEditing ? (
              <GlassButton type="button" variant="danger" onClick={onDelete}>
                {categoriesText.form.delete}
              </GlassButton>
            ) : null}
          </div>
        </form>
      </GlassBottomSheetContent>
    </GlassBottomSheet>
  )
}
