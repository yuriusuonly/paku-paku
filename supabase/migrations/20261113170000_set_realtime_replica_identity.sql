-- Ensure realtime postgres_changes include full row data for updates/deletes.
alter table public.menu_items replica identity full;
alter table public.profiles replica identity full;
