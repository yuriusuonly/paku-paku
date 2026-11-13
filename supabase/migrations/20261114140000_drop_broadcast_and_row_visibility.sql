-- Drop realtime broadcast triggers/function and remove row-visibility gating
-- from current app tables so postgres_changes listeners receive all changes.

-- Remove broadcast triggers and helper.
drop trigger if exists broadcast_menu_items_changes on public.menu_items;
drop trigger if exists broadcast_profiles_changes on public.profiles;
drop function if exists public.broadcast_table_changes();

-- Menu items: allow all rows to be readable; availability remains a column state.
drop policy if exists "Available menu items are publicly readable" on public.menu_items;
drop policy if exists "Admins can read all menu items" on public.menu_items;
create policy "Menu items are readable"
  on public.menu_items
  for select
  to anon, authenticated
  using (true);

-- Profiles: remove row-visibility restrictions.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read every profile" on public.profiles;
create policy "Profiles are readable"
  on public.profiles
  for select
  to authenticated
  using (true);
