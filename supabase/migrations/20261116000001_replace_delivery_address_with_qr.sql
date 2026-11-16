-- Replace delivery/billing addresses with QR payloads for orders, invoices, and transactions.
alter table public.profiles drop column if exists address;
alter table public.orders drop column if exists delivery_address;
alter table public.invoices drop column if exists billing_address;

alter table public.orders add column if not exists qr_payload text;
alter table public.invoices add column if not exists qr_payload text;
alter table public.transactions add column if not exists qr_payload text;

comment on column public.orders.qr_payload is 'QR code payload for order verification/pickup.';
comment on column public.invoices.qr_payload is 'QR code payload for invoice reference/verification.';
comment on column public.transactions.qr_payload is 'QR code payload for transaction/record verification.';

-- Keep profile self-update policy consistent without address field.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer');
