-- Enable realtime change events for profiles so admin/audit views stay in sync
-- across screens, tabs, and devices.
alter publication supabase_realtime add table public.profiles;
