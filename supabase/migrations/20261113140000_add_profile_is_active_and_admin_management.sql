-- Add soft-delete/audit status to profiles and allow admins to manage profiles.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

comment on column public.profiles.is_active is 'Soft-delete/audit flag; inactive profiles are disabled without removing records.';

-- Admins may update profile management fields (e.g. is_active) for auditing.
grant update (is_active, updated_at) on table public.profiles to authenticated;

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Admins may create customer profiles (paired with server-side account creation flows).
drop policy if exists "Admins can create customer profiles" on public.profiles;
create policy "Admins can create customer profiles"
  on public.profiles
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    and role = 'customer'
    and username is not null
  );
