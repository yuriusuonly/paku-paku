-- Administrator account: email `root@paku-paku.official`, password `admin`.
-- The static bcrypt hash keeps the seed independent of pgcrypto. Re-running the
-- seed restores this password, which is intended for local development.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'root@paku-paku.official',
  '$2b$10$DKsSCmPnbsvDO/yC1MUYyuZJfhD3oh7MtVHAjvK0eeYsz4jnDFHI.',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"email":"root@paku-paku.official"}',
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
)
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '{"sub":"00000000-0000-0000-0000-000000000000","email":"root@paku-paku.official","email_verified":true,"phone_verified":false}',
  'email',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

insert into public.profiles (id, email, role)
values ('00000000-0000-0000-0000-000000000000', 'root@paku-paku.official', 'admin')
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  updated_at = now();
