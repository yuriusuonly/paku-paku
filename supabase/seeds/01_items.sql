-- Seed items: two main dishes and two side drinks.
-- Combos are built on the storefront from one main dish plus any drink.
insert into public.items (name, description, price_cents, is_available, is_best_seller, sort_order)
values
  -- Side drinks
  ('Red tea', 'Warm Japanese black tea with a smooth, full-bodied finish.', 2500, true, false, 10),
  ('Green tea', 'Steamed Japanese green tea, light and refreshing.', 2500, true, false, 20),

  -- Main dishes
  ('Tamagoyaki', 'Rolled omelet cooked in a hot pan, lightly sweet and savory.', 6000, true, false, 210),
  ('Teriyaki', 'Grilled chicken glazed with savory-sweet teriyaki sauce.', 8000, true, false, 220);
