import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import {
  type NewRecurringRule,
  type RecurringRule,
  recurringRules,
  transactions,
  type Transaction,
} from '@/db/local/schema'
import { generateDueRules } from '@/domain/recurring'
import { notFound, validationError } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export type RecurringCreate = Omit<
  NewRecurringRule,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>
export type RecurringUpdate = Partial<RecurringCreate>

function validateRule(input: RecurringCreate): ReturnType<typeof validationError> | null {
  if (input.name.trim() === '') return validationError('Nama aturan berulang wajib diisi.')
  if (input.name.trim().length > 80) return validationError('Nama aturan maksimal 80 karakter.')
  if (input.frequency === 'monthly' && (!Number.isSafeInteger(input.day) || input.day < 1 || input.day > 28)) {
    return validationError('Tanggal bulanan harus antara 1 dan 28.')
  }
  if (input.frequency === 'weekly' && (!Number.isSafeInteger(input.day) || input.day < 1 || input.day > 7)) {
    return validationError('Hari mingguan harus antara 1 dan 7.')
  }
  if (input.templateType !== 'income' && input.templateType !== 'expense') {
    return validationError('Tipe aturan hanya pemasukan atau pengeluaran.')
  }
  if (!Number.isSafeInteger(input.templateAmount) || input.templateAmount <= 0) {
    return validationError('Nominal aturan harus bilangan bulat lebih dari nol.')
  }
  if (input.templateWalletId.trim() === '') {
    return validationError('Dompet aturan wajib dipilih.')
  }
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(input.nextRunAt) || !Number.isFinite(Date.parse(input.nextRunAt))) {
    return validationError('Jadwal berikutnya harus berupa waktu ISO-8601 yang valid.')
  }
  return null
}

export function createRecurringRepo({ db, exec }: DbContext) {
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
        const invalid = validateRule(input)
        if (invalid) return err(invalid)
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
        const current = await findActive(id)
        if (!current) return err(notFound('Aturan berulang tidak ditemukan.'))
        const invalid = validateRule({ ...current, ...patch })
        if (invalid) return err(invalid)
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
    generateDue(now: string = nowIso()): Promise<Result<Transaction[]>> {
      return guard<Transaction[]>(async () => {
        const rules = await db
          .select()
          .from(recurringRules)
          .where(and(eq(recurringRules.isActive, true), isNull(recurringRules.deletedAt)))
          .orderBy(asc(recurringRules.nextRunAt))
        const due = generateDueRules(rules, now)
        if (due.length === 0) return ok([])

        const generated: Transaction[] = []
        await exec.run('BEGIN;')
        try {
          for (const result of due) {
            const rule = rules.find((candidate) => candidate.id === result.ruleId)
            if (!rule) continue
            for (const occurrence of result.occurrences) {
              const meta = newRowMeta()
              const transaction: Transaction = {
                id: meta.id,
                type: rule.templateType,
                amount: rule.templateAmount,
                walletId: rule.templateWalletId,
                counterWalletId: null,
                categoryId: rule.templateCategoryId,
                channelId: rule.templateChannelId,
                note: rule.templateNote,
                occurredAt: occurrence.occurredAt,
                recurringRuleId: rule.id,
                createdAt: meta.createdAt,
                updatedAt: meta.updatedAt,
                deletedAt: null,
              }
              await db.insert(transactions).values(transaction)
              generated.push(transaction)
            }
            await db
              .update(recurringRules)
              .set({ nextRunAt: result.nextRunAt, updatedAt: nowIso() })
              .where(and(eq(recurringRules.id, rule.id), isNull(recurringRules.deletedAt)))
          }
          await exec.run('COMMIT;')
        } catch (cause) {
          await exec.run('ROLLBACK;')
          throw cause
        }
        return ok(generated)
      })
    },
  }
}

export type RecurringRepo = ReturnType<typeof createRecurringRepo>
