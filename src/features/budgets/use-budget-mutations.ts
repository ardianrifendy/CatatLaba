import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import type { Budget } from '@/db/local/schema'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { commonText } from '@/lib/ui-text'
import { budgetsText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'
import type { BudgetFormValues } from './schemas'

function errorMessage(error: unknown): string {
  return error instanceof RepoError ? error.message : commonText.mutationErrorFallback
}

export function useCreateBudget() {
  const repos = useRepos()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: BudgetFormValues) =>
      unwrap(
        await repos.budgets.create({
          month: values.month,
          categoryId: values.categoryId,
          amount: values.amount,
        }),
      ),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets })
      const previous = queryClient.getQueryData<Budget[]>(queryKeys.budgets)
      const now = nowIso()
      const optimistic: Budget = {
        id: `temp-${newId()}`,
        month: values.month,
        categoryId: values.categoryId,
        amount: values.amount,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      queryClient.setQueryData<Budget[]>(queryKeys.budgets, (old) =>
        old ? [...old, optimistic] : old,
      )
      return { previous }
    },
    onError: (error, _values, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.budgets, context.previous)
      }
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(budgetsText.toasts.created),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.budgets }),
  })
}

export function useUpdateBudget() {
  const repos = useRepos()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) =>
      unwrap(await repos.budgets.update(id, { amount })),
    onMutate: async ({ id, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets })
      const previous = queryClient.getQueryData<Budget[]>(queryKeys.budgets)
      queryClient.setQueryData<Budget[]>(queryKeys.budgets, (old) =>
        old?.map((budget) =>
          budget.id === id ? { ...budget, amount, updatedAt: nowIso() } : budget,
        ),
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.budgets, context.previous)
      }
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(budgetsText.toasts.updated),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.budgets }),
  })
}

export function useDeleteBudget() {
  const repos = useRepos()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrap(await repos.budgets.softDelete(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets })
      const previous = queryClient.getQueryData<Budget[]>(queryKeys.budgets)
      queryClient.setQueryData<Budget[]>(queryKeys.budgets, (old) =>
        old?.filter((budget) => budget.id !== id),
      )
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.budgets, context.previous)
      }
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(budgetsText.toasts.deleted),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.budgets }),
  })
}
