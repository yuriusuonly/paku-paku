-- Menu items table and baseline access (availability is a column state, not row visibility).
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.menu_items is 'Street-food menu items shown to customers.';
comment on column public.menu_items.is_available is 'Availability flag; storefront visibility is handled by the application.';
comment on column public.menu_items.updated_at is 'Last modification timestamp for auditing and sync.';

alter table public.menu_items enable row level security;
alter table public.menu_items replica identity full;

revoke insert, update, delete on table public.menu_items from anon, authenticated;
grant select on table public.menu_items to anon, authenticated;

drop policy if exists "Menu items are readable" on public.menu_items;
create policy "Menu items are readable"
  on public.menu_items
  for select
  to anon, authenticated
  using (true);
