-- ============================================================================
-- TindaMate — Batch 8E: Customer Payment & Settlement Foundation
-- File: supabase/migrations/20261027000000_batch8e_customer_payment_settlement.sql
--
-- Purpose:
--   1. Adds `idempotency_key` and unique index to `public.credit_transactions`
--      for strict double-submission protection on ledger transactions.
--   2. Introduces `public.record_customer_payment` RPC to atomically record
--      customer payments against their credit ledger:
--      - Validates authenticated store session.
--      - Validates customer store ownership.
--      - Acquires row-level lock (FOR UPDATE) on credit account to eliminate race conditions.
--      - Computes live authoritative balance (total charges - total payments).
--      - Strictly validates payment amount > 0 and amount <= outstanding balance.
--      - Inserts immutable payment transaction into `public.credit_transactions`.
--      - Updates credit account status ('settled' if balance reaches 0, else 'open').
--      - Returns structured result payload to client.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Evolve `public.credit_transactions` with Idempotency Key
-- ----------------------------------------------------------------------------

ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_store_idempotency
  ON public.credit_transactions (store_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Create Atomic `public.record_customer_payment` RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_customer_id uuid,
  p_amount numeric,
  p_notes text DEFAULT NULL,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid := auth.uid();
  v_customer public.customers%ROWTYPE;
  v_credit_account public.credit_accounts%ROWTYPE;
  v_existing_tx public.credit_transactions%ROWTYPE;
  v_payment_tx public.credit_transactions%ROWTYPE;

  v_payment_amount numeric(12, 2);
  v_total_charged numeric(12, 2) := 0.00;
  v_total_paid numeric(12, 2) := 0.00;
  v_current_balance numeric(12, 2) := 0.00;
  v_remaining_balance numeric(12, 2) := 0.00;
BEGIN
  -- 1. Security Check: Authenticated session required
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Your session has expired. Please log in again.'
      USING ERRCODE = '28000';
  END IF;

  -- 2. Validate Customer Parameter
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required.'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Validate Customer Store Ownership and Existence
  SELECT *
  INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id
    AND store_id = v_store_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or does not belong to your store.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 4. Idempotency Check & Advisory Lock
  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(v_store_id::text || ':credit_payment:' || p_idempotency_key::text));

    SELECT *
    INTO v_existing_tx
    FROM public.credit_transactions
    WHERE store_id = v_store_id
      AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      -- Calculate current authoritative balance for idempotent retry response
      SELECT
        COALESCE(sum(CASE WHEN transaction_type = 'charge' THEN amount ELSE 0 END), 0.00),
        COALESCE(sum(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END), 0.00)
      INTO v_total_charged, v_total_paid
      FROM public.credit_transactions
      WHERE credit_account_id = v_existing_tx.credit_account_id
        AND store_id = v_store_id;

      v_current_balance := round(v_total_charged - v_total_paid, 2);

      RETURN jsonb_build_object(
        'payment', to_jsonb(v_existing_tx),
        'customer_id', v_existing_tx.customer_id,
        'credit_account_id', v_existing_tx.credit_account_id,
        'amount', v_existing_tx.amount,
        'previous_balance', NULL,
        'remaining_balance', v_current_balance,
        'is_fully_paid', (v_current_balance <= 0),
        'is_retry', true
      );
    END IF;
  END IF;

  -- 5. Validate Payment Amount Parameter (> 0)
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.'
      USING ERRCODE = '22023';
  END IF;

  v_payment_amount := round(p_amount, 2);
  IF v_payment_amount <= 0.00 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.'
      USING ERRCODE = '22023';
  END IF;

  -- 6. Lock Credit Account Row (FOR UPDATE) to prevent concurrent payment race conditions
  SELECT *
  INTO v_credit_account
  FROM public.credit_accounts
  WHERE customer_id = v_customer.id
    AND store_id = v_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit account found for customer "%".' , v_customer.name
      USING ERRCODE = 'P0002';
  END IF;

  -- 7. Calculate Authoritative Outstanding Balance from Locked Ledger
  SELECT
    COALESCE(sum(CASE WHEN transaction_type = 'charge' THEN amount ELSE 0 END), 0.00),
    COALESCE(sum(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END), 0.00)
  INTO v_total_charged, v_total_paid
  FROM public.credit_transactions
  WHERE credit_account_id = v_credit_account.id
    AND store_id = v_store_id;

  v_current_balance := round(v_total_charged - v_total_paid, 2);

  -- 8. Financial Business Rules Validation
  IF v_current_balance <= 0 THEN
    RAISE EXCEPTION 'This customer has no outstanding balance to pay.'
      USING ERRCODE = '22023';
  END IF;

  IF v_payment_amount > v_current_balance THEN
    RAISE EXCEPTION 'Payment amount of ₱% exceeds customer''s outstanding balance of ₱%.' ,
      to_char(v_payment_amount, 'FM999,999,990.00'),
      to_char(v_current_balance, 'FM999,999,990.00')
      USING ERRCODE = '22023';
  END IF;

  -- 9. Insert Immutable Payment Ledger Entry
  INSERT INTO public.credit_transactions (
    store_id,
    credit_account_id,
    customer_id,
    sale_id,
    transaction_type,
    amount,
    notes,
    idempotency_key
  )
  VALUES (
    v_store_id,
    v_credit_account.id,
    v_customer.id,
    NULL,
    'payment',
    v_payment_amount,
    CASE
      WHEN p_notes IS NOT NULL AND btrim(p_notes) <> '' THEN btrim(p_notes)
      ELSE 'Customer payment'
    END,
    p_idempotency_key
  )
  RETURNING * INTO v_payment_tx;

  -- 10. Update Credit Account Status ('settled' if remaining balance = 0)
  v_remaining_balance := round(v_current_balance - v_payment_amount, 2);

  IF v_remaining_balance = 0 THEN
    UPDATE public.credit_accounts
    SET status = 'settled',
        updated_at = now()
    WHERE id = v_credit_account.id;
  ELSE
    UPDATE public.credit_accounts
    SET status = 'open',
        updated_at = now()
    WHERE id = v_credit_account.id;
  END IF;

  -- 11. Return Structured Result Payload
  RETURN jsonb_build_object(
    'payment', to_jsonb(v_payment_tx),
    'customer_id', v_customer.id,
    'credit_account_id', v_credit_account.id,
    'amount', v_payment_amount,
    'previous_balance', v_current_balance,
    'remaining_balance', v_remaining_balance,
    'is_fully_paid', (v_remaining_balance <= 0),
    'is_retry', false
  );
END;
$$;

-- Grant execution permission to authenticated store owners
GRANT EXECUTE ON FUNCTION public.record_customer_payment(uuid, numeric, text, uuid) TO authenticated;

