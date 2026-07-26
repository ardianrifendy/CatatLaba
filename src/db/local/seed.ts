import type { LocalDb } from './client'
import { categories, channels } from './schema'
import { nowIso } from '@/lib/time'

// Default reference data created on first run (SCHEMA.md). Seed rows use FIXED
// ids so seeding is idempotent by construction: re-running is a no-op via
// `onConflictDoNothing` on the primary key, and — because ids are stable — two
// devices that both seed converge on the same rows instead of duplicating when
// sync arrives (Phase 7). Ids are valid UUIDv7-shaped constants; the segment
// suffix encodes the seed group (0=expense cat, 1=income cat, 2=channel).
const SEED_EXPENSE_CATEGORIES: ReadonlyArray<{ id: string; name: string }> = [
  { id: '01900000-0000-7000-8000-000000000001', name: 'Stok Barang' },
  { id: '01900000-0000-7000-8000-000000000002', name: 'Ongkir' },
  { id: '01900000-0000-7000-8000-000000000003', name: 'Packing' },
  { id: '01900000-0000-7000-8000-000000000004', name: 'Fee Platform' },
  { id: '01900000-0000-7000-8000-000000000005', name: 'Iklan' },
  { id: '01900000-0000-7000-8000-000000000006', name: 'Operasional' },
  { id: '01900000-0000-7000-8000-000000000007', name: 'Pribadi' },
]

const SEED_INCOME_CATEGORIES: ReadonlyArray<{ id: string; name: string }> = [
  { id: '01900000-0000-7000-8000-000000000011', name: 'Penjualan' },
  { id: '01900000-0000-7000-8000-000000000012', name: 'Lainnya' },
]

const SEED_CHANNELS: ReadonlyArray<{ id: string; name: string }> = [
  { id: '01900000-0000-7000-8000-000000000021', name: 'Shopee' },
  { id: '01900000-0000-7000-8000-000000000022', name: 'Tokopedia' },
  { id: '01900000-0000-7000-8000-000000000023', name: 'Offline' },
]

// Inserts the default categories and channels if they are not already present.
// Idempotent — safe to call on every startup.
export async function seedDefaults(db: LocalDb): Promise<void> {
  const now = nowIso()

  const categoryRows = [
    ...SEED_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: 'expense' as const })),
    ...SEED_INCOME_CATEGORIES.map((c) => ({ ...c, type: 'income' as const })),
  ].map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    parentId: null,
    icon: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }))

  const channelRows = SEED_CHANNELS.map((ch) => ({
    id: ch.id,
    name: ch.name,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }))

  await db.insert(categories).values(categoryRows).onConflictDoNothing()
  await db.insert(channels).values(channelRows).onConflictDoNothing()
}
