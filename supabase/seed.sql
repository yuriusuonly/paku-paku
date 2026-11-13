-- Sample menu for local development.
insert into public.menu_items (name, description, price_cents, sort_order)
values
  ('Takoyaki', 'Octopus balls with takoyaki sauce, Japanese mayo, and bonito flakes.', 650, 1),
  ('Yakisoba', 'Stir-fried noodles with cabbage, pork, and aonori.', 700, 2),
  ('Okonomiyaki', 'Savory cabbage pancake with okonomiyaki sauce and Japanese mayo.', 800, 3)
on conflict do nothing;

-- Administrator account: username `root`, password `R0.t`.
-- The Auth email is internal and derived from the username; the static bcrypt
-- hash keeps the seed independent of pgcrypto. Re-running the seed restores
-- this password, which is intended for local development.
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
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'root@paku-paku.local',
  '$2b$10$Fs1J0z6ECaSe4MkLgG/E/.7Zotu8.kPI9zLg6eyWOXbXqJkuiW/ii',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"root"}',
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
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '{"sub":"00000000-0000-4000-8000-000000000001","email":"root@paku-paku.local","email_verified":true,"phone_verified":false}',
  'email',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

insert into public.profiles (id, username, role)
values ('00000000-0000-4000-8000-000000000001', 'root', 'admin')
on conflict (id) do update
set
  username = excluded.username,
  role = excluded.role,
  updated_at = now();
