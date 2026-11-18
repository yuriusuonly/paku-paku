-- Audit logs table and triggers for administrative change tracking.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid,
  actor_email text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Append-only audit trail for administrative tables.';
comment on column public.audit_logs.actor_email is 'Staff email captured at write time; kiosk writes are labeled kiosk.';

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);

alter table public.audit_logs enable row level security;
alter table public.audit_logs replica identity full;

revoke all on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.current_user_is_admin());

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_record_id uuid;
  v_before jsonb;
  v_after jsonb;
begin
  if TG_OP = 'INSERT' then
    v_after := to_jsonb(NEW);
    v_record_id := NEW.id;
  elsif TG_OP = 'UPDATE' then
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_record_id := NEW.id;
  else
    v_before := to_jsonb(OLD);
    v_record_id := OLD.id;
  end if;

  if v_actor_id is not null then
    select email into v_actor_email from public.profiles where id = v_actor_id;
  end if;

  insert into public.audit_logs (
    table_name, record_id, action, actor_id, actor_email, before_data, after_data
  ) values (
    TG_TABLE_NAME, v_record_id, TG_OP, v_actor_id, coalesce(v_actor_email, 'kiosk'), v_before, v_after
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

comment on function public.write_audit_log() is 'Appends INSERT/UPDATE/DELETE audit records for tracked tables.';
revoke all on function public.write_audit_log() from public, anon;
grant execute on function public.write_audit_log() to authenticated, anon;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.write_audit_log();

drop trigger if exists audit_items on public.items;
create trigger audit_items
after insert or update or delete on public.items
for each row execute function public.write_audit_log();

drop trigger if exists audit_orders on public.orders;
create trigger audit_orders
after insert or update or delete on public.orders
for each row execute function public.write_audit_log();

drop trigger if exists audit_order_items on public.order_items;
create trigger audit_order_items
after insert or update or delete on public.order_items
for each row execute function public.write_audit_log();

do $$
begin
  alter publication supabase_realtime add table public.audit_logs;
exception when duplicate_object then null;
end
$$;
