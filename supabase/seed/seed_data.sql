-- ============================================================================
-- TindaMate — Batch 10B-8: Comprehensive Database Seed Script for Testing
-- File: supabase/seed/seed_data.sql
--
-- PURPOSE:
--   Populates the Supabase database with realistic Filipino sari-sari store data
--   for testing Dashboard KPIs, Sales Charts, Reports, Inventory & Utang.
--
-- HOW TO RUN IN SUPABASE SQL EDITOR:
--   1. Log in to your Supabase Dashboard: https://supabase.com/dashboard
--   2. Navigate to "SQL Editor" -> Click "New query".
--   3. Paste this entire script into the editor.
--   4. (Optional) If you have multiple store accounts, set your specific store UUID
--      in the DECLARE block below (variable `v_store_id`).
--      By default, it automatically targets the most recently created user in `auth.users`.
--   5. Click "RUN" (green button).
--
-- WARNING:
--   FOR DEVELOPMENT / STAGING TESTING ONLY. DO NOT RUN IN A LIVE PRODUCTION STORE!
--   This script cleans existing test data for the target store to ensure clean idempotency.
-- ============================================================================

DO $$
DECLARE
  -- Target Store UUID: Defaults to the latest registered user in auth.users
  -- Or replace with your explicit store UUID: v_store_id := '00000000-0000-0000-0000-000000000000'::uuid;
  v_store_id uuid;

  -- 20 Product UUIDs
  p_coke               uuid := gen_random_uuid();
  p_sprite             uuid := gen_random_uuid();
  p_royal              uuid := gen_random_uuid();
  p_great_taste_white  uuid := gen_random_uuid();
  p_nescafe_classic    uuid := gen_random_uuid();
  p_bear_brand         uuid := gen_random_uuid();
  p_canton_calamansi   uuid := gen_random_uuid();
  p_canton_chilimansi  uuid := gen_random_uuid();
  p_lucky_beef         uuid := gen_random_uuid();
  p_lucky_chicken      uuid := gen_random_uuid();
  p_silver_swan        uuid := gen_random_uuid();
  p_datu_puti          uuid := gen_random_uuid();
  p_magic_sarap        uuid := gen_random_uuid();
  p_corned_beef        uuid := gen_random_uuid();
  p_sardines           uuid := gen_random_uuid();
  p_meat_loaf          uuid := gen_random_uuid();
  p_skyflakes          uuid := gen_random_uuid();
  p_piattos            uuid := gen_random_uuid();
  p_safeguard          uuid := gen_random_uuid();
  p_palmolive          uuid := gen_random_uuid();

  -- 5 Customer UUIDs
  c_nena     uuid := gen_random_uuid();
  c_berting  uuid := gen_random_uuid();
  c_marites  uuid := gen_random_uuid();
  c_jun      uuid := gen_random_uuid();
  c_grace    uuid := gen_random_uuid();

  -- Credit Account UUIDs
  ca_nena    uuid := gen_random_uuid();
  ca_berting uuid := gen_random_uuid();
  ca_marites uuid := gen_random_uuid();
  ca_jun     uuid := gen_random_uuid();
  ca_grace   uuid := gen_random_uuid();

  -- Transaction helpers
  s_id uuid;
BEGIN
  -- 1. Identify Store ID
  SELECT id INTO v_store_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No user found in auth.users. Please register/sign up an account first before running this seed script.';
  END IF;

  RAISE NOTICE 'Seeding realistic sari-sari store test data for Store ID: %', v_store_id;

  -- 2. Idempotent cleanup of store records
  DELETE FROM public.credit_transactions WHERE store_id = v_store_id;
  DELETE FROM public.credit_accounts WHERE store_id = v_store_id;
  DELETE FROM public.customers WHERE store_id = v_store_id;
  DELETE FROM public.expenses WHERE store_id = v_store_id;
  DELETE FROM public.sale_items WHERE store_id = v_store_id;
  DELETE FROM public.sales WHERE store_id = v_store_id;
  DELETE FROM public.products WHERE store_id = v_store_id;

  -- ==========================================================================
  -- A. PRODUCTS (20 items: 5 Out of Stock, 5 Low Stock, 10 In Stock)
  -- Tracked vs untracked cost_price for robust COGS & Profit testing
  -- ==========================================================================
  INSERT INTO public.products (id, store_id, name, category, selling_price, cost_price, stock_quantity, low_stock_threshold, unit, status) VALUES
    -- 10 In Stock Items
    (p_coke,              v_store_id, 'Coca-Cola Mismo 290ml',               'Beverages',       20.00, 16.50, 30,  8, 'bottle', 'In Stock'),
    (p_sprite,            v_store_id, 'Sprite Mismo 290ml',                  'Beverages',       20.00, 16.50, 24,  6, 'bottle', 'In Stock'),
    (p_bear_brand,        v_store_id, 'Bear Brand Powdered Milk 33g',        'Beverages',       18.00, 15.00, 36, 10, 'sachet', 'In Stock'),
    (p_canton_calamansi,  v_store_id, 'Lucky Me! Pancit Canton Calamansi 80g','Instant Noodles', 17.00, 14.00, 42, 10, 'pack',   'In Stock'),
    (p_lucky_beef,        v_store_id, 'Lucky Me! Instant Mami Beef 55g',      'Instant Noodles', 15.00, 12.25, 28,  8, 'pack',   'In Stock'),
    (p_silver_swan,       v_store_id, 'Silver Swan Soy Sauce 385ml',         'Condiments',      26.00, 21.50, 16,  4, 'bottle', 'In Stock'),
    (p_magic_sarap,       v_store_id, 'Maggi Magic Sarap 8g',                'Condiments',       7.00,  5.25, 75, 15, 'sachet', 'In Stock'),
    (p_sardines,          v_store_id, 'Mega Sardines in Tomato Sauce 155g',  'Canned Goods',    28.00, 23.00, 25,  6, 'can',    'In Stock'),
    (p_skyflakes,         v_store_id, 'SkyFlakes Crackers Singles',          'Snacks',           9.00,  7.20, 50, 12, 'pack',   'In Stock'),
    (p_safeguard,         v_store_id, 'Safeguard Pure White Soap 60g',       'Toiletries',      25.00,  NULL, 20,  5, 'bar',    'In Stock'),

    -- 5 Low Stock Items (stock_quantity <= low_stock_threshold)
    (p_great_taste_white, v_store_id, 'Great Taste White Twin Pack',         'Beverages',       15.00, 12.00,  5, 10, 'sachet', 'Low Stock'),
    (p_canton_chilimansi, v_store_id, 'Lucky Me! Pancit Canton Chilimansi 80g','Instant Noodles', 17.00, 14.00,  6, 10, 'pack',   'Low Stock'),
    (p_corned_beef,       v_store_id, 'Argentina Corned Beef 150g',          'Canned Goods',    42.00, 35.00,  4,  5, 'can',    'Low Stock'),
    (p_piattos,           v_store_id, 'Piattos Cheese 85g',                  'Snacks',          40.00, 33.50,  3,  5, 'pack',   'Low Stock'),
    (p_palmolive,         v_store_id, 'Palmolive Intensive Moisture Shampoo','Toiletries',       8.00,  6.50,  4,  8, 'sachet', 'Low Stock'),

    -- 5 Out of Stock Items (stock_quantity = 0)
    (p_royal,             v_store_id, 'Royal Tru-Orange Mismo 290ml',        'Beverages',       20.00, 16.50,  0,  6, 'bottle', 'Out of Stock'),
    (p_nescafe_classic,   v_store_id, 'Nescafe Classic Sachet 2g',           'Beverages',        5.00,  3.80,  0, 15, 'sachet', 'Out of Stock'),
    (p_lucky_chicken,     v_store_id, 'Lucky Me! Instant Mami Chicken 55g',   'Instant Noodles', 15.00, 12.25,  0,  8, 'pack',   'Out of Stock'),
    (p_datu_puti,         v_store_id, 'Datu Puti Vinegar 385ml',             'Condiments',      24.00,  NULL,  0,  4, 'bottle', 'Out of Stock'),
    (p_meat_loaf,         v_store_id, 'CDO Meat Loaf 150g',                  'Canned Goods',    26.00, 21.00,  0,  5, 'can',    'Out of Stock');

  -- ==========================================================================
  -- B. CUSTOMERS (5 items: 2 active Utang balances, 3 settled / zero balance)
  -- ==========================================================================
  INSERT INTO public.customers (id, store_id, name, phone, notes, is_active) VALUES
    (c_nena,    v_store_id, 'Aling Nena Santos',    '09171234567', 'Suki sa kanto, kinsenas magbayad', true),
    (c_berting, v_store_id, 'Mang Berting Ramos',   '09289876543', 'Tricycle driver, weekly ang hulog', true),
    (c_marites, v_store_id, 'Marites Dela Cruz',    '09195551234', 'Kapitbahay sa tapat, good payer',  true),
    (c_jun,     v_store_id, 'Kuya Jun Pandesal',    '09228889900', 'Panadero sa umaga, laging cash',   true),
    (c_grace,   v_store_id, 'Ate Grace Tindahan',   '09087776655', 'Regular buyer, settled record',    true);

  INSERT INTO public.credit_accounts (id, customer_id, store_id, status) VALUES
    (ca_nena,    c_nena,    v_store_id, 'open'),
    (ca_berting, c_berting, v_store_id, 'open'),
    (ca_marites, c_marites, v_store_id, 'settled'),
    (ca_jun,     c_jun,     v_store_id, 'settled'),
    (ca_grace,   c_grace,   v_store_id, 'settled');

  -- Customer 1: Aling Nena (Active Utang: Charge 480 - Payment 200 = 280.00 Balance)
  INSERT INTO public.credit_transactions (credit_account_id, customer_id, store_id, transaction_type, amount, notes, created_at) VALUES
    (ca_nena, c_nena, v_store_id, 'charge',  480.00, 'Utang groceries (canned goods & condiments)', now() - interval '4 days' + interval '2 hours'),
    (ca_nena, c_nena, v_store_id, 'payment', 200.00, 'Partial cash payment',                      now() - interval '1 day'  + interval '3 hours');

  -- Customer 2: Mang Berting (Active Utang: Charge 380 = 380.00 Balance)
  INSERT INTO public.credit_transactions (credit_account_id, customer_id, store_id, transaction_type, amount, notes, created_at) VALUES
    (ca_berting, c_berting, v_store_id, 'charge', 380.00, 'Utang merienda & noodles', now() - interval '2 days' + interval '5 hours');

  -- Customer 3: Marites (Charge 150 - Payment 150 = 0.00 Balance)
  INSERT INTO public.credit_transactions (credit_account_id, customer_id, store_id, transaction_type, amount, notes, created_at) VALUES
    (ca_marites, c_marites, v_store_id, 'charge',  150.00, 'Utang softdrinks & snacks', now() - interval '6 days' + interval '1 hours'),
    (ca_marites, c_marites, v_store_id, 'payment', 150.00, 'Full payment settlement',  now() - interval '2 days' + interval '4 hours');

  -- Customer 4: Kuya Jun (Charge 95 - Payment 95 = 0.00 Balance)
  INSERT INTO public.credit_transactions (credit_account_id, customer_id, store_id, transaction_type, amount, notes, created_at) VALUES
    (ca_jun, c_jun, v_store_id, 'charge',  95.00, 'Utang kape twin packs', now() - interval '10 days' + interval '1 hours'),
    (ca_jun, c_jun, v_store_id, 'payment', 95.00, 'Full payment settlement', now() - interval '8 days'  + interval '2 hours');

  -- Customer 5: Ate Grace (Zero balance, no outstanding)

  -- ==========================================================================
  -- C. SALES (HISTORICAL & REALISTIC SPREAD)
  -- 1. Today (3 sales: Morning, Afternoon, Evening PHT)
  -- 2. This Week (2 sales on previous days)
  -- 3. This Month (5 sales spread across weeks)
  -- 4. Past 3 Months (15 sales for "All Time" reports & charts)
  -- ==========================================================================

  -- --- 1. TODAY'S SALES (3 Sales) ---
  -- Today Sale 1 (Morning Rush ~8:30 AM PHT): Cash
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Breakfast Rush Cart', 14, 0, 245.00, 3, 'cash', date_trunc('day', now()) + interval '8 hours 30 minutes');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_great_taste_white, 'Great Taste White Twin Pack',          7, 15.00, 12.00, 105.00),
    (s_id, v_store_id, p_canton_calamansi,  'Lucky Me! Pancit Canton Calamansi 80g', 5, 17.00, 14.00,  85.00),
    (s_id, v_store_id, p_skyflakes,         'SkyFlakes Crackers Singles',            6,  9.00,  7.20,  54.00);

  -- Today Sale 2 (Afternoon Meriendas ~2:15 PM PHT): Cash
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Afternoon Merienda', 10, 0, 200.00, 2, 'cash', date_trunc('day', now()) + interval '14 hours 15 minutes');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_coke,              'Coca-Cola Mismo 290ml',                6, 20.00, 16.50, 120.00),
    (s_id, v_store_id, p_piattos,           'Piattos Cheese 85g',                   2, 40.00, 33.50,  80.00);

  -- Today Sale 3 (Evening Grocery / Utang ~7:00 PM PHT): Credit Sale linked to Aling Nena
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, customer_id, customer_name, created_at)
  VALUES (s_id, v_store_id, 'Dinner Ingredients (Utang)', 6, 0, 170.00, 3, 'credit', c_nena, 'Aling Nena Santos', date_trunc('day', now()) + interval '19 hours 0 minutes');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_corned_beef,       'Argentina Corned Beef 150g',           2, 42.00, 35.00,  84.00),
    (s_id, v_store_id, p_silver_swan,       'Silver Swan Soy Sauce 385ml',          2, 26.00, 21.50,  52.00),
    (s_id, v_store_id, p_magic_sarap,       'Maggi Magic Sarap 8g',                 4,  7.00,  5.25,  28.00);

  -- --- 2. THIS WEEK (2 Sales on previous days this week) ---
  -- Yesterday: Cash
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Canned Goods & Drinks', 8, 0, 222.00, 2, 'cash', now() - interval '1 day');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_sardines,          'Mega Sardines in Tomato Sauce 155g',   5, 28.00, 23.00, 140.00),
    (s_id, v_store_id, p_coke,              'Coca-Cola Mismo 290ml',                4, 20.00, 16.50,  80.00);

  -- 2 Days Ago: Utang linked to Mang Berting
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, customer_id, customer_name, created_at)
  VALUES (s_id, v_store_id, 'Merienda Grocery', 12, 0, 210.00, 2, 'credit', c_berting, 'Mang Berting Ramos', now() - interval '2 days');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_canton_calamansi,  'Lucky Me! Pancit Canton Calamansi 80g', 6, 17.00, 14.00, 102.00),
    (s_id, v_store_id, p_bear_brand,        'Bear Brand Powdered Milk 33g',         6, 18.00, 15.00, 108.00);

  -- --- 3. THIS MONTH (5 Sales spread across different weeks) ---
  -- Week 2 (approx 8 days ago)
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Pantry Restock Cart', 15, 0, 310.00, 3, 'cash', now() - interval '8 days');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_great_taste_white, 'Great Taste White Twin Pack',          8, 15.00, 12.00, 120.00),
    (s_id, v_store_id, p_sardines,          'Mega Sardines in Tomato Sauce 155g',   5, 28.00, 23.00, 140.00),
    (s_id, v_store_id, p_safeguard,         'Safeguard Pure White Soap 60g',        2, 25.00,  NULL,  50.00);

  -- Week 2 (approx 11 days ago)
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Snacks & Cold Drinks', 9, 0, 180.00, 2, 'cash', now() - interval '11 days');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_sprite,            'Sprite Mismo 290ml',                   5, 20.00, 16.50, 100.00),
    (s_id, v_store_id, p_piattos,           'Piattos Cheese 85g',                   2, 40.00, 33.50,  80.00);

  -- Week 3 (approx 15 days ago)
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Weekly Noodles & Milk', 16, 0, 274.00, 2, 'cash', now() - interval '15 days');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_lucky_beef,        'Lucky Me! Instant Mami Beef 55g',      10, 15.00, 12.25, 150.00),
    (s_id, v_store_id, p_corned_beef,       'Argentina Corned Beef 150g',            3, 42.00, 35.00, 126.00);

  -- Week 3 (approx 19 days ago)
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Condiments & Biscuits', 10, 0, 181.00, 3, 'cash', now() - interval '19 days');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_silver_swan,       'Silver Swan Soy Sauce 385ml',           3, 26.00, 21.50,  78.00),
    (s_id, v_store_id, p_magic_sarap,       'Maggi Magic Sarap 8g',                  9,  7.00,  5.25,  63.00),
    (s_id, v_store_id, p_skyflakes,         'SkyFlakes Crackers Singles',            4,  9.00,  7.20,  36.00);

  -- Week 4 (approx 24 days ago)
  s_id := gen_random_uuid();
  INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
  VALUES (s_id, v_store_id, 'Bulk Softdrinks Order', 15, 20.00, 300.00, 1, 'cash', now() - interval '24 days');
  INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
    (s_id, v_store_id, p_coke,              'Coca-Cola Mismo 290ml',                15, 20.00, 16.50, 300.00);

  -- --- 4. PAST 3 MONTHS (15 Sales for All-Time / Historical Charts) ---
  -- Month -1 (30 to 59 days ago): 6 sales
  FOR i IN 1..6 LOOP
    s_id := gen_random_uuid();
    INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
    VALUES (s_id, v_store_id, 'Historical Sale M-1 #' || i, 10 + i, 0, 200.00 + (i * 25), 2, 'cash', now() - interval '30 days' - (i * interval '4 days'));
    INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
      (s_id, v_store_id, p_canton_calamansi, 'Lucky Me! Pancit Canton Calamansi 80g', 6 + i, 17.00, 14.00, (6 + i) * 17.00),
      (s_id, v_store_id, p_coke,             'Coca-Cola Mismo 290ml',                 4,     20.00, 16.50, 80.00);
  END LOOP;

  -- Month -2 (60 to 89 days ago): 5 sales
  FOR i IN 1..5 LOOP
    s_id := gen_random_uuid();
    INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
    VALUES (s_id, v_store_id, 'Historical Sale M-2 #' || i, 8 + i, 0, 180.00 + (i * 30), 2, 'cash', now() - interval '60 days' - (i * interval '5 days'));
    INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
      (s_id, v_store_id, p_sardines,          'Mega Sardines in Tomato Sauce 155g',   4 + i, 28.00, 23.00, (4 + i) * 28.00),
      (s_id, v_store_id, p_great_taste_white, 'Great Taste White Twin Pack',          4,     15.00, 12.00, 60.00);
  END LOOP;

  -- Month -3 (90 to 110 days ago): 4 sales
  FOR i IN 1..4 LOOP
    s_id := gen_random_uuid();
    INSERT INTO public.sales (id, store_id, product_name, quantity, unit_price, total_amount, item_count, payment_method, created_at)
    VALUES (s_id, v_store_id, 'Historical Sale M-3 #' || i, 7 + i, 0, 160.00 + (i * 35), 2, 'cash', now() - interval '90 days' - (i * interval '5 days'));
    INSERT INTO public.sale_items (sale_id, store_id, product_id, product_name, quantity, unit_price, cost_price, subtotal) VALUES
      (s_id, v_store_id, p_corned_beef,       'Argentina Corned Beef 150g',           3 + i, 42.00, 35.00, (3 + i) * 42.00),
      (s_id, v_store_id, p_skyflakes,         'SkyFlakes Crackers Singles',           4,      9.00,  7.20, 36.00);
  END LOOP;

  -- ==========================================================================
  -- D. EXPENSES (3 This Month + 2 Past Months)
  -- Categories strictly checked: 'Utilities' | 'Rent' | 'Supplies' | 'Transportation' | etc.
  -- ==========================================================================
  INSERT INTO public.expenses (store_id, title, category, amount, expense_date, notes) VALUES
    -- 3 This Month
    (v_store_id, 'Tindahan Submeter Kuryente',  'Utilities',      480.00, CURRENT_DATE - 3,  'Ref at ilaw share'),
    (v_store_id, 'Plastic Bags & Straws Pack',  'Supplies',        95.00, CURRENT_DATE - 7,  'Medium sando bags at ice candy plastic'),
    (v_store_id, 'Palengke Restock Pamasahe',   'Transportation', 120.00, CURRENT_DATE - 12, 'Tricycle balikan Puregold / Palengke'),

    -- 2 Past Months
    (v_store_id, 'Previous Month Kuryente',     'Utilities',      510.00, CURRENT_DATE - 35, 'Previous month refrigerator electric bill'),
    (v_store_id, 'Pwesto Monthly Space Rent',   'Rent',          1500.00, CURRENT_DATE - 65, 'Sari-sari space rental fee');

  RAISE NOTICE 'SUCCESS: Successfully generated 20 Products, 5 Customers, 25 Historical Sales with line items, and 5 Expenses!';
END $$;
