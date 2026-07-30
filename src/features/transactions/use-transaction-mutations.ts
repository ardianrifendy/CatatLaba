import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import type { Transaction } from '@/db/local/schema'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { commonText } from '@/lib/ui-text/common'
import { transactionsText } from '@/lib/ui-text/transactions'
import { toast } from '@/stores/toast'
import type { TransactionFormValues } from './schemas'

export type TransactionMutationInput = TransactionFormValues & { occurredAt: string }
export type TransactionUpdateInput = TransactionMutationInput & { id: string }

function mutationError(error: unknown): void {
  toast.error(error instanceof RepoError ? error.message : commonText.mutationErrorFallback)
}

function toCreateInput(input: TransactionMutationInput) {
  return {
    type: input.type,
    amount: input.amount,
    walletId: input.walletId,
    counterWalletId: input.type === 'transfer' ? input.counterWalletId : null,
    categoryId: input.type === 'transfer' ? null : input.categoryId,
    channelId: input.channelId === '' ? null : input.channelId,
    note: input.note === '' ? null : input.note,
    occurredAt: input.occurredAt,
    // Items are intentionally carried on both create and update. The Phase 4
    // transaction repository applies stock reversal atomically when items change.
    items: input.type === 'transfer' ? [] : input.items,
  } as const
}

export function useTransactionMutations() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  function invalidateDerivedQueries(): void {
    void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    void queryClient.invalidateQueries({ queryKey: queryKeys.products })
    void queryClient.invalidateQueries({ queryKey: queryKeys.reportsRoot })
  }

  const create = useMutation({
    mutationFn: async (input: TransactionMutationInput) =>
      unwrap(await repos.transactions.create(toCreateInput(input))),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions })
      const previous = queryClient.getQueryData<Transaction[]>(queryKeys.transactions)
      const now = nowIso()
      const optimistic: Transaction = {
        id: `temp-${newId()}`,
        ...toCreateInput(input),
        recurringRuleId: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      queryClient.setQueryData<Transaction[]>(queryKeys.transactions, (old) =>
        old === undefined ? old : [optimistic, ...old],
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.transactions, context.previous)
      mutationError(error)
    },
    onSuccess: () => toast.success(transactionsText.toasts.created),
    onSettled: invalidateDerivedQueries,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => unwrap(await repos.transactions.softDelete(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions })
      const previous = queryClient.getQueryData<Transaction[]>(queryKeys.transactions)
      queryClient.setQueryData<Transaction[]>(queryKeys.transactions, (old) =>
        old?.filter((transaction) => transaction.id !== id),
      )
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.transactions, context.previous)
      mutationError(error)
    },
    onSuccess: () => toast.success(transactionsText.toasts.deleted),
    onSettled: invalidateDerivedQueries,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...input }: TransactionUpdateInput) =>
      unwrap(await repos.transactions.update(id, toCreateInput(input))),
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions })
      const previous = queryClient.getQueryData<Transaction[]>(queryKeys.transactions)
      const patch = toCreateInput(input)
      queryClient.setQueryData<Transaction[]>(queryKeys.transactions, (old) =>
        old?.map((transaction) =>
          transaction.id === id ? { ...transaction, ...patch, updatedAt: nowIso() } : transaction,
        ),
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.transactions, context.previous)
      mutationError(error)
    },
    onSuccess: () => toast.success(transactionsText.toasts.updated),
    onSettled: invalidateDerivedQueries,
  })

  return { create, update, remove }
}
