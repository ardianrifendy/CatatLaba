import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
}

const owner = {
  userId: uuid('user_id').notNull(),
}

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...owner,
  ...timestamps,
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'bank', 'ewallet'] }).notNull(),
  initialBalance: integer('initial_balance').notNull().default(0),
  isArchived: boolean('is_archived').notNull().default(false),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...owner,
  ...timestamps,
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  parentId: uuid('parent_id'),
  icon: text('icon'),
})

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...owner,
  ...timestamps,
  name: text('name').notNull(),
  isArchived: boolean('is_archived').notNull().default(false),
})

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...owner,
    ...timestamps,
    name: text('name').notNull(),
    sku: text('sku'),
    unit: text('unit').notNull().default('pcs'),
    costPrice: integer('cost_price').notNull().default(0),
    salePrice: integer('sale_price').notNull().default(0),
    stockQty: integer('stock_qty').notNull().default(0),
    isArchived: boolean('is_archived').notNull().default(false),
  },
  (table) => ({
    skuUnique: uniqueIndex('ux_products_sku').on(table.sku).where(sql`${table.deletedAt} is null`),
  }),
)

export const recurringRules = pgTable('recurring_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ...owner,
  ...timestamps,
  name: text('name').notNull(),
  frequency: text('frequency', { enum: ['monthly', 'weekly'] }).notNull(),
  day: integer('day').notNull(),
  nextRunAt: timestamp('next_run_at', { withTimezone: true, mode: 'string' }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  templateType: text('template_type', { enum: ['income', 'expense'] }).notNull(),
  templateAmount: integer('template_amount').notNull(),
  templateWalletId: uuid('template_wallet_id').notNull(),
  templateCategoryId: uuid('template_category_id'),
  templateChannelId: uuid('template_channel_id'),
  templateNote: text('template_note'),
})

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...owner,
    ...timestamps,
    type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
    amount: integer('amount').notNull(),
    walletId: uuid('wallet_id').notNull(),
    counterWalletId: uuid('counter_wallet_id'),
    categoryId: uuid('category_id'),
    channelId: uuid('channel_id'),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'string' }).notNull(),
    recurringRuleId: uuid('recurring_rule_id'),
  },
  (table) => ({
    occurredAtIdx: index('ix_transactions_occurred_at').on(table.occurredAt),
    channelOccurredIdx: index('ix_transactions_channel_occurred').on(table.channelId, table.occurredAt),
    categoryOccurredIdx: index('ix_transactions_category_occurred').on(table.categoryId, table.occurredAt),
    walletIdx: index('ix_transactions_wallet').on(table.walletId),
  }),
)

export const transactionItems = pgTable(
  'transaction_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...owner,
    ...timestamps,
    transactionId: uuid('transaction_id').notNull(),
    productId: uuid('product_id').notNull(),
    qty: integer('qty').notNull(),
    unitPrice: integer('unit_price').notNull(),
    unitCost: integer('unit_cost').notNull().default(0),
  },
  (table) => ({
    transactionIdx: index('ix_transaction_items_transaction').on(table.transactionId),
    productIdx: index('ix_transaction_items_product').on(table.productId),
  }),
)

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ...owner,
    ...timestamps,
    categoryId: uuid('category_id').notNull(),
    month: text('month').notNull(),
    amount: integer('amount').notNull(),
  },
  (table) => ({
    categoryMonthUnique: uniqueIndex('ux_budgets_category_month').on(table.categoryId, table.month).where(
      sql`${table.deletedAt} is null`,
    ),
  }),
)
