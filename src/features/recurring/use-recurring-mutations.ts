import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import type { RecurringRule } from '@/db/local/schema'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { commonText } from '@/lib/ui-text'
import { recurringText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'
import type { RecurringFormValues } from './schemas'

function errorMessage(error: unknown): string {
  return error instanceof RepoError ? error.message : commonText.mutationErrorFallback
}

function toInput(values: RecurringFormValues) {
  return {
    name: values.name,
    frequency: values.frequency,
    day: values.day,
    nextRunAt: new Date(`${values.nextRunDate}T12:00:00.000Z`).toISOString(),
    templateType: values.templateType,
    templateAmount: values.templateAmount,
    templateWalletId: values.templateWalletId,
    templateCategoryId: values.templateCategoryId,
    templateChannelId: values.templateChannelId === '' ? null : values.templateChannelId,
    templateNote: values.templateNote === '' ? null : values.templateNote,
  } as const
}

export function useCreateRecurring() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: RecurringFormValues) => unwrap(await repos.recurring.create({ ...toInput(values), isActive: true })),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring })
      const previous = queryClient.getQueryData<RecurringRule[]>(queryKeys.recurring)
      const now = nowIso()
      const optimistic: RecurringRule = { id: `temp-${newId()}`, ...toInput(values), isActive: true, createdAt: now, updatedAt: now, deletedAt: null }
      queryClient.setQueryData<RecurringRule[]>(queryKeys.recurring, (old) => old ? [...old, optimistic] : old)
      return { previous }
    },
    onError: (error, _values, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.recurring, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(recurringText.toasts.created),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.recurring }),
  })
}

export function useUpdateRecurring() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RecurringFormValues }) => unwrap(await repos.recurring.update(id, toInput(values))),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring })
      const previous = queryClient.getQueryData<RecurringRule[]>(queryKeys.recurring)
      queryClient.setQueryData<RecurringRule[]>(queryKeys.recurring, (old) => old?.map((rule) => rule.id === id ? { ...rule, ...toInput(values), updatedAt: nowIso() } : rule))
      return { previous }
    },
    onError: (error, _values, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.recurring, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(recurringText.toasts.updated),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.recurring }),
  })
}

export function useSetRecurringActive() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => unwrap(await repos.recurring.update(id, { isActive })),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring })
      const previous = queryClient.getQueryData<RecurringRule[]>(queryKeys.recurring)
      queryClient.setQueryData<RecurringRule[]>(queryKeys.recurring, (old) => old?.map((rule) => rule.id === id ? { ...rule, isActive, updatedAt: nowIso() } : rule))
      return { previous }
    },
    onError: (error, _values, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.recurring, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: (_rule, input) => toast.success(input.isActive ? recurringText.toasts.activated : recurringText.toasts.archived),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.recurring }),
  })
}

export function useDeleteRecurring() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await repos.recurring.softDelete(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recurring })
      const previous = queryClient.getQueryData<RecurringRule[]>(queryKeys.recurring)
      queryClient.setQueryData<RecurringRule[]>(queryKeys.recurring, (old) => old?.filter((rule) => rule.id !== id))
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.recurring, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(recurringText.toasts.deleted),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: queryKeys.recurring }),
  })
}
