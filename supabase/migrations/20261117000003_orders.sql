-- Unified buy/sell orders table, access rules, and realtime publication.
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  kind text not null default 'buy' check (kind in ('buy', 'sell')),
  customer_id uuid references public.profiles (id) on delete set null,
  status text not null default 'Pending' check (status in ('Pending', 'Paid', 'Refunded', 'Voided')),
  payment_method text,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'PHP',
  notes text,
  customer_name text,
  customer_email text,
  customer_phone text,
  qr_payload text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.orders is 'Unified buy/sell orders and operational records.';
comment on column public.orders.kind is 'Order kind: buy (customer checkout) or sell (admin-recorded).';
comment on column public.orders.qr_payload is 'QR code payload for counter verification.';

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;
alter table public.orders replica identity full;

revoke all on table public.orders from anon, authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert on table public.orders to anon;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders
  for select
  to authenticated
  using (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders
  for insert
  to authenticated
  with check (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Users can update own pending orders" on public.orders;
create policy "Users can update own pending orders"
  on public.orders
  for update
  to authenticated
  using ((customer_id = auth.uid() and status = 'Pending') or public.current_user_is_admin())
  with check (customer_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Kiosk visitors can read pending orders" on public.orders;
create policy "Kiosk visitors can read pending orders"
  on public.orders
  for select
  to anon
  using (kind = 'buy' and customer_id is null and status = 'Pending');

drop policy if exists "Kiosk visitors can place orders" on public.orders;
create policy "Kiosk visitors can place orders"
  on public.orders
  for insert
  to anon
  with check (kind = 'buy' and customer_id is null and status = 'Pending');

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end
$$;
