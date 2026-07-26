import type { DbContext } from '@/db/local'
import { createBudgetRepo } from './budgets'
import { createCategoryRepo } from './categories'
import { createChannelRepo } from './channels'
import { createProductRepo } from './products'
import { createRecurringRepo } from './recurring'
import { createTransactionRepo } from './transactions'
import { createWalletRepo } from './wallets'

// Builds every repository over a single database context. Callers (UI hooks,
// tests, seeders) get one object with all aggregates.
export function createRepositories(ctx: DbContext) {
  return {
    wallets: createWalletRepo(ctx),
    categories: createCategoryRepo(ctx),
    channels: createChannelRepo(ctx),
    products: createProductRepo(ctx),
    budgets: createBudgetRepo(ctx),
    recurring: createRecurringRepo(ctx),
    transactions: createTransactionRepo(ctx),
  }
}

export type Repositories = ReturnType<typeof createRepositories>

export * from './wallets'
export * from './categories'
export * from './channels'
export * from './products'
export * from './budgets'
export * from './recurring'
export * from './transactions'
