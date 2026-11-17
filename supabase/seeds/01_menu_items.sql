-- Seed menu items: hot cooked Japanese street food and iced cold teas.
insert into public.menu_items (name, description, price_cents, is_available, is_best_seller, sort_order)
values
  -- Iced/cold teas
  ('Iced Sencha Green Tea', 'Steamed Japanese green tea served over ice, light and refreshing.', 5500, true, true, 10),
  ('Iced Hojicha', 'Roasted green tea served chilled with a toasty, low-bitterness finish.', 5500, true, false, 20),
  ('Iced Genmaicha', 'Green tea blended with toasted brown rice, served cold for a nutty finish.', 6000, true, false, 30),
  ('Iced Matcha', 'Stone-ground Japanese green tea whisked with cold water and poured over ice.', 7000, true, true, 40),
  ('Iced Gyokuro', 'Premium shade-grown Japanese green tea served chilled for a smooth umami taste.', 8500, true, false, 50),
  ('Iced Kukicha', 'Mild twig tea served over ice, naturally low in caffeine.', 5500, true, false, 60),
  ('Iced Bancha', 'Everyday Japanese green tea served cold with a clean, gentle finish.', 5000, true, false, 70),
  ('Iced Mugicha', 'Caffeine-free roasted barley tea served chilled, crisp and unsweetened.', 5000, true, true, 80),
  ('Iced Sobacha', 'Roasted buckwheat tea served over ice, toasty and naturally caffeine-free.', 5500, true, false, 90),
  ('Cold Brew Sencha', 'Cold-brewed Japanese green tea, smooth and refreshing with no added sugar.', 6000, true, false, 100),

  -- Hot cooked food
  ('Takoyaki', 'Crispy-outside, tender octopus balls topped with sauce, mayo, and bonito flakes.', 7500, true, true, 200),
  ('Yakitori', 'Grilled chicken skewers glazed with sweet-savory tare sauce.', 7000, true, false, 210),
  ('Okonomiyaki', 'Savory Japanese pancake with cabbage, sauce, mayo, and bonito flakes.', 9500, true, false, 220),
  ('Karaage', 'Crispy Japanese fried chicken bites with lemon.', 8500, true, true, 240),
  ('Yakisoba', 'Stir-fried noodles with vegetables and tangy yakisoba sauce.', 9000, true, false, 260),
  ('Gyoza', 'Pan-fried dumplings with juicy filling and dipping sauce.', 8000, true, false, 280),
  ('Oden', 'Simmered fish cake, tofu, and egg skewers in warm dashi broth.', 8000, true, true, 300),
  ('Nikujaga', 'Japanese-style simmered beef and potatoes in a soy-sweet broth.', 8500, true, false, 310),
  ('Ikayaki', 'Grilled squid brushed with savory tare sauce.', 9000, true, false, 320),
  ('Tamagoyaki', 'Rolled omelet cooked in a hot pan, lightly sweet and savory.', 6000, true, false, 330);
