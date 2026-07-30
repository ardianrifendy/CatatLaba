create extension if not exists pgcrypto;

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  type text not null check (type in ('cash', 'bank', 'ewallet')),
  initial_balance integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  parent_id uuid references public.categories(id),
  icon text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  sku text,
  unit text not null default 'pcs',
  cost_price integer not null default 0,
  sale_price integer not null default 0,
  stock_qty integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  frequency text not null check (frequency in ('monthly', 'weekly')),
  day integer not null,
  next_run_at timestamptz not null,
  is_active boolean not null default true,
  template_type text not null check (template_type in ('income', 'expense')),
  template_amount integer not null,
  template_wallet_id uuid not null references public.wallets(id),
  template_category_id uuid references public.categories(id),
  template_channel_id uuid references public.channels(id),
  template_note text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount integer not null,
  wallet_id uuid not null references public.wallets(id),
  counter_wallet_id uuid references public.wallets(id),
  category_id uuid references public.categories(id),
  channel_id uuid references public.channels(id),
  note text,
  occurred_at timestamptz not null,
  recurring_rule_id uuid references public.recurring_rules(id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty integer not null,
  unit_price integer not null,
  unit_cost integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  category_id uuid not null references public.categories(id),
  month text not null,
  amount integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create unique index if not exists ux_products_sku
  on public.products (sku)
  where sku is not null and deleted_at is null;

create unique index if not exists ux_budgets_category_month
  on public.budgets (category_id, month)
  where deleted_at is null;

create index if not exists ix_transactions_occurred_at
  on public.transactions (occurred_at);

create index if not exists ix_transactions_channel_occurred
  on public.transactions (channel_id, occurred_at);

create index if not exists ix_transactions_category_occurred
  on public.transactions (category_id, occurred_at);

create index if not exists ix_transactions_wallet
  on public.transactions (wallet_id);

create index if not exists ix_transaction_items_transaction
  on public.transaction_items (transaction_id);

create index if not exists ix_transaction_items_product
  on public.transaction_items (product_id);

alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.channels enable row level security;
alter table public.products enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.budgets enable row level security;

create policy wallets_own_rows on public.wallets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy categories_own_rows on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy channels_own_rows on public.channels
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy products_own_rows on public.products
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recurring_rules_own_rows on public.recurring_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy transactions_own_rows on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy transaction_items_own_rows on public.transaction_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy budgets_own_rows on public.budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
