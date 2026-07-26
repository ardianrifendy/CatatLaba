import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { type NewWallet, type Wallet, wallets } from '@/db/local/schema'
import { notFound } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export type WalletCreate = Omit<NewWallet, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
export type WalletUpdate = Partial<WalletCreate>

export function createWalletRepo({ db }: DbContext) {
  async function findActive(id: string): Promise<Wallet | undefined> {
    const rows = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), isNull(wallets.deletedAt)))
      .limit(1)
    return rows[0]
  }

  return {
    create(input: WalletCreate): Promise<Result<Wallet>> {
      return guard<Wallet>(async () => {
        const meta = newRowMeta()
        await db.insert(wallets).values({ ...input, ...meta })
        const row = await findActive(meta.id)
        return row ? ok(row) : err(notFound('Dompet tidak ditemukan setelah dibuat.'))
      })
    },
    list(): Promise<Result<Wallet[]>> {
      return guard<Wallet[]>(async () =>
        ok(
          await db
            .select()
            .from(wallets)
            .where(isNull(wallets.deletedAt))
            .orderBy(asc(wallets.createdAt)),
        ),
      )
    },
    getById(id: string): Promise<Result<Wallet>> {
      return guard<Wallet>(async () => {
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Dompet tidak ditemukan.'))
      })
    },
    update(id: string, patch: WalletUpdate): Promise<Result<Wallet>> {
      return guard<Wallet>(async () => {
        await db
          .update(wallets)
          .set({ ...patch, updatedAt: nowIso() })
          .where(and(eq(wallets.id, id), isNull(wallets.deletedAt)))
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Dompet tidak ditemukan.'))
      })
    },
    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const row = await findActive(id)
        if (!row) return err(notFound('Dompet tidak ditemukan.'))
        const now = nowIso()
        await db.update(wallets).set({ deletedAt: now, updatedAt: now }).where(eq(wallets.id, id))
        return ok(undefined)
      })
    },
  }
}

export type WalletRepo = ReturnType<typeof createWalletRepo>
