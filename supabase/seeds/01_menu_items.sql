-- Sample menu for local development.
insert into public.menu_items (name, description, price_cents, sort_order)
values
  ('Takoyaki', 'Octopus balls with takoyaki sauce, Japanese mayo, and bonito flakes.', 650, 1),
  ('Yakisoba', 'Stir-fried noodles with cabbage, pork, and aonori.', 700, 2),
  ('Okonomiyaki', 'Savory cabbage pancake with okonomiyaki sauce and Japanese mayo.', 800, 3)
on conflict do nothing;
