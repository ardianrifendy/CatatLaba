// Pure inventory accounting for product-backed transaction items. All money is
// integer IDR and all quantities are whole units; I/O and persistence stay in
// the application service/repository layer.

export interface InventoryState {
  /** May be negative when the caller has explicitly allowed overselling. */
  readonly stockQty: number
  /** Moving-average unit cost in integer IDR. */
  readonly costPrice: number
}

export interface PurchaseStockInput {
  readonly qty: number
  /** Actual purchase price per unit. */
  readonly unitPrice: number
}

export interface SaleStockInput {
  readonly qty: number
  /** Actual selling price per unit. */
  readonly unitPrice: number
}

export interface SaleProfitSnapshot {
  /** Cost frozen at the instant the sale is recorded. */
  readonly unitCost: number
  readonly revenue: number
  readonly costOfGoodsSold: number
  readonly profit: number
}

export interface StockMutationSnapshot {
  readonly kind: 'purchase' | 'sale'
  readonly before: InventoryState
  readonly after: InventoryState
  readonly qty: number
  readonly unitPrice: number
  /** Present only for a sale, whose cost/profit must remain immutable later. */
  readonly sale?: SaleProfitSnapshot
}

export class InventoryValidationError extends RangeError {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryValidationError'
  }
}

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new InventoryValidationError(`${label} must be a safe integer.`)
  }
}

function assertNonNegativeMoney(value: number, label: string): void {
  assertSafeInteger(value, label)
  if (value < 0) throw new InventoryValidationError(`${label} must be non-negative.`)
}

function assertPositiveQty(qty: number): void {
  assertSafeInteger(qty, 'Quantity')
  if (qty <= 0) throw new InventoryValidationError('Quantity must be greater than zero.')
}

function assertSafeResult(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new InventoryValidationError(`${label} exceeds safe integer precision.`)
  }
  return value
}

function sameState(left: InventoryState, right: InventoryState): boolean {
  return left.stockQty === right.stockQty && left.costPrice === right.costPrice
}

/** Validates a persisted or in-memory product inventory state. */
export function assertValidInventoryState(state: InventoryState): void {
  assertSafeInteger(state.stockQty, 'Stock quantity')
  assertNonNegativeMoney(state.costPrice, 'Cost price')
}

/**
 * Moving-average cost for a normal (non-negative) on-hand balance. The result
 * is rounded to the nearest whole rupiah because the persisted schema stores
 * integer IDR. Negative-stock replenishment is handled by `applyPurchase` with
 * an explicit, deterministic policy instead of this formula.
 */
export function movingAverageCost(
  current: InventoryState,
  purchase: PurchaseStockInput,
): number {
  assertValidInventoryState(current)
  assertPositiveQty(purchase.qty)
  assertNonNegativeMoney(purchase.unitPrice, 'Purchase unit price')
  if (current.stockQty < 0) {
    throw new InventoryValidationError('Moving average requires non-negative current stock.')
  }

  const currentValue = assertSafeResult(current.stockQty * current.costPrice, 'Current inventory value')
  const purchaseValue = assertSafeResult(purchase.qty * purchase.unitPrice, 'Purchase value')
  const totalQty = assertSafeResult(current.stockQty + purchase.qty, 'Stock quantity')
  const average = Math.round((currentValue + purchaseValue) / totalQty)
  return assertSafeResult(average, 'Moving-average cost')
}

/**
 * Applies a purchase and returns an immutable audit snapshot for a later
 * edit/delete reversal. For stock >= 0 it uses standard moving average.
 *
 * When overselling has made stock negative, no physical on-hand inventory
 * exists to average. A purchase that remains below zero retains the last known
 * cost; one that reaches zero resets cost to 0; one that becomes positive uses
 * the purchase price for the newly on-hand units.
 */
export function applyPurchase(
  current: InventoryState,
  purchase: PurchaseStockInput,
): StockMutationSnapshot {
  assertValidInventoryState(current)
  assertPositiveQty(purchase.qty)
  assertNonNegativeMoney(purchase.unitPrice, 'Purchase unit price')

  const stockQty = assertSafeResult(current.stockQty + purchase.qty, 'Stock quantity')
  let costPrice: number
  if (current.stockQty >= 0) {
    costPrice = movingAverageCost(current, purchase)
  } else if (stockQty < 0) {
    costPrice = current.costPrice
  } else if (stockQty === 0) {
    costPrice = 0
  } else {
    costPrice = purchase.unitPrice
  }

  return {
    kind: 'purchase',
    before: { stockQty: current.stockQty, costPrice: current.costPrice },
    after: { stockQty, costPrice },
    qty: purchase.qty,
    unitPrice: purchase.unitPrice,
  }
}

/**
 * Applies a sale. It intentionally does not block stock below zero: the UI or
 * service may warn the user, while this function preserves the ledger effect.
 */
export function applySale(current: InventoryState, sale: SaleStockInput): StockMutationSnapshot {
  assertValidInventoryState(current)
  assertPositiveQty(sale.qty)
  assertNonNegativeMoney(sale.unitPrice, 'Sale unit price')

  const stockQty = assertSafeResult(current.stockQty - sale.qty, 'Stock quantity')
  const revenue = assertSafeResult(sale.unitPrice * sale.qty, 'Sale revenue')
  const costOfGoodsSold = assertSafeResult(current.costPrice * sale.qty, 'Cost of goods sold')
  const profit = assertSafeResult(revenue - costOfGoodsSold, 'Sale profit')

  return {
    kind: 'sale',
    before: { stockQty: current.stockQty, costPrice: current.costPrice },
    after: { stockQty, costPrice: current.costPrice },
    qty: sale.qty,
    unitPrice: sale.unitPrice,
    sale: {
      unitCost: current.costPrice,
      revenue,
      costOfGoodsSold,
      profit,
    },
  }
}

/**
 * Restores the exact pre-mutation state. Passing the current state protects
 * against reversing an item after another stock mutation has already changed
 * the product; omit it only when the caller has serialized mutations itself.
 */
export function reverseStockMutation(
  snapshot: StockMutationSnapshot,
  current?: InventoryState,
): InventoryState {
  assertValidStockMutationSnapshot(snapshot)
  if (current !== undefined) {
    assertValidInventoryState(current)
    if (!sameState(current, snapshot.after)) {
      throw new InventoryValidationError('Cannot reverse stock mutation: current state does not match snapshot.')
    }
  }
  return { stockQty: snapshot.before.stockQty, costPrice: snapshot.before.costPrice }
}

/** Validates a mutation snapshot before it is persisted or used for reversal. */
export function assertValidStockMutationSnapshot(snapshot: StockMutationSnapshot): void {
  assertValidInventoryState(snapshot.before)
  assertValidInventoryState(snapshot.after)
  assertPositiveQty(snapshot.qty)
  assertNonNegativeMoney(snapshot.unitPrice, 'Mutation unit price')

  if (snapshot.kind === 'purchase') {
    if (snapshot.sale !== undefined) {
      throw new InventoryValidationError('A purchase snapshot cannot contain sale profit.')
    }
    const expected = applyPurchase(snapshot.before, {
      qty: snapshot.qty,
      unitPrice: snapshot.unitPrice,
    })
    if (!sameState(snapshot.after, expected.after)) {
      throw new InventoryValidationError('Purchase snapshot does not match its stock mutation.')
    }
    return
  }

  if (snapshot.sale === undefined) {
    throw new InventoryValidationError('A sale snapshot requires frozen cost and profit.')
  }
  assertNonNegativeMoney(snapshot.sale.unitCost, 'Sale unit cost')
  assertNonNegativeMoney(snapshot.sale.revenue, 'Sale revenue')
  assertNonNegativeMoney(snapshot.sale.costOfGoodsSold, 'Cost of goods sold')
  assertSafeInteger(snapshot.sale.profit, 'Sale profit')

  const expected = applySale(snapshot.before, { qty: snapshot.qty, unitPrice: snapshot.unitPrice })
  if (
    !sameState(snapshot.after, expected.after) ||
    snapshot.sale.unitCost !== expected.sale?.unitCost ||
    snapshot.sale.revenue !== expected.sale?.revenue ||
    snapshot.sale.costOfGoodsSold !== expected.sale?.costOfGoodsSold ||
    snapshot.sale.profit !== expected.sale?.profit
  ) {
    throw new InventoryValidationError('Sale snapshot does not match its stock mutation or frozen profit.')
  }
}
