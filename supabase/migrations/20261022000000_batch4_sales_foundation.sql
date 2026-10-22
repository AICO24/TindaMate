-- ============================================================================
-- TindaMate — Batch 4: Sales Feature Foundation Migration
-- File: supabase/migrations/20261022000000_batch4_sales_foundation.sql
--
-- Purpose:
--   Establishes the `public.sales` table, data integrity constraints, indexes,
--   store-isolated Row Level Security (RLS) policies, and the atomic
--   `public.record_product_sale` transactional function for recording a
--   completed product sale and deducting inventory stock consistently.
--
-- Store Ownership Convention:
--   Matches `public.products` — `store_id` references the authenticated
--   vendor's `auth.users(id)` (`DEFAULT auth.uid()`).
-- ============================================================================

-- 1. Create the `public.sales` table
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  total_amount numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT sales_product_name_not_empty CHECK (char_length(btrim(product_name)) > 0),
  CONSTRAINT sales_unit_not_empty CHECK (char_length(btrim(unit)) > 0),
  CONSTRAINT sales_quantity_positive CHECK (quantity > 0),
  CONSTRAINT sales_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT sales_total_amount_non_negative CHECK (total_amount >= 0),
  CONSTRAINT sales_total_matches_calculation CHECK (total_amount = round(unit_price * quantity, 2))
);

-- 2. Indexes for store-scoped queries and product lookups
CREATE INDEX IF NOT EXISTS idx_sales_store_id
  ON public.sales (store_id);

CREATE INDEX IF NOT EXISTS idx_sales_store_id_created_at
  ON public.sales (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_product_id
  ON public.sales (product_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — Strict per-store isolation (`auth.uid() = store_id`)
--    Authenticated users can only read and create sales belonging to their own
--    authorized store (`auth.uid()`) and only for products they own.

DROP POLICY IF EXISTS "Store owners can view their own sales" ON public.sales;
CREATE POLICY "Store owners can view their own sales"
  ON public.sales
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can insert their own sales" ON public.sales;
CREATE POLICY "Store owners can insert their own sales"
  ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = store_id
    AND EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id
        AND p.store_id = auth.uid()
    )
  );

-- 5. Atomic Sale Recording & Stock Deduction Function (`public.record_product_sale`)
--    Executes inside a single PostgreSQL transaction with `SECURITY INVOKER`
--    so RLS remains fully active:
--      1. Verifies authenticated user session (`auth.uid()`)
--      2. Validates `p_quantity > 0`
--      3. Locks the product row (`FOR UPDATE`) and verifies ownership (`store_id = auth.uid()`)
--      4. Verifies current `stock_quantity >= p_quantity`
--      5. Snapshots `selling_price` as `unit_price` and calculates `total_amount`
--      6. Deducts `p_quantity` from `public.products.stock_quantity`
--         (which also triggers `trg_products_before_write` to update `status` & `updated_at`)
--      7. Inserts the sale record into `public.sales`
--    If either the stock update or sale insert fails, PostgreSQL rolls back the
--    entire transaction automatically.
CREATE OR REPLACE FUNCTION public.record_product_sale(
  p_product_id uuid,
  p_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid := auth.uid();
  v_product public.products%ROWTYPE;
  v_updated_product public.products%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_unit_price numeric(12, 2);
  v_total_amount numeric(12, 2);
BEGIN
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Your session has expired. Please log in again.'
      USING ERRCODE = '28000';
  END IF;

  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Please select a valid product.'
      USING ERRCODE = '22023';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than 0.'
      USING ERRCODE = '22023';
  END IF;

  -- Lock the product row and verify it exists and belongs to the authenticated store
  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND store_id = v_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or does not belong to your store.'
      USING ERRCODE = 'P0002';
  END IF;

  -- Re-check current stock before confirming sale
  IF v_product.stock_quantity < p_quantity THEN
    RAISE EXCEPTION 'Not enough stock available.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Snapshot unit price at the time of sale and compute centavo-accurate total
  v_unit_price := round(v_product.selling_price, 2);
  v_total_amount := round(v_unit_price * p_quantity, 2);

  -- Deduct sold quantity from product inventory
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  WHERE id = v_product.id
    AND store_id = v_store_id
  RETURNING * INTO v_updated_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Could not update product stock. Sale was not recorded.'
      USING ERRCODE = 'P0003';
  END IF;

  -- Create the sale transaction record
  INSERT INTO public.sales (
    store_id,
    product_id,
    product_name,
    unit,
    quantity,
    unit_price,
    total_amount
  )
  VALUES (
    v_store_id,
    v_product.id,
    v_product.name,
    v_product.unit,
    p_quantity,
    v_unit_price,
    v_total_amount
  )
  RETURNING * INTO v_sale;

  RETURN jsonb_build_object(
    'sale', to_jsonb(v_sale),
    'product', to_jsonb(v_updated_product)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_product_sale(uuid, integer) TO authenticated;

