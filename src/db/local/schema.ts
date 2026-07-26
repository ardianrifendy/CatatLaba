import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Convention columns shared by every domain table (SCHEMA.md): UUIDv7 text
// primary key, ISO-8601 UTC timestamps, soft-delete via `deleted_at`. `user_id`
// is remote-only (added in the Postgres mirror, Phase 7) and is intentionally
// absent from the local schema. `sync_state` is the one table that does NOT get
// these columns.
//
// Foreign keys are declared in the hand-authored migration SQL (the source of
// truth for DDL), not via Drizzle `.references()` — see migrations.ts. That
// avoids the awkward forward/self-reference typing dance here and keeps this
// file a plain description of the physical columns.
const base = {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
}

// --- app_meta --------------------------------------------------------------
// Bootstrap/meta table (not a domain entity). Keeps its own integer clock; it
// predates the ISO-8601 convention and is only ever read by the boot self-check.
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

// --- wallets ---------------------------------------------------------------
export const wallets = sqliteTable('wallets', {
  ...base,
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'bank', 'ewallet'] }).notNull(),
  initialBalance: integer('initial_balance').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
})

// --- categories ------------------------------------------------------------
// `parentId` is a self-FK, one level only (enforced in the domain/repository
// layer, not the DB).
export const categories = sqliteTable('categories', {
  ...base,
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  parentId: text('parent_id'),
  icon: text('icon'),
})

// --- channels --------------------------------------------------------------
export const channels = sqliteTable('channels', {
  ...base,
  name: text('name').notNull(),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
})

// --- products --------------------------------------------------------------
// `costPrice` is a moving average maintained by purchase transactions (Phase 4);
// `stockQty` likewise. Both are plain integers here — the domain layer owns all
// mutations (RULES.md: no raw stock/cost writes from UI).
export const products = sqliteTable('products', {
  ...base,
  name: text('name').notNull(),
  sku: text('sku'),
  unit: text('unit').notNull().default('pcs'),
  costPrice: integer('cost_price').notNull().default(0),
  salePrice: integer('sale_price').notNull().default(0),
  stockQty: integer('stock_qty').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
})

// --- recurring_rules -------------------------------------------------------
// `template_*` columns hold the transaction blueprint the rule generates
// (Phase 6). A rule must target a wallet, so `templateWalletId` is NOT NULL;
// category/channel/note are optional.
export const recurringRules = sqliteTable('recurring_rules', {
  ...base,
  name: text('name').notNull(),
  frequency: text('frequency', { enum: ['monthly', 'weekly'] }).notNull(),
  day: integer('day').notNull(),
  nextRunAt: text('next_run_at').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  templateType: text('template_type', { enum: ['income', 'expense'] }).notNull(),
  templateAmount: integer('template_amount').notNull(),
  templateWalletId: text('template_wallet_id').notNull(),
  templateCategoryId: text('template_category_id'),
  templateChannelId: text('template_channel_id'),
  templateNote: text('template_note'),
})

// --- transactions ----------------------------------------------------------
// `counterWalletId` is required iff type = 'transfer'; `categoryId` is null for
// transfers. `amount` must equal Σ items when items exist. All of these are
// enforced in the domain/repository layer (no DB CHECK constraints).
export const transactions = sqliteTable('transactions', {
  ...base,
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amount: integer('amount').notNull(),
  walletId: text('wallet_id').notNull(),
  counterWalletId: text('counter_wallet_id'),
  categoryId: text('category_id'),
  channelId: text('channel_id'),
  note: text('note'),
  occurredAt: text('occurred_at').notNull(),
  recurringRuleId: text('recurring_rule_id'),
})

// --- transaction_items -----------------------------------------------------
// Deleted together with the parent transaction (ON DELETE CASCADE in the DDL).
// `unitCost` snapshots the product cost at sale time (0 for purchases).
export const transactionItems = sqliteTable('transaction_items', {
  ...base,
  transactionId: text('transaction_id').notNull(),
  productId: text('product_id').notNull(),
  qty: integer('qty').notNull(),
  unitPrice: integer('unit_price').notNull(),
  unitCost: integer('unit_cost').notNull().default(0),
})

// --- budgets ---------------------------------------------------------------
// One budget per (category, month); uniqueness is a partial index scoped to
// non-deleted rows (see migration) so soft-deletes don't burn the slot.
export const budgets = sqliteTable('budgets', {
  ...base,
  categoryId: text('category_id').notNull(),
  month: text('month').notNull(),
  amount: integer('amount').notNull(),
})

// --- sync_state (local only) -----------------------------------------------
// No convention columns, no user_id — this table never syncs; it records the
// high-water marks for the sync engine (Phase 7).
export const syncState = sqliteTable('sync_state', {
  tableName: text('table_name').primaryKey(),
  lastPushedAt: text('last_pushed_at'),
  lastPulledAt: text('last_pulled_at'),
})

// --- Inferred row types ----------------------------------------------------
export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Channel = typeof channels.$inferSelect
export type NewChannel = typeof channels.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type RecurringRule = typeof recurringRules.$inferSelect
export type NewRecurringRule = typeof recurringRules.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type TransactionItem = typeof transactionItems.$inferSelect
export type NewTransactionItem = typeof transactionItems.$inferInsert
export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type SyncState = typeof syncState.$inferSelect
export type NewSyncState = typeof syncState.$inferInsert
