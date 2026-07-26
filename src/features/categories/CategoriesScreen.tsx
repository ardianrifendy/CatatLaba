import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, Plus, Tag } from 'lucide-react'
import { useRepos } from '@/app/providers'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassConfirmSheet } from '@/components/ui/GlassConfirmSheet'
import { GlassEmptyState } from '@/components/ui/GlassEmptyState'
import { GlassIconButton } from '@/components/ui/GlassIconButton'
import { GlassSegmented } from '@/components/ui/GlassSegmented'
import type { Category } from '@/db/local/schema'
import { buildCategoryTree, deleteBlockedByChildren } from '@/domain/category-tree'
import { cn } from '@/lib/cn'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { categoriesText, commonText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'
import { CategoryFormSheet, type CategoryFormValues } from './CategoryFormSheet'

const typeFilterOptions: ReadonlyArray<{ value: Category['type']; label: string }> = [
  { value: 'expense', label: categoriesText.typeExpense },
  { value: 'income', label: categoriesText.typeIncome },
]

function mutationErrorMessage(error: unknown): string {
  return error instanceof RepoError ? error.message : commonText.mutationErrorFallback
}

// One tappable row (root or child). Roots get the larger icon badge; children
// sit indented under a connector line. Either way the target stays >= 44px.
function CategoryRow({
  category,
  child = false,
  onSelect,
}: {
  category: Category
  child?: boolean
  onSelect: (category: Category) => void
}) {
  const hasIcon = category.icon != null && category.icon !== ''
  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className={cn(
        'flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5',
          child ? 'size-8 text-sm' : 'size-10 text-lg',
        )}
      >
        {hasIcon ? (
          category.icon
        ) : (
          <Tag className={cn('text-zinc-400', child ? 'size-3.5' : 'size-4')} />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-100">{category.name}</span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-zinc-600" />
    </button>
  )
}

export function CategoriesScreen({ onBack }: { onBack: () => void }) {
  const repos = useRepos()
  const queryClient = useQueryClient()

  const [typeFilter, setTypeFilter] = useState<Category['type']>('expense')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  // Bumped on every open so the sheet remounts with fresh form state.
  const [formSession, setFormSession] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => unwrap(await repos.categories.list()),
  })
  const rows = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data])

  const tree = useMemo(() => buildCategoryTree(rows), [rows])
  const nodes = tree[typeFilter]

  const createMutation = useMutation({
    mutationFn: async (input: CategoryFormValues) =>
      unwrap(await repos.categories.create(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories })
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories)
      const now = nowIso()
      const optimistic: Category = {
        id: newId(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        icon: input.icon,
      }
      queryClient.setQueryData<Category[]>(queryKeys.categories, (old) =>
        old ? [...old, optimistic] : old,
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.categories, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: () => {
      toast.success(categoriesText.toast.created)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; values: CategoryFormValues }) =>
      unwrap(
        await repos.categories.update(input.id, {
          name: input.values.name,
          parentId: input.values.parentId,
          icon: input.values.icon,
        }),
      ),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories })
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories)
      queryClient.setQueryData<Category[]>(queryKeys.categories, (old) =>
        old
          ? old.map((row) =>
              row.id === input.id
                ? {
                    ...row,
                    name: input.values.name,
                    parentId: input.values.parentId,
                    icon: input.values.icon,
                    updatedAt: nowIso(),
                  }
                : row,
            )
          : old,
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.categories, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: () => {
      toast.success(categoriesText.toast.updated)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => unwrap(await repos.categories.softDelete(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories })
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories)
      // list() excludes soft-deleted rows, so dropping the row mirrors the
      // post-delete server state.
      queryClient.setQueryData<Category[]>(queryKeys.categories, (old) =>
        old ? old.filter((row) => row.id !== id) : old,
      )
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.categories, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: () => {
      toast.success(categoriesText.toast.deleted)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })

  function openCreate(): void {
    setEditing(null)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  function openEdit(category: Category): void {
    setEditing(category)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  // Optimistic UX: the sheet closes immediately; a failure rolls the cache
  // back and surfaces an error toast.
  function handleFormSubmit(values: CategoryFormValues): void {
    if (editing !== null) updateMutation.mutate({ id: editing.id, values })
    else createMutation.mutate(values)
    setFormOpen(false)
  }

  function handleDeleteRequest(): void {
    if (editing === null) return
    if (deleteBlockedByChildren(rows, editing.id)) {
      toast.error(categoriesText.toast.deleteBlocked)
      return
    }
    setConfirmOpen(true)
  }

  function handleDeleteConfirm(): void {
    if (editing === null) return
    deleteMutation.mutate(editing.id)
    setConfirmOpen(false)
    setFormOpen(false)
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <GlassIconButton aria-label={categoriesText.back} onClick={onBack}>
          <ArrowLeft className="size-5" aria-hidden />
        </GlassIconButton>
        <h2 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">
          {categoriesText.title}
        </h2>
        <GlassIconButton aria-label={categoriesText.add} onClick={openCreate}>
          <Plus className="size-5" aria-hidden />
        </GlassIconButton>
      </div>

      <GlassSegmented
        value={typeFilter}
        onChange={setTypeFilter}
        options={typeFilterOptions}
        aria-label={categoriesText.typeFilterLabel}
      />

      {categoriesQuery.isPending ? (
        <div aria-hidden className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : categoriesQuery.isError ? (
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-light text-zinc-400">{categoriesText.loadError}</p>
          <GlassButton variant="ghost" onClick={() => void categoriesQuery.refetch()}>
            {categoriesText.retry}
          </GlassButton>
        </GlassCard>
      ) : nodes.length === 0 ? (
        <GlassCard>
          <GlassEmptyState
            icon={<Tag className="size-6" />}
            title={
              typeFilter === 'expense'
                ? categoriesText.empty.expenseTitle
                : categoriesText.empty.incomeTitle
            }
            description={categoriesText.empty.description}
            action={
              <GlassButton onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                {categoriesText.empty.cta}
              </GlassButton>
            }
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-2">
          <ul className="flex flex-col gap-1">
            {nodes.map((node) => (
              <li key={node.category.id}>
                <CategoryRow category={node.category} onSelect={openEdit} />
                {node.children.length > 0 ? (
                  <ul className="my-1 ml-6 flex flex-col gap-1 border-l border-white/10 pl-2">
                    {node.children.map((childCategory) => (
                      <li key={childCategory.id}>
                        <CategoryRow category={childCategory} child onSelect={openEdit} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <CategoryFormSheet
        key={formSession}
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={rows}
        editing={editing}
        defaultType={typeFilter}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteRequest}
      />

      <GlassConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={categoriesText.confirmDelete.title}
        description={
          editing !== null ? categoriesText.confirmDelete.description(editing.name) : undefined
        }
        confirmLabel={categoriesText.confirmDelete.confirm}
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </section>
  )
}
