-- Allow administrators to manage menu items and enable realtime updates.
grant insert, update, delete on table public.menu_items to authenticated;

create policy "Admins can insert menu items"
  on public.menu_items
  for insert
  to authenticated
  with check (public.current_user_is_admin());

create policy "Admins can update menu items"
  on public.menu_items
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "Admins can delete menu items"
  on public.menu_items
  for delete
  to authenticated
  using (public.current_user_is_admin());

do $$
begin
  alter publication supabase_realtime add table public.menu_items;
exception
  when duplicate_object then null;
end
$$;
