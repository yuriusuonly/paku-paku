-- Enforce a single administrator account and allow customers to create their own profile on registration.

-- Only one admin profile may exist.
create unique index if not exists profiles_single_admin_idx
  on public.profiles ((role))
  where role = 'admin';

-- Allow a newly authenticated user to create their own customer profile.
grant insert on table public.profiles to authenticated;

create policy "Users can create their own customer profile"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and role = 'customer'
    and username is not null
  );

-- Allow users to update their own non-role profile fields (role changes remain disallowed).
grant update (username, updated_at) on table public.profiles to authenticated;

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');
