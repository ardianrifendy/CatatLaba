import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { products, type Product, transactionItems, transactions } from '@/db/local/schema'
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

export interface ProductHistoryEntry {
  id: string
  type: 'income' | 'expense'
  occurredAt: string
  qty: number
  unitPrice: number
  unitCost: number
  stockDelta: number
  profit: number
}

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
    listHistory(id: string): Promise<Result<ProductHistoryEntry[]>> {
      return guard<ProductHistoryEntry[]>(async () => {
        const product = await findActive(id)
        if (!product) return err(notFound('Produk tidak ditemukan.'))
        const rows = await db
          .select({
            id: transactionItems.id,
            type: transactions.type,
            occurredAt: transactions.occurredAt,
            qty: transactionItems.qty,
            unitPrice: transactionItems.unitPrice,
            unitCost: transactionItems.unitCost,
          })
          .from(transactionItems)
          .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
          .where(
            and(
              eq(transactionItems.productId, id),
              isNull(transactionItems.deletedAt),
              isNull(transactions.deletedAt),
            ),
          )
          .orderBy(desc(transactions.occurredAt), desc(transactionItems.createdAt))

        return ok(
          rows
            .filter((row): row is typeof row & { type: 'income' | 'expense' } => row.type !== 'transfer')
            .map((row) => ({
              id: row.id,
              type: row.type,
              occurredAt: row.occurredAt,
              qty: row.qty,
              unitPrice: row.unitPrice,
              unitCost: row.unitCost,
              stockDelta: row.type === 'expense' ? row.qty : -row.qty,
              profit: row.type === 'income' ? (row.unitPrice - row.unitCost) * row.qty : 0,
            })),
        )
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
