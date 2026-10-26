-- ============================================================================
-- TindaMate — Batch 8C: Record Utang from POS Migration
-- File: supabase/migrations/20261026000002_batch8c_pos_record_utang.sql
--
-- Purpose:
--   1. Adds `payment_method` ('cash' | 'credit'), `customer_id`, and `customer_name`
--      to `public.sales` (Transaction Header table).
--   2. Updates `public.sales` RLS INSERT policy to verify customer ownership.
--   3. Upgrades `public.record_cart_sale` RPC to atomically support:
--      - Cash sales (existing behavior preserved 100% identically)
--      - Utang (credit) sales (atomic sale + sale_items + stock deduction + credit charge)
--   4. Preserves full idempotency and server-authoritative calculations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Evolve `public.sales` Header Table
-- ----------------------------------------------------------------------------

-- Add payment_method column (defaults to 'cash' for backward compatibility)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash';

-- Add customer_id referencing public.customers
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT;

-- Add customer_name snapshot for historical receipt accuracy
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_name text;

-- Add constraints on public.sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_payment_method_valid'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_payment_method_valid
      CHECK (payment_method IN ('cash', 'credit'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_credit_requires_customer'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_credit_requires_customer
      CHECK (payment_method = 'cash' OR (payment_method = 'credit' AND customer_id IS NOT NULL));
  END IF;
END $$;

-- Indexes for sales queries
CREATE INDEX IF NOT EXISTS idx_sales_store_id_customer_id
  ON public.sales (store_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_store_id_payment_method
  ON public.sales (store_id, payment_method);

-- ----------------------------------------------------------------------------
-- 2. Update `public.sales` RLS INSERT Policy
-- ----------------------------------------------------------------------------

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
    AND (
      customer_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_id
          AND c.store_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Upgrade `public.record_cart_sale` RPC
-- ----------------------------------------------------------------------------

-- Drop old 2-argument signature to avoid overloading ambiguity
DROP FUNCTION IF EXISTS public.record_cart_sale(jsonb, uuid);

CREATE OR REPLACE FUNCTION public.record_cart_sale(
  p_items jsonb,
  p_idempotency_key uuid DEFAULT NULL,
  p_payment_method text DEFAULT 'cash',
  p_customer_id uuid DEFAULT NULL
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
  v_existing_credit_tx jsonb := NULL;

  v_payment_method text;
  v_customer public.customers%ROWTYPE;
  v_credit_account public.credit_accounts%ROWTYPE;
  v_credit_tx public.credit_transactions%ROWTYPE;

  v_customer_id uuid := NULL;
  v_customer_name text := NULL;

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

  -- 2. Validate Payment Method
  v_payment_method := lower(coalesce(btrim(p_payment_method), 'cash'));
  IF v_payment_method NOT IN ('cash', 'credit') THEN
    RAISE EXCEPTION 'Invalid payment method: "%". Must be either "cash" or "credit".', p_payment_method
      USING ERRCODE = '22023';
  END IF;

  -- 3. If Utang (credit), validate customer ownership, existence, active status, and credit account
  IF v_payment_method = 'credit' THEN
    IF p_customer_id IS NULL THEN
      RAISE EXCEPTION 'A customer must be selected for Utang (credit) sales.'
        USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_customer
    FROM public.customers
    WHERE id = p_customer_id
      AND store_id = v_store_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Customer not found or does not belong to your store.'
        USING ERRCODE = 'P0002';
    END IF;

    IF NOT v_customer.is_active THEN
      RAISE EXCEPTION 'Cannot record credit for inactive customer "%". Please reactivate the customer first.', v_customer.name
        USING ERRCODE = '22023';
    END IF;

    v_customer_id := v_customer.id;
    v_customer_name := v_customer.name;

    -- Ensure customer has an open credit account (idempotent lookup/creation)
    SELECT *
    INTO v_credit_account
    FROM public.credit_accounts
    WHERE customer_id = v_customer.id
      AND store_id = v_store_id;

    IF NOT FOUND THEN
      INSERT INTO public.credit_accounts (store_id, customer_id, status)
      VALUES (v_store_id, v_customer.id, 'open')
      RETURNING * INTO v_credit_account;
    END IF;
  END IF;

  -- 4. Idempotency handling: If key provided, acquire transaction advisory lock
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

      SELECT to_jsonb(ct)
      INTO v_existing_credit_tx
      FROM public.credit_transactions ct
      WHERE ct.sale_id = v_existing_sale.id
        AND ct.store_id = v_store_id;

      RETURN jsonb_build_object(
        'sale', to_jsonb(v_existing_sale),
        'items', v_existing_items,
        'credit_transaction', v_existing_credit_tx,
        'updated_products', '[]'::jsonb,
        'is_retry', true
      );
    END IF;
  END IF;

  -- 5. Payload validation
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

  -- 6. Phase 1: Lock products in deterministic order (ORDER BY product_id ASC FOR UPDATE)
  --    to eliminate deadlock risks, validate stock, and snapshot authoritative prices.
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

  -- 7. Prepare legacy compatibility fields on the transaction header
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

  -- 8. Insert Transaction Header into `public.sales`
  INSERT INTO public.sales (
    store_id,
    product_id,
    product_name,
    unit,
    quantity,
    unit_price,
    total_amount,
    item_count,
    idempotency_key,
    payment_method,
    customer_id,
    customer_name
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
    p_idempotency_key,
    v_payment_method,
    v_customer_id,
    v_customer_name
  )
  RETURNING * INTO v_sale;

  -- 9. Phase 2: Insert line items into `public.sale_items` and deduct inventory stock
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
    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_staged_item->>'quantity')::integer,
        updated_at = now()
    WHERE id = (v_staged_item->>'product_id')::uuid
      AND store_id = v_store_id
    RETURNING * INTO v_updated_product;

    v_updated_products := v_updated_products || to_jsonb(v_updated_product);
  END LOOP;

  -- 10. Phase 3: If Utang (credit), insert immutable charge entry into `public.credit_transactions`
  IF v_payment_method = 'credit' THEN
    INSERT INTO public.credit_transactions (
      store_id,
      credit_account_id,
      customer_id,
      sale_id,
      transaction_type,
      amount,
      notes
    )
    VALUES (
      v_store_id,
      v_credit_account.id,
      v_customer.id,
      v_sale.id,
      'charge',
      v_grand_total,
      'Utang POS Sale #' || substring(v_sale.id::text, 1, 8)
    )
    RETURNING * INTO v_credit_tx;
  END IF;

  -- 11. Return composite transaction payload
  RETURN jsonb_build_object(
    'sale', to_jsonb(v_sale),
    'items', v_created_items,
    'credit_transaction', CASE WHEN v_payment_method = 'credit' THEN to_jsonb(v_credit_tx) ELSE NULL END,
    'updated_products', v_updated_products,
    'is_retry', false
  );
END;
$$;

-- Grant execution permission to authenticated store owners
GRANT EXECUTE ON FUNCTION public.record_cart_sale(jsonb, uuid, text, uuid) TO authenticated;

