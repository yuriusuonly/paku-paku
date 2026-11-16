-- Seed menu items: Japanese street food and healthy Japanese tea beverages.
insert into public.menu_items (name, description, price_cents, is_available, is_best_seller, sort_order)
values
  ('Sencha Green Tea', 'Classic steamed Japanese green tea, light and refreshing, served hot.', 5500, true, true, 10),
  ('Hojicha Tea', 'Roasted Japanese green tea with a toasty aroma, naturally low in bitterness.', 5500, true, false, 20),
  ('Genmaicha Tea', 'Green tea blended with toasted brown rice for a warm, nutty flavor.', 6000, true, false, 30),
  ('Matcha Tea', 'Stone-ground Japanese green tea whisked with hot water, unsweetened.', 7000, true, true, 40),
  ('Gyokuro Tea', 'Premium shade-grown Japanese green tea with a smooth, umami-rich taste.', 8500, true, false, 50),
  ('Kukicha Tea', 'Twig tea made from tea stems, mild and naturally low in caffeine.', 5500, true, false, 60),
  ('Bancha Tea', 'Everyday Japanese green tea with a clean, gentle flavor.', 5000, true, false, 70),
  ('Iced Mugicha', 'Caffeine-free roasted barley tea served chilled, crisp and unsweetened.', 5000, true, true, 80),
  ('Iced Sobacha', 'Roasted buckwheat tea served over ice, toasty and naturally caffeine-free.', 5500, true, false, 90),
  ('Cold Brew Sencha', 'Cold-brewed Japanese green tea, smooth and refreshing with no added sugar.', 6000, true, false, 100),

  ('Takoyaki', 'Crispy-outside, tender octopus balls topped with sauce, mayo, and bonito flakes.', 7500, true, true, 200),
  ('Yakitori', 'Grilled chicken skewers glazed with sweet-savory tare sauce.', 7000, true, false, 210),
  ('Okonomiyaki', 'Savory Japanese pancake with cabbage, sauce, mayo, and bonito flakes.', 9500, true, false, 220),
  ('Taiyaki', 'Fish-shaped waffle cake filled with sweet red bean paste.', 6000, true, false, 230),
  ('Karaage', 'Crispy Japanese fried chicken bites with lemon.', 8500, true, true, 240),
  ('Onigiri', 'Hand-formed rice ball with savory filling and nori.', 5000, true, true, 250),
  ('Yakisoba', 'Stir-fried noodles with vegetables and tangy yakisoba sauce.', 9000, true, false, 260),
  ('Korokke', 'Crispy breaded potato croquette, golden and comforting.', 5500, true, false, 270),
  ('Gyoza', 'Pan-fried dumplings with juicy filling and dipping sauce.', 8000, true, false, 280),
  ('Dango', 'Chewy grilled rice dumplings brushed with sweet soy glaze.', 5500, true, false, 290);
