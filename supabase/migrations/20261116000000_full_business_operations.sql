-- Full business operations: customer profiles, orders, invoices, transactions, and records.
create extension if not exists pgcrypto;

-- Extend customer/account profile fields.
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists address text;

comment on column public.profiles.full_name is 'Customer or account display/full name.';
comment on column public.profiles.phone is 'Contact phone number.';
comment on column public.profiles.address is 'Primary address for orders/invoices.';

-- Allow customers to update their own contact fields (admins retain broader update policy).
grant update (full_name, phone, address, updated_at) on table public.profiles to authenticated;

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

-- Orders placed by customers (and manageable by admins).
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded', 'partial')),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'PHP',
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_address text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'Customer orders and operational order records.';
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;
alter table public.orders replica identity full;

revoke all on table public.orders from anon, authenticated;
grant select, insert, update, delete on table public.orders to authenticated;

drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders"
  on public.orders
  for select
  to authenticated
  using (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Customers can create own orders" on public.orders;
create policy "Customers can create own orders"
  on public.orders
  for insert
  to authenticated
  with check (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Customers can update own pending orders" on public.orders;
create policy "Customers can update own pending orders"
  on public.orders
  for update
  to authenticated
  using ((customer_id = auth.uid() and status = 'pending') or public.current_user_is_admin())
  with check ((customer_id = auth.uid()) or public.current_user_is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders
  for delete
  to authenticated
  using (public.current_user_is_admin());

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  inventory_item_id uuid references public.inventory_items (id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now()
);

comment on table public.order_items is 'Line items for customer orders.';
create index order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;
alter table public.order_items replica identity full;

revoke all on table public.order_items from anon, authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.current_user_is_admin())
    )
  );

drop policy if exists "Users can insert own order items" on public.order_items;
create policy "Users can insert own order items"
  on public.order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or public.current_user_is_admin())
    )
  );

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
  on public.order_items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete order items" on public.order_items;
create policy "Admins can delete order items"
  on public.order_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

-- Invoices for orders/sales and operational billing records.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  order_id uuid references public.orders (id) on delete set null,
  sale_id uuid references public.sales (id) on delete set null,
  customer_id uuid references public.profiles (id) on delete set null,
  status text not null default 'issued' check (status in ('draft', 'issued', 'paid', 'void', 'overdue')),
  issue_date date not null default current_date,
  due_date date,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'PHP',
  notes text,
  billing_name text,
  billing_email text,
  billing_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.invoices is 'Invoices and billing records for orders/sales.';
create index invoices_order_id_idx on public.invoices (order_id);
create index invoices_sale_id_idx on public.invoices (sale_id);
create index invoices_customer_id_idx on public.invoices (customer_id);
create index invoices_status_idx on public.invoices (status);
create index invoices_created_at_idx on public.invoices (created_at desc);

alter table public.invoices enable row level security;
alter table public.invoices replica identity full;

revoke all on table public.invoices from anon, authenticated;
grant select, insert, update, delete on table public.invoices to authenticated;

drop policy if exists "Users can read own invoices" on public.invoices;
create policy "Users can read own invoices"
  on public.invoices
  for select
  to authenticated
  using (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Admins can manage invoices" on public.invoices;
create policy "Admins can manage invoices"
  on public.invoices
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Financial/payment transactions and operational transaction records.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique default ('TXN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  order_id uuid references public.orders (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  sale_id uuid references public.sales (id) on delete set null,
  customer_id uuid references public.profiles (id) on delete set null,
  type text not null default 'payment' check (type in ('payment', 'refund', 'adjustment', 'charge')),
  method text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'PHP',
  reference text,
  notes text,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is 'Financial transactions and payment records.';
create index transactions_order_id_idx on public.transactions (order_id);
create index transactions_invoice_id_idx on public.transactions (invoice_id);
create index transactions_sale_id_idx on public.transactions (sale_id);
create index transactions_customer_id_idx on public.transactions (customer_id);
create index transactions_status_idx on public.transactions (status);
create index transactions_created_at_idx on public.transactions (created_at desc);

alter table public.transactions enable row level security;
alter table public.transactions replica identity full;

revoke all on table public.transactions from anon, authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions
  for select
  to authenticated
  using (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Admins can manage transactions" on public.transactions;
create policy "Admins can manage transactions"
  on public.transactions
  for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Realtime publications for operational tables.
do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.order_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.invoices; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.transactions; exception when duplicate_object then null; end $$;
