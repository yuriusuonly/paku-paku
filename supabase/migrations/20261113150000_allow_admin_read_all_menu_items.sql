-- Allow administrators to read all menu items (including unavailable/hidden ones) for management.

drop policy if exists "Admins can read all menu items" on public.menu_items;
create policy "Admins can read all menu items"
  on public.menu_items
  for select
  to authenticated
  using (public.current_user_is_admin());
