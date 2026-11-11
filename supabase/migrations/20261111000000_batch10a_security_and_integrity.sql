-- ============================================================================
-- TindaMate — Batch 10A: Security, RLS Hardening & Credit Status Integrity
-- File: supabase/migrations/20261111000000_batch10a_security_and_integrity.sql
--
-- Purpose:
--   1. Storage RLS Hardening: Enforce store folder ownership on `storage.objects`
--      for the 'products' bucket. Authenticated users can only insert, update,
--      or delete objects where the top-level folder matches `auth.uid()::text`.
--   2. Credit Account Status Integrity: Deploy `public.sync_credit_account_totals()`
--      trigger on `public.credit_transactions`. Automatically updates `credit_accounts.status`
--      to 'open' when balance > 0 and 'settled' when balance = 0.
--   3. Safe Backfill: Sync all existing `public.credit_accounts` records with their
--      authoritative ledger balance.
--   4. Revoke execution of legacy single-item sale function `record_product_sale(uuid, integer)`
--      from authenticated users to ensure all POS sales use atomic `record_cart_sale`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STORAGE RLS HARDENING: PRODUCTS BUCKET
-- ----------------------------------------------------------------------------

-- Ensure public read access remains intact
DROP POLICY IF EXISTS "Public product image access" ON storage.objects;
CREATE POLICY "Public product image access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- Drop any previous permissive policies on storage.objects for products bucket
DROP POLICY IF EXISTS "Authenticated vendors can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated vendors can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated vendors can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own product images" ON storage.objects;

-- Create hardened policies enforcing folder ownership `(storage.foldername(name))[1] = auth.uid()::text`
CREATE POLICY "Authenticated users can upload own product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authenticated users can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 2. CREDIT ACCOUNT STATUS SYNCHRONIZATION TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_credit_account_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_balance numeric(12, 2);
  v_new_status text;
BEGIN
  -- Determine target credit account ID (supports INSERT, UPDATE, or DELETE)
  v_account_id := COALESCE(NEW.credit_account_id, OLD.credit_account_id);

  IF v_account_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Authoritative balance calculated from immutable ledger transactions
  SELECT COALESCE(
    sum(
      CASE
        WHEN ct.transaction_type = 'charge' THEN ct.amount
        WHEN ct.transaction_type = 'payment' THEN -ct.amount
        ELSE 0
      END
    ),
    0.00
  )::numeric(12, 2)
  INTO v_balance
  FROM public.credit_transactions ct
  WHERE ct.credit_account_id = v_account_id;

  -- Determine derived account status
  IF v_balance > 0 THEN
    v_new_status := 'open';
  ELSE
    v_new_status := 'settled';
  END IF;

  -- Update credit account status only when changed (prevents recursive or redundant writes)
  UPDATE public.credit_accounts
  SET status = v_new_status,
      updated_at = now()
  WHERE id = v_account_id
    AND status <> v_new_status;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to credit_transactions
DROP TRIGGER IF EXISTS trg_credit_transactions_sync_account_status ON public.credit_transactions;
CREATE TRIGGER trg_credit_transactions_sync_account_status
  AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_credit_account_totals();

-- ----------------------------------------------------------------------------
-- 3. SAFE BACKFILL FOR EXISTING CREDIT ACCOUNTS
-- ----------------------------------------------------------------------------

-- Synchronize any existing credit_accounts where status does not match current ledger balance
UPDATE public.credit_accounts ca
SET status = CASE
      WHEN (
        SELECT COALESCE(
          sum(
            CASE
              WHEN ct.transaction_type = 'charge' THEN ct.amount
              WHEN ct.transaction_type = 'payment' THEN -ct.amount
              ELSE 0
            END
          ),
          0.00
        )
        FROM public.credit_transactions ct
        WHERE ct.credit_account_id = ca.id
      ) > 0 THEN 'open'
      ELSE 'settled'
    END,
    updated_at = now()
WHERE ca.status <> CASE
      WHEN (
        SELECT COALESCE(
          sum(
            CASE
              WHEN ct.transaction_type = 'charge' THEN ct.amount
              WHEN ct.transaction_type = 'payment' THEN -ct.amount
              ELSE 0
            END
          ),
          0.00
        )
        FROM public.credit_transactions ct
        WHERE ct.credit_account_id = ca.id
      ) > 0 THEN 'open'
      ELSE 'settled'
    END;

-- ----------------------------------------------------------------------------
-- 4. REVOKE EXECUTION ON LEGACY SINGLE-ITEM SALE RPC
-- ----------------------------------------------------------------------------
-- Prevents clients from calling deprecated `record_product_sale` which bypasses
-- `sale_items` snapshotting and multi-item POS integrity.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'record_product_sale'
      AND pg_get_function_identity_arguments(p.oid) = 'product_id uuid, quantity integer'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.record_product_sale(uuid, integer) FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.record_product_sale(uuid, integer) FROM public;
  END IF;
END;
$$;
