import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { products, type Product } from '@/db/local/schema'
import { notFound } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

// `costPrice` and `stockQty` are intentionally NOT part of the create/update
// surface: they are moving-average / stock fields owned exclusively by the
// domain layer (Phase 4), never written directly from UI/repository calls
// (RULES.md). They default to 0 at creation.
export interface ProductCreate {
  name: string
  sku?: string | null
  unit?: string
  salePrice?: number
  isArchived?: boolean
}
export type ProductUpdate = Partial<ProductCreate>

export function createProductRepo({ db }: DbContext) {
  async function findActive(id: string): Promise<Product | undefined> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1)
    return rows[0]
  }

  return {
    create(input: ProductCreate): Promise<Result<Product>> {
      return guard<Product>(async () => {
        const meta = newRowMeta()
        await db.insert(products).values({ ...input, ...meta })
        const row = await findActive(meta.id)
        return row ? ok(row) : err(notFound('Produk tidak ditemukan setelah dibuat.'))
      })
    },
    list(): Promise<Result<Product[]>> {
      return guard<Product[]>(async () =>
        ok(
          await db
            .select()
            .from(products)
            .where(isNull(products.deletedAt))
            .orderBy(asc(products.createdAt)),
        ),
      )
    },
    getById(id: string): Promise<Result<Product>> {
      return guard<Product>(async () => {
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Produk tidak ditemukan.'))
      })
    },
    update(id: string, patch: ProductUpdate): Promise<Result<Product>> {
      return guard<Product>(async () => {
        await db
          .update(products)
          .set({ ...patch, updatedAt: nowIso() })
          .where(and(eq(products.id, id), isNull(products.deletedAt)))
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Produk tidak ditemukan.'))
      })
    },
    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const row = await findActive(id)
        if (!row) return err(notFound('Produk tidak ditemukan.'))
        const now = nowIso()
        await db.update(products).set({ deletedAt: now, updatedAt: now }).where(eq(products.id, id))
        return ok(undefined)
      })
    },
  }
}

export type ProductRepo = ReturnType<typeof createProductRepo>
