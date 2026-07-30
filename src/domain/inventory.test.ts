import { describe, expect, it } from 'vitest'
import {
  InventoryValidationError,
  applyPurchase,
  applySale,
  assertValidInventoryState,
  assertValidStockMutationSnapshot,
  movingAverageCost,
  reverseStockMutation,
  type InventoryState,
} from './inventory'

const stock = (stockQty: number, costPrice: number): InventoryState => ({ stockQty, costPrice })

describe('movingAverageCost', () => {
  it('weights existing inventory and the purchased units', () => {
    expect(movingAverageCost(stock(10, 12_000), { qty: 5, unitPrice: 18_000 })).toBe(14_000)
  })

  it('uses the purchase price for an empty product', () => {
    expect(movingAverageCost(stock(0, 0), { qty: 5, unitPrice: 18_000 })).toBe(18_000)
  })

  it('rounds fractional rupiah averages to the nearest rupiah', () => {
    expect(movingAverageCost(stock(1, 10), { qty: 2, unitPrice: 11 })).toBe(11)
  })

  it('rejects negative stock because it has no on-hand inventory to average', () => {
    expect(() => movingAverageCost(stock(-1, 10_000), { qty: 2, unitPrice: 12_000 })).toThrow(
      InventoryValidationError,
    )
  })
})

describe('applyPurchase', () => {
  it('increases stock and records a moving-average cost snapshot', () => {
    expect(applyPurchase(stock(10, 12_000), { qty: 5, unitPrice: 18_000 })).toEqual({
      kind: 'purchase',
      before: stock(10, 12_000),
      after: stock(15, 14_000),
      qty: 5,
      unitPrice: 18_000,
    })
  })

  it('retains cost while a negative stock balance is still not replenished', () => {
    expect(applyPurchase(stock(-5, 10_000), { qty: 2, unitPrice: 20_000 }).after).toEqual(
      stock(-3, 10_000),
    )
  })

  it('resets cost at zero and adopts purchase cost once stock becomes positive', () => {
    expect(applyPurchase(stock(-2, 10_000), { qty: 2, unitPrice: 20_000 }).after).toEqual(stock(0, 0))
    expect(applyPurchase(stock(-2, 10_000), { qty: 3, unitPrice: 20_000 }).after).toEqual(stock(1, 20_000))
  })
})

describe('applySale', () => {
  it('decreases stock and freezes cost/profit at the sale instant', () => {
    expect(applySale(stock(10, 12_000), { qty: 3, unitPrice: 20_000 })).toEqual({
      kind: 'sale',
      before: stock(10, 12_000),
      after: stock(7, 12_000),
      qty: 3,
      unitPrice: 20_000,
      sale: {
        unitCost: 12_000,
        revenue: 60_000,
        costOfGoodsSold: 36_000,
        profit: 24_000,
      },
    })
  })

  it('permits overselling and can snapshot a loss', () => {
    const result = applySale(stock(1, 20_000), { qty: 3, unitPrice: 15_000 })
    expect(result.after).toEqual(stock(-2, 20_000))
    expect(result.sale?.profit).toBe(-15_000)
  })
})

describe('reverseStockMutation', () => {
  it('restores exactly the state before a purchase or sale', () => {
    const purchase = applyPurchase(stock(10, 12_000), { qty: 5, unitPrice: 18_000 })
    const sale = applySale(stock(15, 14_000), { qty: 3, unitPrice: 20_000 })

    expect(reverseStockMutation(purchase, purchase.after)).toEqual(stock(10, 12_000))
    expect(reverseStockMutation(sale, sale.after)).toEqual(stock(15, 14_000))
  })

  it('refuses an out-of-order reversal when current inventory differs', () => {
    const snapshot = applySale(stock(10, 12_000), { qty: 3, unitPrice: 20_000 })
    expect(() => reverseStockMutation(snapshot, stock(6, 12_000))).toThrow(InventoryValidationError)
  })
})

describe('inventory validation', () => {
  it.each([
    () => assertValidInventoryState(stock(1.5, 10)),
    () => assertValidInventoryState(stock(1, -10)),
    () => applyPurchase(stock(1, 10), { qty: 0, unitPrice: 10 }),
    () => applyPurchase(stock(1, 10), { qty: 1, unitPrice: -10 }),
    () => applySale(stock(1, 10), { qty: 1.5, unitPrice: 10 }),
    () => applySale(stock(2, 10), { qty: 2, unitPrice: Number.MAX_SAFE_INTEGER }),
  ])('rejects invalid persisted state and mutation inputs', (operation) => {
    expect(operation).toThrow(InventoryValidationError)
  })

  it('rejects malformed persisted snapshots', () => {
    expect(() =>
      assertValidStockMutationSnapshot({
        ...applyPurchase(stock(1, 10), { qty: 1, unitPrice: 20 }),
        sale: { unitCost: 10, revenue: 20, costOfGoodsSold: 10, profit: 10 },
      }),
    ).toThrow(InventoryValidationError)

    const sale = applySale(stock(2, 10), { qty: 1, unitPrice: 20 })
    expect(() =>
      assertValidStockMutationSnapshot({
        ...sale,
        sale: { ...sale.sale!, profit: 999 },
      }),
    ).toThrow(InventoryValidationError)
  })
})
