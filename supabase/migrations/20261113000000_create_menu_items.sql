-- Menu items shown on the storefront. Only available items are publicly
-- readable; writes are reserved for trusted server-side roles.
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.menu_items is 'Street-food menu items shown to customers.';

alter table public.menu_items enable row level security;

-- Reads are public; writes stay with server-side roles.
revoke insert, update, delete on table public.menu_items from anon, authenticated;
grant select on table public.menu_items to anon, authenticated;

create policy "Available menu items are publicly readable"
  on public.menu_items
  for select
  to anon, authenticated
  using (is_available);
