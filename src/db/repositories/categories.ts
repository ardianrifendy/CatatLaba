import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { categories, type Category, type NewCategory } from '@/db/local/schema'
import { notFound } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export type CategoryCreate = Omit<NewCategory, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
export type CategoryUpdate = Partial<CategoryCreate>

export function createCategoryRepo({ db }: DbContext) {
  async function findActive(id: string): Promise<Category | undefined> {
    const rows = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .limit(1)
    return rows[0]
  }

  return {
    create(input: CategoryCreate): Promise<Result<Category>> {
      return guard<Category>(async () => {
        const meta = newRowMeta()
        await db.insert(categories).values({ ...input, ...meta })
        const row = await findActive(meta.id)
        return row ? ok(row) : err(notFound('Kategori tidak ditemukan setelah dibuat.'))
      })
    },
    list(): Promise<Result<Category[]>> {
      return guard<Category[]>(async () =>
        ok(
          await db
            .select()
            .from(categories)
            .where(isNull(categories.deletedAt))
            .orderBy(asc(categories.createdAt)),
        ),
      )
    },
    getById(id: string): Promise<Result<Category>> {
      return guard<Category>(async () => {
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Kategori tidak ditemukan.'))
      })
    },
    update(id: string, patch: CategoryUpdate): Promise<Result<Category>> {
      return guard<Category>(async () => {
        await db
          .update(categories)
          .set({ ...patch, updatedAt: nowIso() })
          .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Kategori tidak ditemukan.'))
      })
    },
    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const row = await findActive(id)
        if (!row) return err(notFound('Kategori tidak ditemukan.'))
        const now = nowIso()
        await db
          .update(categories)
          .set({ deletedAt: now, updatedAt: now })
          .where(eq(categories.id, id))
        return ok(undefined)
      })
    },
  }
}

export type CategoryRepo = ReturnType<typeof createCategoryRepo>
