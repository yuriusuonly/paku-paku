-- Fix broadcast topic names to match client realtime channel subscriptions.

create or replace function public.broadcast_table_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  topic text := 'public:' || tg_table_name;
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

  begin
    perform realtime.send(payload, event_name, topic, false);
  exception
    when undefined_function or invalid_schema_name or invalid_parameter_value then
      begin
        perform realtime.send(payload := payload, event := event_name, topic := topic, private := false);
      exception
        when others then
          null;
      end;
  end;

  return coalesce(new, old);
end;
$$;
