import type { SqliteExecutor } from './executor'

export interface Migration {
  id: string
  statements: string[]
}

// Ordered list of migrations. Hand-authored SQL (kept as the source of truth for
// DDL) rather than drizzle-kit output: our runner drives an async sqlite-proxy
// executor, which drizzle-kit's migrator does not target. The Drizzle schema in
// schema.ts must be kept in agreement with this DDL — the schema round-trip test
// (schema.test.ts) guards against drift.
//
// Conventions (SCHEMA.md): text UUIDv7 PKs, integer IDR money, ISO-8601 UTC text
// timestamps, soft-delete via deleted_at. Booleans are stored as INTEGER 0/1.
// Foreign keys are declared for documentation and future enforcement; the
// `foreign_keys` PRAGMA is intentionally left OFF until Phase 8 hardening, so the
// domain layer remains the guardian of referential/enum invariants.
export const migrations: Migration[] = [
  {
    id: '0000_init',
    statements: [
      `CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      `INSERT OR IGNORE INTO app_meta (key, value, updated_at) VALUES ('schema_version', '1', 0);`,
    ],
  },
  {
    id: '0001_domain_schema',
    statements: [
      // --- tables (FK-safe creation order) ---
      `CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        initial_balance INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id TEXT REFERENCES categories(id),
        icon TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT,
        unit TEXT NOT NULL DEFAULT 'pcs',
        cost_price INTEGER NOT NULL DEFAULT 0,
        sale_price INTEGER NOT NULL DEFAULT 0,
        stock_qty INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS recurring_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL,
        day INTEGER NOT NULL,
        next_run_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        template_type TEXT NOT NULL,
        template_amount INTEGER NOT NULL,
        template_wallet_id TEXT NOT NULL REFERENCES wallets(id),
        template_category_id TEXT REFERENCES categories(id),
        template_channel_id TEXT REFERENCES channels(id),
        template_note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        wallet_id TEXT NOT NULL REFERENCES wallets(id),
        counter_wallet_id TEXT REFERENCES wallets(id),
        category_id TEXT REFERENCES categories(id),
        channel_id TEXT REFERENCES channels(id),
        note TEXT,
        occurred_at TEXT NOT NULL,
        recurring_rule_id TEXT REFERENCES recurring_rules(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS transaction_items (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id),
        qty INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        unit_cost INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id),
        month TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS sync_state (
        table_name TEXT PRIMARY KEY,
        last_pushed_at TEXT,
        last_pulled_at TEXT
      );`,
      // --- indexes ---
      // sku unique only when set and not soft-deleted.
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_products_sku ON products(sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;`,
      // one budget per category+month among non-deleted rows.
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_budgets_category_month ON budgets(category_id, month) WHERE deleted_at IS NULL;`,
      // transaction read paths (SCHEMA.md).
      `CREATE INDEX IF NOT EXISTS ix_transactions_occurred_at ON transactions(occurred_at);`,
      `CREATE INDEX IF NOT EXISTS ix_transactions_channel_occurred ON transactions(channel_id, occurred_at);`,
      `CREATE INDEX IF NOT EXISTS ix_transactions_category_occurred ON transactions(category_id, occurred_at);`,
      `CREATE INDEX IF NOT EXISTS ix_transactions_wallet ON transactions(wallet_id);`,
      // item lookups for tx edit/delete reversal and profit-by-product reports.
      `CREATE INDEX IF NOT EXISTS ix_transaction_items_transaction ON transaction_items(transaction_id);`,
      `CREATE INDEX IF NOT EXISTS ix_transaction_items_product ON transaction_items(product_id);`,
    ],
  },
]

// Pure selection logic — which migrations still need applying, preserving
// declared order. Kept separate from IO so it can be unit-tested without a DB.
export function pendingMigrations(
  all: Migration[],
  appliedIds: ReadonlySet<string>,
): Migration[] {
  return all.filter((migration) => !appliedIds.has(migration.id))
}

const MIGRATIONS_TABLE = '__migrations'

// Applies all pending migrations on the given executor and records each in the
// tracking table. Idempotent: already-applied ids are skipped. Each migration
// runs inside a transaction so a failure leaves no partial state. Returns the
// number of migrations applied on this run.
export async function runMigrations(
  exec: SqliteExecutor,
  all: Migration[] = migrations,
): Promise<number> {
  await exec.run(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);`,
  )
  const rows = await exec.all(`SELECT id FROM ${MIGRATIONS_TABLE};`)
  const appliedIds = new Set(rows.map((row) => String(row[0])))
  const pending = pendingMigrations(all, appliedIds)

  for (const migration of pending) {
    await exec.run('BEGIN;')
    try {
      for (const statement of migration.statements) {
        await exec.run(statement)
      }
      await exec.run(`INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES (?, ?);`, [
        migration.id,
        Date.now(),
      ])
      await exec.run('COMMIT;')
    } catch (error) {
      await exec.run('ROLLBACK;')
      throw error
    }
  }

  return pending.length
}
