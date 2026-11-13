-- Add updated_at audit timestamp to menu items.
alter table public.menu_items
  add column if not exists updated_at timestamptz not null default now();

-- Backfill updated_at for existing rows where needed.
update public.menu_items
set updated_at = created_at
where updated_at is null or updated_at < created_at;
