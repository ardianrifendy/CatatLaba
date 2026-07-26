// Pure category-tree derivation. Categories form a one-level hierarchy
// (SCHEMA.md: `parent_id` is a self-FK, one level only, enforced here — not in
// the DB). This module holds the grouping/sorting and every hierarchy rule with
// no I/O: the caller fetches rows and passes them in, keeping the logic
// unit-testable and decoupled from Drizzle.

// Structural input shape: only the fields the derivation reads. The real
// Drizzle `Category` rows carry more, but are assignable to this, so callers
// can pass rows straight through without mapping.
export interface CategoryLike {
  readonly id: string
  readonly name: string
  readonly type: 'income' | 'expense'
  readonly parentId: string | null
  // Soft-deleted rows are invisible to every function here.
  readonly deletedAt?: string | null
}

// A root category with its (directly attached) children. Generic so callers
// that pass full `Category` rows get full rows back.
export interface CategoryNode<T extends CategoryLike = CategoryLike> {
  readonly category: T
  readonly children: readonly T[]
}

function isActive(category: CategoryLike): boolean {
  return category.deletedAt == null
}

// Stable Bahasa-aware alphabetical order for display lists.
function byName(a: CategoryLike, b: CategoryLike): number {
  return a.name.localeCompare(b.name, 'id')
}

/**
 * Groups active categories into a two-level tree per type. Roots are sorted by
 * name, each carrying its children sorted by name. Soft-deleted rows are
 * excluded entirely. A child whose parent is missing or soft-deleted is
 * promoted to a root so it never silently disappears from the UI.
 */
export function buildCategoryTree<T extends CategoryLike>(
  categories: readonly T[],
): { expense: CategoryNode<T>[]; income: CategoryNode<T>[] } {
  const active = categories.filter(isActive)
  const activeIds = new Set(active.map((category) => category.id))

  const roots: T[] = []
  const childrenByParent = new Map<string, T[]>()
  for (const category of active) {
    if (category.parentId != null && activeIds.has(category.parentId)) {
      const siblings = childrenByParent.get(category.parentId)
      if (siblings !== undefined) siblings.push(category)
      else childrenByParent.set(category.parentId, [category])
    } else {
      roots.push(category)
    }
  }
  roots.sort(byName)

  const tree = { expense: [] as CategoryNode<T>[], income: [] as CategoryNode<T>[] }
  for (const root of roots) {
    const children = childrenByParent.get(root.id) ?? []
    children.sort(byName)
    tree[root.type].push({ category: root, children })
  }
  return tree
}

/** True when `id` has at least one active (non-deleted) child. */
export function hasChildren(categories: readonly CategoryLike[], id: string): boolean {
  return categories.some((category) => isActive(category) && category.parentId === id)
}

/**
 * Roots eligible to become the parent of a category. Enforces every hierarchy
 * rule at once: candidates are active, of the SAME type, and roots themselves
 * (one level only — a child can never be a parent). `excludeId` (the category
 * being edited) is excluded from its own candidates, and when it already has
 * children there are no candidates at all: a parent cannot become a child.
 * Sorted by name, ready for a picker.
 */
export function candidateParents<T extends CategoryLike>(
  categories: readonly T[],
  opts: { type: CategoryLike['type']; excludeId?: string | null },
): T[] {
  const excludeId = opts.excludeId ?? null
  if (excludeId != null && hasChildren(categories, excludeId)) return []
  return categories
    .filter(
      (category) =>
        isActive(category) &&
        category.type === opts.type &&
        category.parentId == null &&
        category.id !== excludeId,
    )
    .sort(byName)
}

/**
 * Whether `parentId` may be assigned as the parent of `childId` (or of a
 * brand-new category when `childId` is omitted): the parent must exist, be
 * active, and be a root (one level only); when a child is given it must exist,
 * be active, share the parent's type, not be the parent itself, and have no
 * children of its own (a parent cannot become a child).
 */
export function canBeParentOf(
  categories: readonly CategoryLike[],
  parentId: string,
  childId?: string,
): boolean {
  const parent = categories.find((category) => category.id === parentId && isActive(category))
  if (parent === undefined || parent.parentId != null) return false
  if (childId === undefined) return true
  if (childId === parentId) return false
  const child = categories.find((category) => category.id === childId && isActive(category))
  if (child === undefined || child.type !== parent.type) return false
  return !hasChildren(categories, childId)
}

/**
 * Soft-deleting a category with active children would orphan them, so the
 * delete is blocked until the children are deleted or moved.
 */
export function deleteBlockedByChildren(
  categories: readonly CategoryLike[],
  id: string,
): boolean {
  return hasChildren(categories, id)
}
