import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { categories, channels } from './schema'
import { seedDefaults } from './seed'
import { createTestContext, type TestContext } from './testing'

// A stable seed id we can single out to prove re-seeding leaves existing rows
// untouched (SEED_EXPENSE_CATEGORIES[0] = 'Stok Barang').
const STOK_BARANG_ID = '01900000-0000-7000-8000-000000000001'

let ctx: TestContext

beforeEach(async () => {
  // Unseeded context: createTestContext migrates but does not seed, so we can
  // observe seedDefaults' effect from an empty baseline.
  ctx = await createTestContext()
})

describe('seedDefaults', () => {
  it('starts from an empty database (test context is unseeded)', async () => {
    expect(await ctx.db.select().from(categories)).toHaveLength(0)
    expect(await ctx.db.select().from(channels)).toHaveLength(0)
  })

  it('creates the default categories and channels', async () => {
    await seedDefaults(ctx.db)
    const cats = await ctx.db.select().from(categories)
    const chans = await ctx.db.select().from(channels)
    expect(cats).toHaveLength(9)
    expect(cats.filter((c) => c.type === 'expense')).toHaveLength(7)
    expect(cats.filter((c) => c.type === 'income')).toHaveLength(2)
    expect(chans).toHaveLength(3)
    // Seed rows are active (not archived / not deleted) so they show up in the UI.
    expect(chans.every((c) => c.isArchived === false && c.deletedAt === null)).toBe(true)
  })

  it('is idempotent — running twice does not duplicate rows', async () => {
    await seedDefaults(ctx.db)
    await seedDefaults(ctx.db)
    expect(await ctx.db.select().from(categories)).toHaveLength(9)
    expect(await ctx.db.select().from(channels)).toHaveLength(3)
  })

  it('re-seeding preserves existing rows (onConflictDoNothing, not overwrite)', async () => {
    await seedDefaults(ctx.db)
    // A user renames a default category, then the app re-seeds on next boot.
    await ctx.db.update(categories).set({ name: 'Diganti' }).where(eq(categories.id, STOK_BARANG_ID))
    await seedDefaults(ctx.db)
    const row = (
      await ctx.db.select().from(categories).where(eq(categories.id, STOK_BARANG_ID))
    )[0]
    // The edit survives — the seed did not clobber it back to 'Stok Barang'.
    expect(row?.name).toBe('Diganti')
    expect(await ctx.db.select().from(categories)).toHaveLength(9)
  })
})
