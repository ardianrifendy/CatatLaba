import { and, asc, desc, eq, gte, isNull, lt } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import {
  type Transaction,
  type TransactionItem,
  transactionItems,
  transactions,
} from '@/db/local/schema'
import { type AppError, notFound, validationError } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export interface TransactionItemInput {
  productId: string
  qty: number
  unitPrice: number
  unitCost?: number
}

export interface TransactionCreate {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  walletId: string
  counterWalletId?: string | null
  categoryId?: string | null
  channelId?: string | null
  note?: string | null
  occurredAt: string
  recurringRuleId?: string | null
  items?: TransactionItemInput[]
}

export interface TransactionWithItems {
  transaction: Transaction
  items: TransactionItem[]
}

export interface TransactionFilter {
  type?: 'income' | 'expense' | 'transfer'
  walletId?: string
  categoryId?: string
  channelId?: string
  /** occurred_at >= from (ISO-8601), inclusive */
  from?: string
  /** occurred_at < to (ISO-8601), exclusive */
  to?: string
}

// Structural integrity guards only (transfer/counter-wallet shape, positive
// integer amount). Business reconciliation that depends on stock/cost — the
// `amount == Σ items` rule and moving-average effects — is deferred to Phase 4,
// where transaction writes will run through the domain layer.
function validateDraft(input: TransactionCreate): AppError | null {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return validationError('Nominal transaksi harus bilangan bulat lebih dari nol.')
  }
  if (input.type === 'transfer') {
    if (!input.counterWalletId) return validationError('Transfer membutuhkan dompet tujuan.')
    if (input.counterWalletId === input.walletId) {
      return validationError('Dompet asal dan tujuan tidak boleh sama.')
    }
    if (input.categoryId) return validationError('Transfer tidak memakai kategori.')
  } else if (input.counterWalletId) {
    return validationError('Hanya transfer yang boleh memiliki dompet tujuan.')
  }
  return null
}

export function createTransactionRepo({ db, exec }: DbContext) {
  async function findActiveHeader(id: string): Promise<Transaction | undefined> {
    const rows = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1)
    return rows[0]
  }

  async function activeItems(transactionId: string): Promise<TransactionItem[]> {
    return db
      .select()
      .from(transactionItems)
      .where(
        and(
          eq(transactionItems.transactionId, transactionId),
          isNull(transactionItems.deletedAt),
        ),
      )
      .orderBy(asc(transactionItems.createdAt))
  }

  return {
    create(input: TransactionCreate): Promise<Result<TransactionWithItems>> {
      return guard<TransactionWithItems>(async () => {
        const invalid = validateDraft(input)
        if (invalid) return err(invalid)

        const meta = newRowMeta()
        // Atomic header + items: Drizzle's async sqlite-proxy driver has no
        // db.transaction(), so we drive BEGIN/COMMIT through the shared executor
        // (same underlying connection as `db`).
        await exec.run('BEGIN;')
        try {
          await db.insert(transactions).values({
            id: meta.id,
            type: input.type,
            amount: input.amount,
            walletId: input.walletId,
            counterWalletId: input.counterWalletId ?? null,
            categoryId: input.categoryId ?? null,
            channelId: input.channelId ?? null,
            note: input.note ?? null,
            occurredAt: input.occurredAt,
            recurringRuleId: input.recurringRuleId ?? null,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
            deletedAt: null,
          })
          for (const item of input.items ?? []) {
            const im = newRowMeta()
            await db.insert(transactionItems).values({
              id: im.id,
              transactionId: meta.id,
              productId: item.productId,
              qty: item.qty,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost ?? 0,
              createdAt: im.createdAt,
              updatedAt: im.updatedAt,
              deletedAt: null,
            })
          }
          await exec.run('COMMIT;')
        } catch (cause) {
          await exec.run('ROLLBACK;')
          throw cause
        }

        const header = await findActiveHeader(meta.id)
        if (!header) return err(notFound('Transaksi tidak ditemukan setelah dibuat.'))
        return ok({ transaction: header, items: await activeItems(meta.id) })
      })
    },

    list(filter: TransactionFilter = {}): Promise<Result<Transaction[]>> {
      return guard<Transaction[]>(async () => {
        const conditions = [isNull(transactions.deletedAt)]
        if (filter.type) conditions.push(eq(transactions.type, filter.type))
        if (filter.walletId) conditions.push(eq(transactions.walletId, filter.walletId))
        if (filter.categoryId) conditions.push(eq(transactions.categoryId, filter.categoryId))
        if (filter.channelId) conditions.push(eq(transactions.channelId, filter.channelId))
        if (filter.from) conditions.push(gte(transactions.occurredAt, filter.from))
        if (filter.to) conditions.push(lt(transactions.occurredAt, filter.to))
        return ok(
          await db
            .select()
            .from(transactions)
            .where(and(...conditions))
            .orderBy(desc(transactions.occurredAt)),
        )
      })
    },

    getById(id: string): Promise<Result<TransactionWithItems>> {
      return guard<TransactionWithItems>(async () => {
        const header = await findActiveHeader(id)
        if (!header) return err(notFound('Transaksi tidak ditemukan.'))
        return ok({ transaction: header, items: await activeItems(id) })
      })
    },

    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const header = await findActiveHeader(id)
        if (!header) return err(notFound('Transaksi tidak ditemukan.'))
        const now = nowIso()
        // Soft-delete the header and its items together so reports (which filter
        // on deleted_at IS NULL) never see orphaned items.
        await exec.run('BEGIN;')
        try {
          await db
            .update(transactions)
            .set({ deletedAt: now, updatedAt: now })
            .where(eq(transactions.id, id))
          await db
            .update(transactionItems)
            .set({ deletedAt: now, updatedAt: now })
            .where(and(eq(transactionItems.transactionId, id), isNull(transactionItems.deletedAt)))
          await exec.run('COMMIT;')
        } catch (cause) {
          await exec.run('ROLLBACK;')
          throw cause
        }
        return ok(undefined)
      })
    },
  }
}

export type TransactionRepo = ReturnType<typeof createTransactionRepo>
