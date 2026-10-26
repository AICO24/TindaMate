-- ============================================================================
-- TindaMate — Batch 8A: Customer + Credit Database Foundation
-- File: supabase/migrations/20261026000001_batch8a_customer_credit_foundation.sql
--
-- Purpose:
--   Establishes the foundational schema for customer management and customer
--   credit (utang) ledger tracking in TindaMate:
--     1. `public.customers`: Store-scoped customer profiles (name, phone, notes, active state).
--     2. `public.credit_accounts`: 1-to-1 credit account per customer per store with status tracking.
--     3. `public.credit_transactions`: Immutable financial transaction ledger (charge, payment).
--     4. `public.customer_credit_summaries`: Derivable credit balance view with security invoker.
--     5. Strict store-isolation Row Level Security (RLS) policies scoped to `auth.uid() = store_id`.
--     6. Data integrity constraints & partial unique index preventing duplicate sale charges.
--
-- Store Ownership Convention:
--   Matches `public.products` and `public.sales`:
--   `store_id` references the authenticated store owner's `auth.users(id)` (`DEFAULT auth.uid()`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper trigger function: automatic `updated_at` timestamp management
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Create `public.customers` table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT customers_name_not_empty CHECK (char_length(btrim(name)) > 0)
);

-- Indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_store_id
  ON public.customers (store_id);

CREATE INDEX IF NOT EXISTS idx_customers_store_id_is_active
  ON public.customers (store_id, is_active);

CREATE INDEX IF NOT EXISTS idx_customers_store_id_name
  ON public.customers (store_id, name);

-- Automatic `updated_at` trigger for customers
DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_set_updated_at();

-- Enable Row Level Security (RLS) on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customer RLS Policies — Strict store isolation (`auth.uid() = store_id`)
DROP POLICY IF EXISTS "Store owners can view their own customers" ON public.customers;
CREATE POLICY "Store owners can view their own customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can insert their own customers" ON public.customers;
CREATE POLICY "Store owners can insert their own customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can update their own customers" ON public.customers;
CREATE POLICY "Store owners can update their own customers"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- ----------------------------------------------------------------------------
-- 3. Create `public.credit_accounts` table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.credit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT credit_accounts_status_valid CHECK (status IN ('open', 'settled')),
  CONSTRAINT uq_credit_accounts_customer UNIQUE (customer_id),
  CONSTRAINT uq_credit_accounts_store_customer UNIQUE (store_id, customer_id)
);

-- Indexes for credit_accounts
CREATE INDEX IF NOT EXISTS idx_credit_accounts_store_id
  ON public.credit_accounts (store_id);

CREATE INDEX IF NOT EXISTS idx_credit_accounts_customer_id
  ON public.credit_accounts (customer_id);

CREATE INDEX IF NOT EXISTS idx_credit_accounts_store_status
  ON public.credit_accounts (store_id, status);

-- Automatic `updated_at` trigger for credit_accounts
DROP TRIGGER IF EXISTS trg_credit_accounts_updated_at ON public.credit_accounts;
CREATE TRIGGER trg_credit_accounts_updated_at
  BEFORE UPDATE ON public.credit_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_set_updated_at();

-- Enable Row Level Security (RLS) on credit_accounts
ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;

-- Credit Accounts RLS Policies — Strict store isolation (`auth.uid() = store_id`)
DROP POLICY IF EXISTS "Store owners can view their own credit accounts" ON public.credit_accounts;
CREATE POLICY "Store owners can view their own credit accounts"
  ON public.credit_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can insert their own credit accounts" ON public.credit_accounts;
CREATE POLICY "Store owners can insert their own credit accounts"
  ON public.credit_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = store_id
    AND EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id
        AND c.store_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Store owners can update their own credit accounts" ON public.credit_accounts;
CREATE POLICY "Store owners can update their own credit accounts"
  ON public.credit_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

-- ----------------------------------------------------------------------------
-- 4. Create `public.credit_transactions` table (Immutable Ledger)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_account_id uuid NOT NULL REFERENCES public.credit_accounts(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  sale_id uuid REFERENCES public.sales(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT credit_transactions_transaction_type_valid CHECK (transaction_type IN ('charge', 'payment')),
  CONSTRAINT credit_transactions_amount_positive CHECK (amount > 0)
);

-- Indexes for credit_transactions access patterns
CREATE INDEX IF NOT EXISTS idx_credit_transactions_store_id
  ON public.credit_transactions (store_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_credit_account_id
  ON public.credit_transactions (credit_account_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer_id
  ON public.credit_transactions (customer_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_sale_id
  ON public.credit_transactions (sale_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_store_created_at
  ON public.credit_transactions (store_id, created_at DESC);

-- Prevent duplicate credit charge transactions for the same sale
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_sale_charge_unique
  ON public.credit_transactions (sale_id)
  WHERE sale_id IS NOT NULL AND transaction_type = 'charge';

-- Enable Row Level Security (RLS) on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Credit Transactions RLS Policies — Strict store isolation (`auth.uid() = store_id`)
-- Ledger entries are append-only (SELECT & INSERT allowed; UPDATE & DELETE disallowed)
DROP POLICY IF EXISTS "Store owners can view their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Store owners can view their own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can insert their own credit transactions" ON public.credit_transactions;
CREATE POLICY "Store owners can insert their own credit transactions"
  ON public.credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = store_id
    AND EXISTS (
      SELECT 1 FROM public.credit_accounts ca
      WHERE ca.id = credit_account_id
        AND ca.store_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = customer_id
        AND c.store_id = auth.uid()
    )
    AND (
      sale_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.sales s
        WHERE s.id = sale_id
          AND s.store_id = auth.uid()
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 5. Derivable Customer Credit Balance View (`public.customer_credit_summaries`)
-- ----------------------------------------------------------------------------
-- Computes authoritative balance: SUM(charges) - SUM(payments) per credit account.
-- Uses `WITH (security_invoker = true)` to inherit Row Level Security policies
-- from underlying tables so cross-store leaks are impossible.

CREATE OR REPLACE VIEW public.customer_credit_summaries
WITH (security_invoker = true)
AS
SELECT
  ca.id AS credit_account_id,
  ca.store_id,
  ca.customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone,
  c.is_active AS customer_is_active,
  ca.status AS account_status,
  COALESCE(
    sum(CASE WHEN ct.transaction_type = 'charge' THEN ct.amount ELSE 0 END),
    0.00
  )::numeric(12, 2) AS total_charged,
  COALESCE(
    sum(CASE WHEN ct.transaction_type = 'payment' THEN ct.amount ELSE 0 END),
    0.00
  )::numeric(12, 2) AS total_paid,
  COALESCE(
    sum(
      CASE
        WHEN ct.transaction_type = 'charge' THEN ct.amount
        WHEN ct.transaction_type = 'payment' THEN -ct.amount
        ELSE 0
      END
    ),
    0.00
  )::numeric(12, 2) AS current_balance,
  max(ct.created_at) AS last_transaction_at
FROM public.credit_accounts ca
JOIN public.customers c
  ON c.id = ca.customer_id
  AND c.store_id = ca.store_id
LEFT JOIN public.credit_transactions ct
  ON ct.credit_account_id = ca.id
  AND ct.store_id = ca.store_id
GROUP BY ca.id, ca.store_id, ca.customer_id, c.name, c.phone, c.is_active, ca.status;

-- Grant permissions for authenticated store users
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.credit_accounts TO authenticated;
GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT SELECT ON public.customer_credit_summaries TO authenticated;

