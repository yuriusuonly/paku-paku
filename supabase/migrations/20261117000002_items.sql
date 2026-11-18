-- Items table, access rules, and realtime publication.
create table public.items (
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

comment on table public.items is 'Street-food items shown to customers.';
comment on column public.items.is_available is 'Availability flag; storefront visibility is handled by the application.';
comment on column public.items.is_best_seller is 'Whether the item is highlighted as a best seller.';

alter table public.items enable row level security;
alter table public.items replica identity full;

revoke all on table public.items from anon, authenticated;
grant select on table public.items to anon, authenticated;
grant insert, update, delete on table public.items to authenticated;

drop policy if exists "Items are readable" on public.items;
create policy "Items are readable"
  on public.items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert items" on public.items;
create policy "Admins can insert items"
  on public.items
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "Admins can update items" on public.items;
create policy "Admins can update items"
  on public.items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete items" on public.items;
create policy "Admins can delete items"
  on public.items
  for delete
  to authenticated
  using (public.current_user_is_admin());

do $$
begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null;
end
$$;
