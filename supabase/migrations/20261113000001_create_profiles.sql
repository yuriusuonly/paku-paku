-- App profiles linked one-to-one with Supabase Auth users. Usernames are the
-- public identity; the Auth email is internal (`<username>@paku-paku.local`)
-- and is never exposed through the Data API.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[a-z0-9][a-z0-9_.-]{2,31}$'),
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profiles linked to Supabase Auth users.';
comment on column public.profiles.username is 'Case-insensitive login name; Auth email is derived from it.';
comment on column public.profiles.role is 'Authorization role: customer or admin.';

-- Usernames are unique regardless of case, so `Root` and `root` cannot coexist.
create unique index profiles_username_lower_key on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- Profiles are private: authenticated users may read their own row, and admins
-- may read every row. Writes stay with trusted server-side roles.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

-- Security-definer helper so the admin policy can inspect `profiles` without
-- recursing through its own RLS policies. Owned by postgres, which bypasses
-- RLS on the table unless FORCE ROW LEVEL SECURITY is enabled.
create function public.current_user_is_admin()
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

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Admins can read every profile"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());
