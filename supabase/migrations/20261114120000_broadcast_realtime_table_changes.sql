-- Broadcast table changes over Supabase Realtime so clients receive updates
-- without depending on row-visibility-gated postgres_changes delivery.

create or replace function public.broadcast_table_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  topic text := 'table:' || tg_table_name;
  event_name text := tg_op;
  row_new jsonb;
  row_old jsonb;
  payload jsonb;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    row_new := to_jsonb(new);
  end if;

  if tg_op = 'UPDATE' or tg_op = 'DELETE' then
    row_old := to_jsonb(old);
  end if;

  payload := jsonb_build_object(
    'schema', tg_table_schema,
    'table', tg_table_name,
    'eventType', tg_op,
    'new', row_new,
    'old', row_old
  );

  perform realtime.send(payload, event_name, topic, false);
  return coalesce(new, old);
exception
  when undefined_function or invalid_schema_name then
    -- Realtime broadcast helper unavailable; fall back to postgres_changes delivery.
    return coalesce(new, old);
end;
$$;

drop trigger if exists broadcast_menu_items_changes on public.menu_items;
create trigger broadcast_menu_items_changes
after insert or update or delete on public.menu_items
for each row execute function public.broadcast_table_changes();

drop trigger if exists broadcast_profiles_changes on public.profiles;
create trigger broadcast_profiles_changes
after insert or update or delete on public.profiles
for each row execute function public.broadcast_table_changes();
