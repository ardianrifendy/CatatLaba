import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import type { Transaction, Wallet } from '@/db/local/schema'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { commonText, walletsText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'
import type { WalletFormValues } from './schemas'

// Every hook here follows the standard mutation recipe from '@/lib/query':
// cancel + snapshot + optimistic setQueryData on onMutate, rollback + Bahasa
// error toast on onError, success toast on onSuccess, invalidate on onSettled.

function mutationErrorMessage(error: unknown): string {
  return error instanceof RepoError ? error.message : commonText.mutationErrorFallback
}

export function useCreateWallet() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: WalletFormValues) =>
      unwrap(
        await repos.wallets.create({
          name: input.name,
          type: input.type,
          initialBalance: input.initialBalance,
          isArchived: false,
        }),
      ),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets })
      const previous = queryClient.getQueryData<Wallet[]>(queryKeys.wallets)
      const now = nowIso()
      // Temp id marks the row as optimistic; onSettled swaps in the real row.
      const optimisticRow: Wallet = {
        id: `temp-${newId()}`,
        name: input.name,
        type: input.type,
        initialBalance: input.initialBalance,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      // Append: the repository lists wallets by createdAt ascending.
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets, (old) =>
        old ? [...old, optimisticRow] : old,
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.wallets, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: () => {
      toast.success(walletsText.toasts.created)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
    },
  })
}

export interface WalletUpdateInput {
  id: string
  patch: Partial<Pick<Wallet, 'name' | 'type' | 'initialBalance' | 'isArchived'>>
  /** Bahasa success toast — the caller picks (saved / archived / unarchived). */
  successMessage: string
}

export function useUpdateWallet() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: WalletUpdateInput) =>
      unwrap(await repos.wallets.update(input.id, input.patch)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets })
      const previous = queryClient.getQueryData<Wallet[]>(queryKeys.wallets)
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets, (old) =>
        old
          ? old.map((wallet) =>
              wallet.id === input.id
                ? { ...wallet, ...input.patch, updatedAt: nowIso() }
                : wallet,
            )
          : old,
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.wallets, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: (_data, input) => {
      toast.success(input.successMessage)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
    },
  })
}

export function useDeleteWallet() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string }) =>
      unwrap(await repos.wallets.softDelete(input.id)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wallets })
      const previous = queryClient.getQueryData<Wallet[]>(queryKeys.wallets)
      queryClient.setQueryData<Wallet[]>(queryKeys.wallets, (old) =>
        old ? old.filter((wallet) => wallet.id !== input.id) : old,
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.wallets, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: () => {
      toast.success(walletsText.toasts.deleted)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
    },
  })
}

export interface TransferInput {
  fromWalletId: string
  toWalletId: string
  /** Integer IDR, > 0 (validated by transferFormSchema). */
  amount: number
  note: string | null
  occurredAt: string
  /** Names captured at submit time for the success toast. */
  fromWalletName: string
  toWalletName: string
}

export function useCreateTransfer() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    // Transfers never carry categoryId/channelId (repository enforces this too).
    mutationFn: async (input: TransferInput) =>
      unwrap(
        await repos.transactions.create({
          type: 'transfer',
          amount: input.amount,
          walletId: input.fromWalletId,
          counterWalletId: input.toWalletId,
          occurredAt: input.occurredAt,
          note: input.note,
        }),
      ),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions })
      const previous = queryClient.getQueryData<Transaction[]>(queryKeys.transactions)
      // Prepend a temp row (list is occurredAt descending) so derived wallet
      // balances update instantly.
      const optimisticRow: Transaction = {
        id: `temp-${newId()}`,
        type: 'transfer',
        amount: input.amount,
        walletId: input.fromWalletId,
        counterWalletId: input.toWalletId,
        categoryId: null,
        channelId: null,
        note: input.note,
        occurredAt: input.occurredAt,
        recurringRuleId: null,
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
        deletedAt: null,
      }
      queryClient.setQueryData<Transaction[]>(queryKeys.transactions, (old) =>
        old ? [optimisticRow, ...old] : old,
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.transactions, context.previous)
      }
      toast.error(mutationErrorMessage(error))
    },
    onSuccess: (_data, input) => {
      toast.success(walletsText.toasts.transferSuccess(input.fromWalletName, input.toWalletName))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
    },
  })
}
