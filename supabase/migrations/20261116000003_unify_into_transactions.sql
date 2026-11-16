-- Unify orders, sales, and payment transactions into a single transactions model.
-- Existing `orders` become buy transactions; existing `sales` become sell transactions.
create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists kind text not null default 'buy' check (kind in ('buy', 'sell')),
  add column if not exists payment_method text;

alter table public.orders
  alter column customer_id drop not null;

-- Migrate recorded sales into unified transaction records.
insert into public.orders (
  id,
  order_number,
  kind,
  customer_id,
  status,
  payment_status,
  payment_method,
  subtotal_cents,
  total_cents,
  currency,
  notes,
  customer_name,
  qr_payload,
  placed_at,
  created_at,
  updated_at
)
select
  s.id,
  coalesce(nullif(s.sale_number, ''), 'TXN-' || upper(substr(replace(s.id::text, '-', ''), 1, 10))),
  'sell',
  null,
  case
    when s.status = 'cancelled' then 'cancelled'
    when s.status = 'pending' then 'pending'
    else 'completed'
  end,
  case when s.status = 'completed' then 'paid' else 'unpaid' end,
  s.payment_method,
  coalesce(s.subtotal_cents, 0),
  coalesce(s.total_cents, 0),
  'PHP',
  s.notes,
  s.customer_name,
  'SALE:' || coalesce(s.sale_number, s.id::text) || '|TOTAL:' || coalesce(s.total_cents, 0),
  coalesce(s.created_at, now()),
  coalesce(s.created_at, now()),
  coalesce(s.updated_at, s.created_at, now())
from public.sales s
on conflict (id) do nothing;

insert into public.order_items (
  id,
  order_id,
  menu_item_id,
  inventory_item_id,
  item_name,
  quantity,
  unit_price_cents,
  line_total_cents,
  created_at
)
select
  si.id,
  si.sale_id,
  si.menu_item_id,
  si.inventory_item_id,
  si.item_name,
  si.quantity,
  si.unit_price_cents,
  si.line_total_cents,
  coalesce(si.created_at, now())
from public.sale_items si
on conflict (id) do nothing;

-- Ensure order numbers remain usable as unified transaction numbers.
-- (orders.order_number already unique; migrated sale_number values are inserted above.)

comment on table public.orders is 'Unified buy/sell transactions and operational records.';
comment on column public.orders.kind is 'Transaction kind: buy (customer checkout) or sell (admin-recorded).';
comment on column public.orders.payment_method is 'Payment method label (cash, card, etc.).';

-- Keep legacy tables for historical compatibility but stop using them in app flows.
comment on table public.sales is 'Legacy sales table (superseded by unified transactions in public.orders).';
comment on table public.transactions is 'Legacy payment transaction records (superseded by unified transactions in public.orders).';
