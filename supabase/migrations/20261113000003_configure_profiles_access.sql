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
exception
  when duplicate_object then null;
end
$$;
