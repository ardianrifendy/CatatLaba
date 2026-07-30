import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { budgets, type Budget, categories, type NewBudget } from '@/db/local/schema'
import { notFound, validationError } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export type BudgetCreate = Omit<NewBudget, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
// The unique (category_id, month) index means create() surfaces a CONFLICT
// AppError when a budget already exists for that pair. Only the amount is
// mutable afterwards.
export type BudgetUpdate = Pick<Partial<BudgetCreate>, 'amount'>

function validAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount > 0
}

function validMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export function createBudgetRepo({ db }: DbContext) {
  async function findActive(id: string): Promise<Budget | undefined> {
    const rows = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), isNull(budgets.deletedAt)))
      .limit(1)
    return rows[0]
  }

  return {
    create(input: BudgetCreate): Promise<Result<Budget>> {
      return guard<Budget>(async () => {
        if (!validMonth(input.month)) {
          return err(validationError('Bulan anggaran harus menggunakan format YYYY-MM.'))
        }
        if (!validAmount(input.amount)) {
          return err(validationError('Nominal anggaran harus bilangan bulat lebih dari nol.'))
        }
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(
              eq(categories.id, input.categoryId),
              eq(categories.type, 'expense'),
              isNull(categories.deletedAt),
            ),
          )
          .limit(1)
        if (!category) {
          return err(validationError('Anggaran hanya dapat memakai kategori pengeluaran aktif.'))
        }
        const meta = newRowMeta()
        await db.insert(budgets).values({ ...input, ...meta })
        const row = await findActive(meta.id)
        return row ? ok(row) : err(notFound('Anggaran tidak ditemukan setelah dibuat.'))
      })
    },
    list(): Promise<Result<Budget[]>> {
      return guard<Budget[]>(async () =>
        ok(
          await db
            .select()
            .from(budgets)
            .where(isNull(budgets.deletedAt))
            .orderBy(asc(budgets.month)),
        ),
      )
    },
    getById(id: string): Promise<Result<Budget>> {
      return guard<Budget>(async () => {
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Anggaran tidak ditemukan.'))
      })
    },
    update(id: string, patch: BudgetUpdate): Promise<Result<Budget>> {
      return guard<Budget>(async () => {
        if (patch.amount !== undefined && !validAmount(patch.amount)) {
          return err(validationError('Nominal anggaran harus bilangan bulat lebih dari nol.'))
        }
        await db
          .update(budgets)
          .set({ ...patch, updatedAt: nowIso() })
          .where(and(eq(budgets.id, id), isNull(budgets.deletedAt)))
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Anggaran tidak ditemukan.'))
      })
    },
    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const row = await findActive(id)
        if (!row) return err(notFound('Anggaran tidak ditemukan.'))
        const now = nowIso()
        await db.update(budgets).set({ deletedAt: now, updatedAt: now }).where(eq(budgets.id, id))
        return ok(undefined)
      })
    },
  }
}

export type BudgetRepo = ReturnType<typeof createBudgetRepo>
