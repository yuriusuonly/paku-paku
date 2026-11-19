-- Seed items: three main dishes, three side drinks, and one food + drink combo.
insert into public.items (name, description, price_cents, is_available, is_best_seller, sort_order)
values
  -- Side drinks
  ('Red tea', 'Warm Japanese black tea with a smooth, full-bodied finish.', 5500, true, false, 10),
  ('Green tea', 'Steamed Japanese green tea, light and refreshing.', 5500, true, false, 20),
  ('Macha', 'Stone-ground Japanese green tea with a rich, vibrant flavor.', 7000, true, false, 30),

  -- Food and beverage combo
  ('Karaage & Green Tea Combo', 'Crispy karaage paired with a refreshing green tea.', 12500, true, true, 100),

  -- Main dishes
  ('Karaage', 'Crispy Japanese fried chicken bites with lemon.', 8500, true, false, 200),
  ('Tamagoyaki', 'Rolled omelet cooked in a hot pan, lightly sweet and savory.', 6000, true, false, 210),
  ('Teriyaki', 'Grilled chicken glazed with savory-sweet teriyaki sauce.', 8500, true, false, 220);
