-- Profiles table, access rules, recovery helpers, and realtime publication.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role text not null default 'customer' check (role in ('admin', 'customer')),
  is_active boolean not null default true,
  full_name text,
  phone text,
  recovery_code_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App profiles linked to Supabase Auth users.';
comment on column public.profiles.email is 'Case-insensitive email address used as the account identifier.';
comment on column public.profiles.role is 'Authorization role: customer or admin.';
comment on column public.profiles.is_active is 'Soft-delete/audit flag; inactive profiles are disabled without removing records.';
comment on column public.profiles.recovery_code_hash is 'Hash of the one-time account recovery code.';

create unique index profiles_email_lower_key on public.profiles (lower(email));
create unique index profiles_single_admin_idx on public.profiles ((role)) where role = 'admin';

alter table public.profiles enable row level security;
alter table public.profiles replica identity full;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert on table public.profiles to authenticated;
grant update (email, full_name, phone, is_active, updated_at) on table public.profiles to authenticated;

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

drop policy if exists "Profiles are creatable" on public.profiles;
create policy "Profiles are creatable"
  on public.profiles
  for insert
  to authenticated
  with check (
    role = 'customer'
    and email is not null
    and (id = auth.uid() or public.current_user_is_admin())
  );

drop policy if exists "Profiles are updatable" on public.profiles;
create policy "Profiles are updatable"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.current_user_is_admin())
  with check ((id = auth.uid() and role = 'customer') or public.current_user_is_admin());

create or replace function public.hash_recovery_code(p_code text)
returns text
language sql
security definer
set search_path = public, extensions, pg_temp
as $$
  select extensions.crypt(p_code, extensions.gen_salt('bf'));
$$;

comment on function public.hash_recovery_code(text) is 'Returns a bcrypt hash for a one-time recovery code.';
revoke all on function public.hash_recovery_code(text) from public;
grant execute on function public.hash_recovery_code(text) to anon, authenticated;

create or replace function public.recover_account(
  p_email text,
  p_recovery_code text,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if p_email is null or p_recovery_code is null or p_new_password is null then
    raise exception 'invalid_input';
  end if;
  if length(trim(p_new_password)) < 6 then
    raise exception 'invalid_password';
  end if;

  select * into v_profile
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_profile.id is null or v_profile.recovery_code_hash is null then
    raise exception 'invalid_recovery_code';
  end if;

  if v_profile.recovery_code_hash <> extensions.crypt(p_recovery_code, v_profile.recovery_code_hash) then
    raise exception 'invalid_recovery_code';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = v_profile.id;

  if not found then
    raise exception 'account_not_found';
  end if;

  update public.profiles
  set recovery_code_hash = null,
      updated_at = now()
  where id = v_profile.id;
end;
$$;

comment on function public.recover_account(text, text, text) is 'Verifies a one-time recovery code and resets the account password.';
revoke all on function public.recover_account(text, text, text) from public;
grant execute on function public.recover_account(text, text, text) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end
$$;
