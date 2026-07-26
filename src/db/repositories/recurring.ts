import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { type NewRecurringRule, type RecurringRule, recurringRules } from '@/db/local/schema'
import { notFound } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export type RecurringCreate = Omit<
  NewRecurringRule,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>
export type RecurringUpdate = Partial<RecurringCreate>

export function createRecurringRepo({ db }: DbContext) {
  async function findActive(id: string): Promise<RecurringRule | undefined> {
    const rows = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), isNull(recurringRules.deletedAt)))
      .limit(1)
    return rows[0]
  }

  return {
    create(input: RecurringCreate): Promise<Result<RecurringRule>> {
      return guard<RecurringRule>(async () => {
        const meta = newRowMeta()
        await db.insert(recurringRules).values({ ...input, ...meta })
        const row = await findActive(meta.id)
        return row ? ok(row) : err(notFound('Aturan berulang tidak ditemukan setelah dibuat.'))
      })
    },
    list(): Promise<Result<RecurringRule[]>> {
      return guard<RecurringRule[]>(async () =>
        ok(
          await db
            .select()
            .from(recurringRules)
            .where(isNull(recurringRules.deletedAt))
            .orderBy(asc(recurringRules.createdAt)),
        ),
      )
    },
    getById(id: string): Promise<Result<RecurringRule>> {
      return guard<RecurringRule>(async () => {
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Aturan berulang tidak ditemukan.'))
      })
    },
    update(id: string, patch: RecurringUpdate): Promise<Result<RecurringRule>> {
      return guard<RecurringRule>(async () => {
        await db
          .update(recurringRules)
          .set({ ...patch, updatedAt: nowIso() })
          .where(and(eq(recurringRules.id, id), isNull(recurringRules.deletedAt)))
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Aturan berulang tidak ditemukan.'))
      })
    },
    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const row = await findActive(id)
        if (!row) return err(notFound('Aturan berulang tidak ditemukan.'))
        const now = nowIso()
        await db
          .update(recurringRules)
          .set({ deletedAt: now, updatedAt: now })
          .where(eq(recurringRules.id, id))
        return ok(undefined)
      })
    },
  }
}

export type RecurringRepo = ReturnType<typeof createRecurringRepo>
