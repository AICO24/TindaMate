-- ============================================================================
-- TindaMate — Batch 7A: Multi-Item POS Cart & Checkout Database Foundation
-- File: supabase/migrations/20261026000000_batch7_multi_item_pos_cart.sql
--
-- Purpose:
--   1. Evolves `public.sales` into the Transaction Header table:
--      - Adds `item_count` (number of distinct product line items).
--      - Adds `idempotency_key` with a store-scoped partial unique index.
--      - Relaxes single-item calculation check constraint.
--      - Relaxes `product_id` NOT NULL constraint for multi-item transactions.
--      - Updates RLS INSERT policy to accommodate multi-item headers.
--   2. Establishes `public.sale_items` for individual transaction line items:
--      - Relational foreign keys: `sale_id REFERENCES public.sales(id) ON DELETE CASCADE`
--        and `product_id REFERENCES public.products(id) ON DELETE RESTRICT`.
--      - Authoritative snapshots for `selling_price` and `cost_price`.
--      - Strict Row Level Security (RLS) policies scoped to `store_id = auth.uid()`.
--      - Check constraints enforcing positive quantities, non-negative prices,
--        and exact line subtotal matching (`subtotal = round(unit_price * quantity, 2)`).
--   3. Idempotently backfills existing single-product sales into `public.sale_items`
--      without fabricating historical cost prices (leaving `cost_price` as NULL).
--   4. Creates the atomic `public.record_cart_sale` PostgreSQL RPC function:
--      - Accepts cart items `[{"product_id": uuid, "quantity": integer}, ...]`
--        and optional `p_idempotency_key uuid`.
--      - Enforces strict store isolation via `auth.uid()`.
--      - Re-entrant & idempotent: returns existing transaction on duplicate retry
--        without double-deducting stock or creating duplicate records.
--      - Deterministic row locking (`ORDER BY product_id ASC FOR UPDATE`) to prevent deadlocks.
--      - Authoritative server-side price lookup (ignores any client-sent prices).
--      - Snapshots selling price and current cost price for each product.
--      - Atomic stock deduction and stock status trigger synchronization.
--      - Full transaction rollback if any single item fails stock validation.
--   5. Preserves existing `public.record_product_sale` for backward compatibility.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Evolve `public.sales` into the Transaction Header table
-- ----------------------------------------------------------------------------

-- Add item_count (number of distinct product line items in this sale)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS item_count integer NOT NULL DEFAULT 1;

-- Add check constraint to ensure item_count is positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_item_count_positive'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_item_count_positive CHECK (item_count > 0);
  END IF;
END $$;

-- Add idempotency_key for safe transaction retries
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

-- Drop legacy single-item calculation constraint if present
-- (In a multi-item sale, total_amount is the sum of all item subtotals,
-- not unit_price * quantity of a single line)
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_total_matches_calculation;

-- Make product_id nullable on public.sales so multi-item sales can either
-- store the primary product ID or be null, without failing single-product FK
ALTER TABLE public.sales
  ALTER COLUMN product_id DROP NOT NULL;

-- Store-scoped partial unique index on (store_id, idempotency_key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_store_id_idempotency_key
  ON public.sales (store_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Update INSERT policy on public.sales to allow multi-item headers
-- where product_id may be null, while strictly maintaining auth.uid() = store_id
DROP POLICY IF EXISTS "Store owners can insert their own sales" ON public.sales;
CREATE POLICY "Store owners can insert their own sales"
  ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = store_id
    AND (
      product_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.products p
        WHERE p.id = product_id
          AND p.store_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Create `public.sale_items` table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  cost_price numeric(12, 2),
  subtotal numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT sale_items_product_name_not_empty CHECK (char_length(btrim(product_name)) > 0),
  CONSTRAINT sale_items_unit_not_empty CHECK (char_length(btrim(unit)) > 0),
  CONSTRAINT sale_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT sale_items_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT sale_items_cost_price_non_negative CHECK (cost_price IS NULL OR cost_price >= 0),
  CONSTRAINT sale_items_subtotal_non_negative CHECK (subtotal >= 0),
  CONSTRAINT sale_items_subtotal_matches_calculation CHECK (subtotal = round(unit_price * quantity, 2))
);

-- Indexes for sale_items access patterns
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON public.sale_items (sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_store_id
  ON public.sale_items (store_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product_id
  ON public.sale_items (product_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_store_id_created_at
  ON public.sale_items (store_id, created_at DESC);

-- Enable Row Level Security (RLS) on sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Store-isolated SELECT policy
DROP POLICY IF EXISTS "Store owners can view their own sale items" ON public.sale_items;
CREATE POLICY "Store owners can view their own sale items"
  ON public.sale_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

-- Store-isolated INSERT policy verifying sale and product ownership
DROP POLICY IF EXISTS "Store owners can insert their own sale items" ON public.sale_items;
CREATE POLICY "Store owners can insert their own sale items"
  ON public.sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = store_id
    AND EXISTS (
      SELECT 1
      FROM public.sales s
      WHERE s.id = sale_id
        AND s.store_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id
        AND p.store_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Idempotently backfill existing legacy sales into `public.sale_items`
-- ----------------------------------------------------------------------------

INSERT INTO public.sale_items (
  sale_id,
  store_id,
  product_id,
  product_name,
  unit,
  quantity,
  unit_price,
  cost_price,
  subtotal,
  created_at
)
SELECT
  s.id,
  s.store_id,
  s.product_id,
  s.product_name,
  s.unit,
  s.quantity,
  s.unit_price,
  NULL, -- Historical cost prices are not fabricated
  s.total_amount,
  s.created_at
FROM public.sales s
WHERE s.product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.sale_items si
    WHERE si.sale_id = s.id
  );

-- Ensure all existing legacy sales have item_count set to 1
UPDATE public.sales
SET item_count = 1
WHERE item_count IS NULL;

-- ----------------------------------------------------------------------------
-- 4. Atomic Multi-Item Cart Checkout RPC (`public.record_cart_sale`)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_cart_sale(
  p_items jsonb,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid := auth.uid();
  v_existing_sale public.sales%ROWTYPE;
  v_existing_items jsonb;
  v_elem jsonb;
  v_item record;
  v_product public.products%ROWTYPE;
  v_updated_product public.products%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_sale_item public.sale_items%ROWTYPE;
  v_staged_item jsonb;

  v_unit_price numeric(12, 2);
  v_cost_price numeric(12, 2);
  v_line_total numeric(12, 2);
  v_grand_total numeric(12, 2) := 0.00;
  v_total_units integer := 0;
  v_item_count integer := 0;

  v_first_product_id uuid := NULL;
  v_first_product_name text := NULL;
  v_first_unit text := NULL;
  v_first_unit_price numeric(12, 2) := 0.00;

  v_summary_name text;
  v_summary_unit text;
  v_summary_product_id uuid;
  v_summary_unit_price numeric(12, 2);

  v_staged_items jsonb := '[]'::jsonb;
  v_created_items jsonb := '[]'::jsonb;
  v_updated_products jsonb := '[]'::jsonb;
BEGIN
  -- 1. Security check: User session must be authenticated
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Your session has expired. Please log in again.'
      USING ERRCODE = '28000';
  END IF;

  -- 2. Idempotency handling: If key provided, acquire transaction advisory lock
  --    to prevent concurrent double-execution of the same idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(v_store_id::text || ':' || p_idempotency_key::text));

    SELECT *
    INTO v_existing_sale
    FROM public.sales
    WHERE store_id = v_store_id
      AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      SELECT coalesce(jsonb_agg(to_jsonb(si) ORDER BY si.created_at ASC), '[]'::jsonb)
      INTO v_existing_items
      FROM public.sale_items si
      WHERE si.sale_id = v_existing_sale.id
        AND si.store_id = v_store_id;

      RETURN jsonb_build_object(
        'sale', to_jsonb(v_existing_sale),
        'items', v_existing_items,
        'updated_products', '[]'::jsonb,
        'is_retry', true
      );
    END IF;
  END IF;

  -- 3. Payload validation
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty. Please add at least one product.'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Cart exceeds maximum allowed limit of 100 items.'
      USING ERRCODE = '22023';
  END IF;

  -- Validate each element structure prior to database operations
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF jsonb_typeof(v_elem) <> 'object' THEN
      RAISE EXCEPTION 'Invalid cart item payload format.'
        USING ERRCODE = '22023';
    END IF;

    IF v_elem->>'product_id' IS NULL OR btrim(v_elem->>'product_id') = '' THEN
      RAISE EXCEPTION 'Each cart item must specify a valid product_id.'
        USING ERRCODE = '22023';
    END IF;

    IF (v_elem->>'product_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'Invalid product ID format in cart: %', v_elem->>'product_id'
        USING ERRCODE = '22023';
    END IF;

    IF v_elem->>'quantity' IS NULL OR (v_elem->>'quantity') !~ '^\d+$' OR (v_elem->>'quantity')::integer <= 0 THEN
      RAISE EXCEPTION 'Quantity for each product must be a whole number greater than 0.'
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- 4. Phase 1: Aggregate duplicate product entries, lock product rows in
  --    deterministic order (ORDER BY product_id ASC FOR UPDATE) to eliminate
  --    deadlock risks, validate stock, and snapshot authoritative prices.
  FOR v_item IN
    SELECT
      (elem->>'product_id')::uuid AS product_id,
      sum((elem->>'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem->>'product_id')::uuid
    ORDER BY (elem->>'product_id')::uuid ASC
  LOOP
    -- Lock product row and verify store ownership
    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
      AND store_id = v_store_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % was not found or does not belong to your store.', v_item.product_id
        USING ERRCODE = 'P0002';
    END IF;

    -- Authoritative stock availability check
    IF v_product.stock_quantity < v_item.quantity THEN
      RAISE EXCEPTION 'Not enough stock available for "%" (only % % available, requested %).',
        v_product.name, v_product.stock_quantity, v_product.unit, v_item.quantity
        USING ERRCODE = 'P0001';
    END IF;

    -- Snapshot authoritative prices directly from the locked product row
    v_unit_price := round(v_product.selling_price, 2);
    v_cost_price := CASE
      WHEN v_product.cost_price IS NOT NULL THEN round(v_product.cost_price, 2)
      ELSE NULL
    END;
    v_line_total := round(v_unit_price * v_item.quantity, 2);

    -- Running totals
    v_grand_total := v_grand_total + v_line_total;
    v_total_units := v_total_units + v_item.quantity;
    v_item_count := v_item_count + 1;

    -- Save first product information for legacy single-item summary compatibility
    IF v_item_count = 1 THEN
      v_first_product_id := v_product.id;
      v_first_product_name := v_product.name;
      v_first_unit := v_product.unit;
      v_first_unit_price := v_unit_price;
    END IF;

    -- Stage item for Phase 2 insertion
    v_staged_items := v_staged_items || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit', v_product.unit,
      'quantity', v_item.quantity,
      'unit_price', v_unit_price,
      'cost_price', v_cost_price,
      'subtotal', v_line_total
    );
  END LOOP;

  -- 5. Prepare legacy compatibility fields on the transaction header
  IF v_item_count = 1 THEN
    v_summary_name := v_first_product_name;
    v_summary_unit := v_first_unit;
    v_summary_unit_price := v_first_unit_price;
    v_summary_product_id := v_first_product_id;
  ELSE
    v_summary_name := v_first_product_name || ' + ' || (v_item_count - 1)::text || ' more';
    v_summary_unit := 'items';
    v_summary_unit_price := v_first_unit_price;
    v_summary_product_id := v_first_product_id;
  END IF;

  -- 6. Insert Transaction Header into `public.sales`
  INSERT INTO public.sales (
    store_id,
    product_id,
    product_name,
    unit,
    quantity,
    unit_price,
    total_amount,
    item_count,
    idempotency_key
  )
  VALUES (
    v_store_id,
    v_summary_product_id,
    v_summary_name,
    v_summary_unit,
    v_total_units,
    v_summary_unit_price,
    v_grand_total,
    v_item_count,
    p_idempotency_key
  )
  RETURNING * INTO v_sale;

  -- 7. Phase 2: Insert line items into `public.sale_items` and deduct inventory stock
  FOR v_staged_item IN SELECT * FROM jsonb_array_elements(v_staged_items) LOOP
    -- Insert line item
    INSERT INTO public.sale_items (
      sale_id,
      store_id,
      product_id,
      product_name,
      unit,
      quantity,
      unit_price,
      cost_price,
      subtotal
    )
    VALUES (
      v_sale.id,
      v_store_id,
      (v_staged_item->>'product_id')::uuid,
      v_staged_item->>'product_name',
      v_staged_item->>'unit',
      (v_staged_item->>'quantity')::integer,
      (v_staged_item->>'unit_price')::numeric,
      CASE
        WHEN (v_staged_item->>'cost_price') IS NOT NULL THEN (v_staged_item->>'cost_price')::numeric
        ELSE NULL
      END,
      (v_staged_item->>'subtotal')::numeric
    )
    RETURNING * INTO v_sale_item;

    v_created_items := v_created_items || to_jsonb(v_sale_item);

    -- Deduct sold quantity from product inventory
    -- (This also fires trg_products_before_write to update status and updated_at)
    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_staged_item->>'quantity')::integer,
        updated_at = now()
    WHERE id = (v_staged_item->>'product_id')::uuid
      AND store_id = v_store_id
    RETURNING * INTO v_updated_product;

    v_updated_products := v_updated_products || to_jsonb(v_updated_product);
  END LOOP;

  -- 8. Return composite transaction payload
  RETURN jsonb_build_object(
    'sale', to_jsonb(v_sale),
    'items', v_created_items,
    'updated_products', v_updated_products,
    'is_retry', false
  );
END;
$$;

-- Grant execution permission to authenticated store owners
GRANT EXECUTE ON FUNCTION public.record_cart_sale(jsonb, uuid) TO authenticated;

