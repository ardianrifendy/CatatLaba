import { describe, expect, it } from 'vitest'
import {
  buildCategoryTree,
  canBeParentOf,
  candidateParents,
  type CategoryLike,
  deleteBlockedByChildren,
  hasChildren,
} from './category-tree'

// Terse fixture builder so each test reads as a category list, not boilerplate.
function cat(
  partial: Partial<CategoryLike> & Pick<CategoryLike, 'id' | 'name'>,
): CategoryLike {
  return { type: 'expense', parentId: null, deletedAt: null, ...partial }
}

// Baseline fixture: two expense roots (one with two children), one income root.
const bahanBaku = cat({ id: 'c-bahan', name: 'Bahan Baku' })
const operasional = cat({ id: 'c-operasional', name: 'Operasional' })
const listrik = cat({ id: 'c-listrik', name: 'Listrik', parentId: operasional.id })
const air = cat({ id: 'c-air', name: 'Air', parentId: operasional.id })
const penjualan = cat({ id: 'c-penjualan', name: 'Penjualan', type: 'income' })
const all = [listrik, penjualan, operasional, air, bahanBaku]

describe('buildCategoryTree', () => {
  it('returns empty groups for an empty input', () => {
    expect(buildCategoryTree([])).toEqual({ expense: [], income: [] })
  })

  it('groups roots by type', () => {
    const tree = buildCategoryTree(all)
    expect(tree.expense.map((node) => node.category.id)).toEqual([
      bahanBaku.id,
      operasional.id,
    ])
    expect(tree.income.map((node) => node.category.id)).toEqual([penjualan.id])
  })

  it('sorts roots by name even when the input is unsorted', () => {
    const tree = buildCategoryTree([operasional, bahanBaku])
    expect(tree.expense.map((node) => node.category.name)).toEqual([
      'Bahan Baku',
      'Operasional',
    ])
  })

  it('attaches children under their parent, sorted by name', () => {
    const tree = buildCategoryTree(all)
    const parent = tree.expense.find((node) => node.category.id === operasional.id)
    expect(parent?.children.map((child) => child.name)).toEqual(['Air', 'Listrik'])
  })

  it('does not list children as roots (one level, two tiers only)', () => {
    const tree = buildCategoryTree(all)
    const rootIds = tree.expense.map((node) => node.category.id)
    expect(rootIds).not.toContain(listrik.id)
    expect(rootIds).not.toContain(air.id)
  })

  it('excludes soft-deleted roots and children', () => {
    const deletedRoot = cat({
      id: 'c-gone',
      name: 'Almarhum',
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    const deletedChild = cat({
      id: 'c-gone-child',
      name: 'Anak Almarhum',
      parentId: operasional.id,
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    const tree = buildCategoryTree([...all, deletedRoot, deletedChild])
    expect(tree.expense.map((node) => node.category.id)).not.toContain(deletedRoot.id)
    const parent = tree.expense.find((node) => node.category.id === operasional.id)
    expect(parent?.children.map((child) => child.id)).toEqual([air.id, listrik.id])
  })

  it('promotes a child to root when its parent is soft-deleted or missing', () => {
    const deletedParent = cat({
      id: 'c-dead-parent',
      name: 'Induk Terhapus',
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    const orphan = cat({ id: 'c-orphan', name: 'Yatim', parentId: deletedParent.id })
    const strayOrphan = cat({ id: 'c-stray', name: 'Nyasar', parentId: 'c-missing' })
    const tree = buildCategoryTree([deletedParent, orphan, strayOrphan])
    expect(tree.expense.map((node) => node.category.id)).toEqual([
      strayOrphan.id,
      orphan.id,
    ])
  })
})

describe('hasChildren', () => {
  it('is true when the category has an active child', () => {
    expect(hasChildren(all, operasional.id)).toBe(true)
  })

  it('is false when the category has no children', () => {
    expect(hasChildren(all, bahanBaku.id)).toBe(false)
  })

  it('ignores soft-deleted children', () => {
    const deletedChild = cat({
      id: 'c-x',
      name: 'X',
      parentId: bahanBaku.id,
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    expect(hasChildren([bahanBaku, deletedChild], bahanBaku.id)).toBe(false)
  })
})

describe('candidateParents', () => {
  it('returns only roots of the requested type, sorted by name', () => {
    const candidates = candidateParents(all, { type: 'expense' })
    expect(candidates.map((category) => category.id)).toEqual([
      bahanBaku.id,
      operasional.id,
    ])
  })

  it('excludes categories of the other type (same-type rule)', () => {
    const candidates = candidateParents(all, { type: 'income' })
    expect(candidates.map((category) => category.id)).toEqual([penjualan.id])
  })

  it('excludes children — a child can never be a parent (one level)', () => {
    const ids = candidateParents(all, { type: 'expense' }).map((category) => category.id)
    expect(ids).not.toContain(listrik.id)
    expect(ids).not.toContain(air.id)
  })

  it('excludes the category being edited from its own candidates', () => {
    const candidates = candidateParents(all, { type: 'expense', excludeId: bahanBaku.id })
    expect(candidates.map((category) => category.id)).toEqual([operasional.id])
  })

  it('returns no candidates when the edited category has children', () => {
    expect(candidateParents(all, { type: 'expense', excludeId: operasional.id })).toEqual([])
  })

  it('excludes soft-deleted roots', () => {
    const deletedRoot = cat({
      id: 'c-gone',
      name: 'Almarhum',
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    const ids = candidateParents([...all, deletedRoot], { type: 'expense' }).map(
      (category) => category.id,
    )
    expect(ids).not.toContain(deletedRoot.id)
  })

  it('treats a null excludeId like a brand-new category', () => {
    const candidates = candidateParents(all, { type: 'expense', excludeId: null })
    expect(candidates.map((category) => category.id)).toEqual([
      bahanBaku.id,
      operasional.id,
    ])
  })
})

describe('canBeParentOf', () => {
  it('accepts an active root as parent for a new category', () => {
    expect(canBeParentOf(all, operasional.id)).toBe(true)
  })

  it('rejects a missing parent', () => {
    expect(canBeParentOf(all, 'c-missing')).toBe(false)
  })

  it('rejects a soft-deleted parent', () => {
    const deletedRoot = cat({
      id: 'c-gone',
      name: 'Almarhum',
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    expect(canBeParentOf([...all, deletedRoot], deletedRoot.id)).toBe(false)
  })

  it('rejects a parent that is itself a child (one level only)', () => {
    expect(canBeParentOf(all, listrik.id)).toBe(false)
  })

  it('rejects a category as its own parent', () => {
    expect(canBeParentOf(all, bahanBaku.id, bahanBaku.id)).toBe(false)
  })

  it('rejects a cross-type assignment (same-type rule)', () => {
    expect(canBeParentOf(all, operasional.id, penjualan.id)).toBe(false)
  })

  it('rejects a child that has children of its own (a parent cannot become a child)', () => {
    expect(canBeParentOf(all, bahanBaku.id, operasional.id)).toBe(false)
  })

  it('accepts a valid same-type root child with no children', () => {
    expect(canBeParentOf(all, operasional.id, bahanBaku.id)).toBe(true)
  })
})

describe('deleteBlockedByChildren', () => {
  it('blocks deleting a category with active children', () => {
    expect(deleteBlockedByChildren(all, operasional.id)).toBe(true)
  })

  it('allows deleting a category without children', () => {
    expect(deleteBlockedByChildren(all, bahanBaku.id)).toBe(false)
    expect(deleteBlockedByChildren(all, listrik.id)).toBe(false)
  })

  it('ignores soft-deleted children', () => {
    const deletedChild = cat({
      id: 'c-x',
      name: 'X',
      parentId: bahanBaku.id,
      deletedAt: '2026-07-26T00:00:00.000Z',
    })
    expect(deleteBlockedByChildren([bahanBaku, deletedChild], bahanBaku.id)).toBe(false)
  })
})
