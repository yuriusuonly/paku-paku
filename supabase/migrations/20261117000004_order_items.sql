-- Order line items table, access rules, and realtime publication.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now()
);

comment on table public.order_items is 'Line items for unified orders.';
create index order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;
alter table public.order_items replica identity full;

revoke all on table public.order_items from anon, authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant insert on table public.order_items to anon;

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

drop policy if exists "Users can create own order items" on public.order_items;
create policy "Users can create own order items"
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

drop policy if exists "Kiosk visitors can add order items" on public.order_items;
create policy "Kiosk visitors can add order items"
  on public.order_items
  for insert
  to anon
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.kind = 'buy'
        and o.customer_id is null
        and o.status = 'pending'
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.order_items;
exception when duplicate_object then null;
end
$$;
