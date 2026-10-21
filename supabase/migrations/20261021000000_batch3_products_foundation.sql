-- ============================================================================
-- TindaMate — Batch 3: Product & Inventory Foundation Migration
-- File: supabase/migrations/20261021000000_batch3_products_foundation.sql
--
-- Purpose:
--   Establishes the `public.products` table, constraints, indexes, automatic
--   `updated_at` timestamp trigger, and store-isolated Row Level Security (RLS)
--   policies for authenticated TindaMate store owners.
--
-- Store Ownership Convention:
--   In the current single-store-per-vendor foundation, `store_id` references
--   the authenticated vendor's `auth.users(id)` (`DEFAULT auth.uid()`).
-- ============================================================================

-- 1. Create the `public.products` table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  image_url text,
  selling_price numeric(12, 2) NOT NULL DEFAULT 0.00,
  cost_price numeric(12, 2),
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  unit text NOT NULL DEFAULT 'pcs',
  status text NOT NULL DEFAULT 'In Stock',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT products_name_not_empty CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT products_selling_price_non_negative CHECK (selling_price >= 0),
  CONSTRAINT products_cost_price_non_negative CHECK (cost_price IS NULL OR cost_price >= 0),
  CONSTRAINT products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT products_low_stock_threshold_non_negative CHECK (low_stock_threshold >= 0),
  CONSTRAINT products_unit_not_empty CHECK (char_length(btrim(unit)) > 0),
  CONSTRAINT products_status_valid CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock'))
);

-- Ensure image_url column exists if table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Indexes for fast store-scoped queries and sorting
CREATE INDEX IF NOT EXISTS idx_products_store_id
  ON public.products (store_id);

CREATE INDEX IF NOT EXISTS idx_products_store_id_name
  ON public.products (store_id, name);

CREATE INDEX IF NOT EXISTS idx_products_store_id_status
  ON public.products (store_id, status);

-- 3. Automatic `updated_at` AND computed `status` trigger function
--    Ensures database-level consistency for `status` and `updated_at` on every
--    INSERT or UPDATE, matching the centralized application stock-status rule:
--      IF stock_quantity <= 0 -> 'Out of Stock'
--      ELSE IF stock_quantity <= low_stock_threshold -> 'Low Stock'
--      ELSE -> 'In Stock'
CREATE OR REPLACE FUNCTION public.handle_products_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trim text fields cleanly
  NEW.name := btrim(NEW.name);
  IF NEW.category IS NOT NULL THEN
    NEW.category := NULLIF(btrim(NEW.category), '');
  END IF;
  NEW.unit := COALESCE(NULLIF(btrim(NEW.unit), ''), 'pcs');

  -- Enforce centralized stock status rule
  IF NEW.stock_quantity <= 0 THEN
    NEW.status := 'Out of Stock';
  ELSIF NEW.stock_quantity <= NEW.low_stock_threshold THEN
    NEW.status := 'Low Stock';
  ELSE
    NEW.status := 'In Stock';
  END IF;

  -- Maintain timestamps
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
  END IF;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_before_write ON public.products;

CREATE TRIGGER trg_products_before_write
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_products_before_write();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — Strict per-store isolation (`auth.uid() = store_id`)
--    Authenticated users can only read, create, and update products belonging
--    to their own authorized store (`auth.uid()`).

DROP POLICY IF EXISTS "Store owners can view their own products" ON public.products;
CREATE POLICY "Store owners can view their own products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can insert their own products" ON public.products;
CREATE POLICY "Store owners can insert their own products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can update their own products" ON public.products;
CREATE POLICY "Store owners can update their own products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

