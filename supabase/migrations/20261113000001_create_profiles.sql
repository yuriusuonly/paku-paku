-- Profiles table, admin helper, and baseline access.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[a-z0-9][a-z0-9_.-]{2,31}$'),
  role text not null default 'customer' check (role in ('admin', 'customer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profiles linked to Supabase Auth users.';
comment on column public.profiles.username is 'Case-insensitive login name used as the public account identifier.';
comment on column public.profiles.role is 'Authorization role: customer or admin.';
comment on column public.profiles.is_active is 'Soft-delete/audit flag; inactive profiles are disabled without removing records.';

create unique index profiles_username_lower_key on public.profiles (lower(username));

alter table public.profiles enable row level security;
alter table public.profiles replica identity full;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

comment on function public.current_user_is_admin() is 'True when the current JWT belongs to an admin profile.';

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
  on public.profiles
  for select
  to authenticated
  using (true);
