-- Add best seller flag to menu items.
alter table public.menu_items
  add column if not exists is_best_seller boolean not null default false;

comment on column public.menu_items.is_best_seller is 'Whether the menu item is highlighted as a best seller.';
