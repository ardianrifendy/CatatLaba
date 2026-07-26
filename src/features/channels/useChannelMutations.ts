import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import type { Channel } from '@/db/local/schema'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { channelsText, commonText } from '@/lib/ui-text'
import { toast } from '@/stores/toast'

interface CreateVars {
  name: string
}

interface UpdateVars {
  id: string
  patch: { name?: string; isArchived?: boolean }
  /** Toast copy on success — lets one mutation serve rename / archive / unarchive. */
  successMessage: string
}

interface DeleteVars {
  id: string
}

function toastMutationError(error: unknown): void {
  toast.error(
    error instanceof RepoError ? error.message : commonText.mutationErrorFallback,
  )
}

/**
 * Channel mutations, each following the standard optimistic recipe from
 * src/lib/query.ts: cancel in-flight refetches + snapshot on onMutate, rollback
 * + Bahasa toast on onError, success toast on onSuccess, invalidate on
 * onSettled.
 */
export function useChannelMutations() {
  const repos = useRepos()
  const queryClient = useQueryClient()

  // Steps 1–2 of the recipe, shared by all three mutations: stop in-flight
  // refetches from clobbering the optimistic write, then snapshot for rollback.
  async function snapshot(): Promise<Channel[] | undefined> {
    await queryClient.cancelQueries({ queryKey: queryKeys.channels })
    return queryClient.getQueryData<Channel[]>(queryKeys.channels)
  }

  function rollback(previous: Channel[] | undefined): void {
    if (previous !== undefined) {
      queryClient.setQueryData(queryKeys.channels, previous)
    }
  }

  function reconcile(): void {
    void queryClient.invalidateQueries({ queryKey: queryKeys.channels })
  }

  const create = useMutation({
    mutationFn: async (vars: CreateVars) =>
      unwrap(await repos.channels.create({ name: vars.name, isArchived: false })),
    onMutate: async (vars) => {
      const previous = await snapshot()
      const now = nowIso()
      const optimistic: Channel = {
        id: newId(),
        name: vars.name,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }
      // The repo lists by createdAt ascending, so the new row belongs at the end.
      queryClient.setQueryData<Channel[]>(queryKeys.channels, (old) =>
        old ? [...old, optimistic] : old,
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      rollback(context?.previous)
      toastMutationError(error)
    },
    onSuccess: () => {
      toast.success(channelsText.toasts.created)
    },
    onSettled: reconcile,
  })

  const update = useMutation({
    mutationFn: async (vars: UpdateVars) =>
      unwrap(await repos.channels.update(vars.id, vars.patch)),
    onMutate: async (vars) => {
      const previous = await snapshot()
      const now = nowIso()
      queryClient.setQueryData<Channel[]>(queryKeys.channels, (old) =>
        old?.map((row) =>
          row.id === vars.id ? { ...row, ...vars.patch, updatedAt: now } : row,
        ),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      rollback(context?.previous)
      toastMutationError(error)
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.successMessage)
    },
    onSettled: reconcile,
  })

  const remove = useMutation({
    mutationFn: async (vars: DeleteVars) =>
      unwrap(await repos.channels.softDelete(vars.id)),
    onMutate: async (vars) => {
      const previous = await snapshot()
      queryClient.setQueryData<Channel[]>(queryKeys.channels, (old) =>
        old?.filter((row) => row.id !== vars.id),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      rollback(context?.previous)
      toastMutationError(error)
    },
    onSuccess: () => {
      toast.success(channelsText.toasts.deleted)
    },
    onSettled: reconcile,
  })

  return { create, update, remove }
}
