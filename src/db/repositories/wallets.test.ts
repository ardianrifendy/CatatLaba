import { beforeEach, describe, expect, it } from 'vitest'
import { createTestContext } from '@/db/local/testing'
import type { Result } from '@/lib/result'
import { createRepositories, type Repositories } from './index'

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`)
  return result.value
}

let repos: Repositories

beforeEach(async () => {
  repos = createRepositories(await createTestContext())
})

describe('wallet repository', () => {
  it('creates a wallet applying column defaults', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    expect(wallet.id).toMatch(/-/)
    expect(wallet.initialBalance).toBe(0)
    expect(wallet.isArchived).toBe(false)
    expect(wallet.deletedAt).toBeNull()
  })

  it('lists only active wallets, in creation order', async () => {
    await repos.wallets.create({ name: 'A', type: 'cash' })
    const b = unwrap(await repos.wallets.create({ name: 'B', type: 'bank', initialBalance: 5000 }))
    unwrap(await repos.wallets.softDelete(b.id))
    const list = unwrap(await repos.wallets.list())
    expect(list.map((w) => w.name)).toEqual(['A'])
  })

  it('returns NOT_FOUND for a missing wallet', async () => {
    const result = await repos.wallets.getById('does-not-exist')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('updates fields and does not go back in time on updated_at', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    const updated = unwrap(
      await repos.wallets.update(wallet.id, { name: 'Kas Utama', isArchived: true }),
    )
    expect(updated.name).toBe('Kas Utama')
    expect(updated.isArchived).toBe(true)
    expect(updated.updatedAt >= wallet.updatedAt).toBe(true)
  })

  it('soft-deletes so the row disappears from reads', async () => {
    const wallet = unwrap(await repos.wallets.create({ name: 'Kas', type: 'cash' }))
    expect((await repos.wallets.softDelete(wallet.id)).ok).toBe(true)
    expect((await repos.wallets.getById(wallet.id)).ok).toBe(false)
    // Deleting again is a NOT_FOUND, not a crash.
    const second = await repos.wallets.softDelete(wallet.id)
    expect(second.ok).toBe(false)
  })
})
