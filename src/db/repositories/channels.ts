import { and, asc, eq, isNull } from 'drizzle-orm'
import type { DbContext } from '@/db/local'
import { channels, type Channel, type NewChannel } from '@/db/local/schema'
import { notFound } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'
import { nowIso } from '@/lib/time'
import { guard, newRowMeta } from './shared'

export type ChannelCreate = Omit<NewChannel, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
export type ChannelUpdate = Partial<ChannelCreate>

export function createChannelRepo({ db }: DbContext) {
  async function findActive(id: string): Promise<Channel | undefined> {
    const rows = await db
      .select()
      .from(channels)
      .where(and(eq(channels.id, id), isNull(channels.deletedAt)))
      .limit(1)
    return rows[0]
  }

  return {
    create(input: ChannelCreate): Promise<Result<Channel>> {
      return guard<Channel>(async () => {
        const meta = newRowMeta()
        await db.insert(channels).values({ ...input, ...meta })
        const row = await findActive(meta.id)
        return row ? ok(row) : err(notFound('Channel tidak ditemukan setelah dibuat.'))
      })
    },
    list(): Promise<Result<Channel[]>> {
      return guard<Channel[]>(async () =>
        ok(
          await db
            .select()
            .from(channels)
            .where(isNull(channels.deletedAt))
            .orderBy(asc(channels.createdAt)),
        ),
      )
    },
    getById(id: string): Promise<Result<Channel>> {
      return guard<Channel>(async () => {
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Channel tidak ditemukan.'))
      })
    },
    update(id: string, patch: ChannelUpdate): Promise<Result<Channel>> {
      return guard<Channel>(async () => {
        await db
          .update(channels)
          .set({ ...patch, updatedAt: nowIso() })
          .where(and(eq(channels.id, id), isNull(channels.deletedAt)))
        const row = await findActive(id)
        return row ? ok(row) : err(notFound('Channel tidak ditemukan.'))
      })
    },
    softDelete(id: string): Promise<Result<void>> {
      return guard<void>(async () => {
        const row = await findActive(id)
        if (!row) return err(notFound('Channel tidak ditemukan.'))
        const now = nowIso()
        await db.update(channels).set({ deletedAt: now, updatedAt: now }).where(eq(channels.id, id))
        return ok(undefined)
      })
    },
  }
}

export type ChannelRepo = ReturnType<typeof createChannelRepo>
