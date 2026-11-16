-- Seed inventory: shared supplies and per-menu stock linked to menu items.
-- Cups, containers, and ingredients are reflected by transactions via application logic.

insert into public.inventory_items (name, sku, description, quantity, unit, reorder_level, unit_cost_cents, menu_item_id, is_active)
values
  -- Shared supplies
  ('Disposable Hot Cup', 'SUP-CUP-HOT', 'Hot drink cup for tea beverages.', 200, 'pcs', 40, 300, null, true),
  ('Disposable Cold Cup', 'SUP-CUP-COLD', 'Cold drink cup for iced beverages.', 150, 'pcs', 30, 350, null, true),
  ('Cup Lid', 'SUP-LID', 'Lid for takeaway cups.', 300, 'pcs', 50, 150, null, true),
  ('Takeout Container', 'SUP-CONTAINER', 'Food takeout container/boat.', 200, 'pcs', 40, 500, null, true),
  ('Napkin', 'SUP-NAPKIN', 'Disposable napkin.', 500, 'pcs', 100, 50, null, true),
  ('Chopsticks', 'SUP-CHOPSTICKS', 'Disposable chopsticks.', 300, 'pcs', 60, 100, null, true),

  -- Beverage stock linked to menu items
  ('Sencha Tea Leaves', 'ING-SENCHA', 'Green tea leaves for sencha servings.', 80, 'servings', 15, 1200,
    (select id from public.menu_items where name = 'Sencha Green Tea' limit 1), true),
  ('Hojicha Tea Leaves', 'ING-HOJICHA', 'Roasted green tea leaves for hojicha servings.', 80, 'servings', 15, 1200,
    (select id from public.menu_items where name = 'Hojicha Tea' limit 1), true),
  ('Genmaicha Tea Leaves', 'ING-GENMAICHA', 'Green tea and toasted rice for genmaicha servings.', 80, 'servings', 15, 1300,
    (select id from public.menu_items where name = 'Genmaicha Tea' limit 1), true),
  ('Matcha Powder', 'ING-MATCHA', 'Stone-ground matcha powder for matcha servings.', 60, 'servings', 12, 2000,
    (select id from public.menu_items where name = 'Matcha Tea' limit 1), true),
  ('Gyokuro Tea Leaves', 'ING-GYOKURO', 'Shade-grown tea leaves for gyokuro servings.', 50, 'servings', 10, 2500,
    (select id from public.menu_items where name = 'Gyokuro Tea' limit 1), true),
  ('Kukicha Tea Leaves', 'ING-KUKICHA', 'Twig tea for kukicha servings.', 70, 'servings', 15, 1100,
    (select id from public.menu_items where name = 'Kukicha Tea' limit 1), true),
  ('Bancha Tea Leaves', 'ING-BANCHA', 'Tea leaves for bancha servings.', 90, 'servings', 20, 900,
    (select id from public.menu_items where name = 'Bancha Tea' limit 1), true),
  ('Mugicha Barley', 'ING-MUGICHA', 'Roasted barley for iced mugicha servings.', 80, 'servings', 15, 800,
    (select id from public.menu_items where name = 'Iced Mugicha' limit 1), true),
  ('Sobacha Buckwheat', 'ING-SOBACHA', 'Roasted buckwheat for iced sobacha servings.', 70, 'servings', 15, 1000,
    (select id from public.menu_items where name = 'Iced Sobacha' limit 1), true),
  ('Cold Brew Sencha Leaves', 'ING-CB-SENCHA', 'Tea leaves for cold brew sencha servings.', 70, 'servings', 15, 1300,
    (select id from public.menu_items where name = 'Cold Brew Sencha' limit 1), true),

  -- Food stock/ingredients linked to menu items
  ('Takoyaki Ingredients', 'ING-TAKOYAKI', 'Batter, octopus, and toppings for takoyaki servings.', 60, 'servings', 12, 2500,
    (select id from public.menu_items where name = 'Takoyaki' limit 1), true),
  ('Yakitori Ingredients', 'ING-YAKITORI', 'Chicken and sauce for yakitori servings.', 60, 'servings', 12, 2200,
    (select id from public.menu_items where name = 'Yakitori' limit 1), true),
  ('Okonomiyaki Ingredients', 'ING-OKONOMIYAKI', 'Batter, cabbage, and toppings for okonomiyaki servings.', 50, 'servings', 10, 3000,
    (select id from public.menu_items where name = 'Okonomiyaki' limit 1), true),
  ('Taiyaki Ingredients', 'ING-TAIYAKI', 'Batter and red bean filling for taiyaki servings.', 60, 'servings', 12, 1500,
    (select id from public.menu_items where name = 'Taiyaki' limit 1), true),
  ('Karaage Ingredients', 'ING-KARAAGE', 'Chicken and coating for karaage servings.', 60, 'servings', 12, 2800,
    (select id from public.menu_items where name = 'Karaage' limit 1), true),
  ('Onigiri Ingredients', 'ING-ONIGIRI', 'Rice, filling, and nori for onigiri servings.', 80, 'servings', 15, 1200,
    (select id from public.menu_items where name = 'Onigiri' limit 1), true),
  ('Yakisoba Ingredients', 'ING-YAKISOBA', 'Noodles, vegetables, and sauce for yakisoba servings.', 50, 'servings', 10, 2600,
    (select id from public.menu_items where name = 'Yakisoba' limit 1), true),
  ('Korokke Ingredients', 'ING-KOROKKE', 'Potato croquette mix and breading for korokke servings.', 60, 'servings', 12, 1400,
    (select id from public.menu_items where name = 'Korokke' limit 1), true),
  ('Gyoza Ingredients', 'ING-GYOZA', 'Dumpling wrappers and filling for gyoza servings.', 60, 'servings', 12, 2400,
    (select id from public.menu_items where name = 'Gyoza' limit 1), true),
  ('Dango Ingredients', 'ING-DANGO', 'Rice dumplings and glaze for dango servings.', 70, 'servings', 15, 1200,
    (select id from public.menu_items where name = 'Dango' limit 1), true);
