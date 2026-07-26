import type { AppError, AppErrorCode } from '@/lib/errors'
import type { Result } from '@/lib/result'

// Stable React Query cache keys, one per aggregate. Always reference these —
// never inline key arrays — so invalidation and optimistic updates stay in sync
// across features.
export const queryKeys = {
  wallets: ['wallets'],
  categories: ['categories'],
  channels: ['channels'],
  transactions: ['transactions'],
} as const

// Error thrown when a repository Result is unwrapped for React Query. Carries
// the stable machine code for branching and the Bahasa Indonesia message from
// the repository layer, ready to show in a toast.
export class RepoError extends Error {
  readonly code: AppErrorCode

  constructor(error: AppError) {
    super(error.message, { cause: error.cause })
    this.name = 'RepoError'
    this.code = error.code
  }
}

/**
 * Unwraps a repository `Result` at the React Query boundary: returns the value
 * or throws a `RepoError` (Bahasa message + stable code) that queries and
 * mutations surface via their `error` state.
 *
 * Usage in a query:
 *
 *   useQuery({
 *     queryKey: queryKeys.wallets,
 *     queryFn: async () => unwrap(await repos.wallets.list()),
 *   })
 *
 * STANDARD MUTATION RECIPE — every data mutation in the app MUST follow this
 * shape (RULES.md: optimistic update + rollback on error + Bahasa toast):
 *
 *   const queryClient = useQueryClient()
 *   const mutation = useMutation({
 *     mutationFn: async (input: WalletCreate) =>
 *       unwrap(await repos.wallets.create(input)),
 *     onMutate: async (input) => {
 *       // 1. Stop in-flight refetches from clobbering the optimistic write.
 *       await queryClient.cancelQueries({ queryKey: queryKeys.wallets })
 *       // 2. Snapshot the current cache for rollback.
 *       const previous = queryClient.getQueryData<Wallet[]>(queryKeys.wallets)
 *       // 3. Apply the optimistic update.
 *       queryClient.setQueryData<Wallet[]>(queryKeys.wallets, (old) =>
 *         old ? [...old, optimisticRow] : old,
 *       )
 *       return { previous }
 *     },
 *     onError: (error, _input, context) => {
 *       // 4. Roll back to the snapshot, then toast the Bahasa message.
 *       if (context?.previous !== undefined) {
 *         queryClient.setQueryData(queryKeys.wallets, context.previous)
 *       }
 *       toast.error(
 *         error instanceof RepoError ? error.message : commonText.mutationErrorFallback,
 *       )
 *     },
 *     onSuccess: () => {
 *       // 5. Success toast in Bahasa (feature-specific copy from ui-text).
 *       toast.success(walletsText.createdToast)
 *     },
 *     onSettled: () => {
 *       // 6. Reconcile the cache with the database either way.
 *       void queryClient.invalidateQueries({ queryKey: queryKeys.wallets })
 *     },
 *   })
 */
export function unwrap<T>(result: Result<T, AppError>): T {
  if (result.ok) return result.value
  throw new RepoError(result.error)
}
