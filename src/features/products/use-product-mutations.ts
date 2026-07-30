import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/app/providers'
import type { Product } from '@/db/local/schema'
import { newId } from '@/lib/id'
import { queryKeys, RepoError, unwrap } from '@/lib/query'
import { nowIso } from '@/lib/time'
import { commonText } from '@/lib/ui-text'
import { productsText } from '@/lib/ui-text/products'
import { toast } from '@/stores/toast'
import type { ProductFormValues } from './schemas'

function errorMessage(error: unknown): string {
  return error instanceof RepoError ? error.message : commonText.mutationErrorFallback
}

export function useCreateProduct() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: ProductFormValues) => unwrap(await repos.products.create(values)),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products })
      const previous = queryClient.getQueryData<Product[]>(queryKeys.products)
      const now = nowIso()
      const optimistic: Product = {
        id: `temp-${newId()}`,
        costPrice: 0,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        ...values,
      }
      queryClient.setQueryData<Product[]>(queryKeys.products, (old) =>
        old ? [...old, optimistic] : old,
      )
      return { previous }
    },
    onError: (error, _values, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.products, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(productsText.toasts.created),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reportsRoot })
    },
  })
}

type ProductPatch = Partial<ProductFormValues> | {
  isArchived: boolean
}

export function useUpdateProduct() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProductPatch; success: string }) =>
      unwrap(await repos.products.update(id, patch)),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products })
      const previous = queryClient.getQueryData<Product[]>(queryKeys.products)
      queryClient.setQueryData<Product[]>(queryKeys.products, (old) =>
        old?.map((product) =>
          product.id === id ? { ...product, ...patch, updatedAt: nowIso() } : product,
        ),
      )
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.products, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: (_product, input) => toast.success(input.success),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reportsRoot })
    },
  })
}

export function useDeleteProduct() {
  const repos = useRepos()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => unwrap(await repos.products.softDelete(id)),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products })
      const previous = queryClient.getQueryData<Product[]>(queryKeys.products)
      queryClient.setQueryData<Product[]>(queryKeys.products, (old) => old?.filter((row) => row.id !== id))
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(queryKeys.products, context.previous)
      toast.error(errorMessage(error))
    },
    onSuccess: () => toast.success(productsText.toasts.deleted),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products })
      void queryClient.invalidateQueries({ queryKey: queryKeys.reportsRoot })
    },
  })
}
