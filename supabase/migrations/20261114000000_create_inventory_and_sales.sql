-- Inventory and sales system for admin operations.
create extension if not exists pgcrypto;

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  description text,
  quantity integer not null default 0 check (quantity >= 0),
  unit text,
  reorder_level integer not null default 0 check (reorder_level >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  menu_item_id uuid references public.menu_items (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.inventory_items is 'Inventory stock records managed by administrators.';
comment on column public.inventory_items.sku is 'Optional stock keeping unit identifier.';
comment on column public.inventory_items.quantity is 'Current on-hand quantity.';
comment on column public.inventory_items.reorder_level is 'Quantity threshold for low-stock visibility.';

create unique index inventory_items_sku_key
  on public.inventory_items (lower(sku))
  where sku is not null and length(trim(sku)) > 0;

create index inventory_items_menu_item_id_idx on public.inventory_items (menu_item_id);
create index inventory_items_is_active_idx on public.inventory_items (is_active);
create index inventory_items_name_idx on public.inventory_items (lower(name));

alter table public.inventory_items enable row level security;
alter table public.inventory_items replica identity full;

revoke all on table public.inventory_items from anon, authenticated;
grant select, insert, update, delete on table public.inventory_items to authenticated;

drop policy if exists "Admins can read inventory items" on public.inventory_items;
create policy "Admins can read inventory items"
  on public.inventory_items
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Admins can insert inventory items" on public.inventory_items;
create policy "Admins can insert inventory items"
  on public.inventory_items
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "Admins can update inventory items" on public.inventory_items;
create policy "Admins can update inventory items"
  on public.inventory_items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete inventory items" on public.inventory_items;
create policy "Admins can delete inventory items"
  on public.inventory_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique default ('SALE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  status text not null default 'completed' check (status in ('completed', 'pending', 'cancelled')),
  payment_method text,
  customer_name text,
  notes text,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sales is 'Sales transactions recorded by administrators.';
comment on column public.sales.sale_number is 'Human-readable sale identifier.';
comment on column public.sales.created_by is 'Profile that recorded the sale.';

create index sales_created_at_idx on public.sales (created_at desc);
create index sales_status_idx on public.sales (status);
create index sales_created_by_idx on public.sales (created_by);

alter table public.sales enable row level security;
alter table public.sales replica identity full;

revoke all on table public.sales from anon, authenticated;
grant select, insert, update, delete on table public.sales to authenticated;

drop policy if exists "Admins can read sales" on public.sales;
create policy "Admins can read sales"
  on public.sales
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Admins can insert sales" on public.sales;
create policy "Admins can insert sales"
  on public.sales
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "Admins can update sales" on public.sales;
create policy "Admins can update sales"
  on public.sales
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete sales" on public.sales;
create policy "Admins can delete sales"
  on public.sales
  for delete
  to authenticated
  using (public.current_user_is_admin());

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  inventory_item_id uuid references public.inventory_items (id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  line_total_cents integer not null default 0 check (line_total_cents >= 0),
  created_at timestamptz not null default now()
);

comment on table public.sale_items is 'Line items for recorded sales.';

create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_menu_item_id_idx on public.sale_items (menu_item_id);
create index sale_items_inventory_item_id_idx on public.sale_items (inventory_item_id);

alter table public.sale_items enable row level security;
alter table public.sale_items replica identity full;

revoke all on table public.sale_items from anon, authenticated;
grant select, insert, update, delete on table public.sale_items to authenticated;

drop policy if exists "Admins can read sale items" on public.sale_items;
create policy "Admins can read sale items"
  on public.sale_items
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Admins can insert sale items" on public.sale_items;
create policy "Admins can insert sale items"
  on public.sale_items
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "Admins can update sale items" on public.sale_items;
create policy "Admins can update sale items"
  on public.sale_items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete sale items" on public.sale_items;
create policy "Admins can delete sale items"
  on public.sale_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

do $$
begin
  alter publication supabase_realtime add table public.inventory_items;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.sales;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.sale_items;
exception
  when duplicate_object then null;
end
$$;
