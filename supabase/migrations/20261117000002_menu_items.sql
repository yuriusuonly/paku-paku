-- Menu items table, access rules, and realtime publication.
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_available boolean not null default true,
  is_best_seller boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.menu_items is 'Street-food menu items shown to customers.';
comment on column public.menu_items.is_available is 'Availability flag; storefront visibility is handled by the application.';
comment on column public.menu_items.is_best_seller is 'Whether the menu item is highlighted as a best seller.';

alter table public.menu_items enable row level security;
alter table public.menu_items replica identity full;

revoke all on table public.menu_items from anon, authenticated;
grant select on table public.menu_items to anon, authenticated;
grant insert, update, delete on table public.menu_items to authenticated;

drop policy if exists "Menu items are readable" on public.menu_items;
create policy "Menu items are readable"
  on public.menu_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert menu items" on public.menu_items;
create policy "Admins can insert menu items"
  on public.menu_items
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "Admins can update menu items" on public.menu_items;
create policy "Admins can update menu items"
  on public.menu_items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete menu items" on public.menu_items;
create policy "Admins can delete menu items"
  on public.menu_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

do $$
begin
  alter publication supabase_realtime add table public.menu_items;
exception when duplicate_object then null;
end
$$;
