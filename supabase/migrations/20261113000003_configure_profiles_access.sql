-- Profile registration/management policies and realtime publication.

create unique index if not exists profiles_single_admin_idx
  on public.profiles ((role))
  where role = 'admin';

grant insert on table public.profiles to authenticated;
grant update (email, updated_at, is_active) on table public.profiles to authenticated;

drop policy if exists "Users can create their own customer profile" on public.profiles;
create policy "Users can create their own customer profile"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and role = 'customer'
    and email is not null
  );

drop policy if exists "Admins can create customer profiles" on public.profiles;
create policy "Admins can create customer profiles"
  on public.profiles
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    and role = 'customer'
    and email is not null
  );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end
$$;
