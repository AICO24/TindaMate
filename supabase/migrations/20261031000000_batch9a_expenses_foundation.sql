-- ============================================================================
-- TindaMate — Batch 9A: Expense Management Foundation Migration
-- File: supabase/migrations/20261031000000_batch9a_expenses_foundation.sql
--
-- Purpose:
--   Establishes the `public.expenses` table, data integrity constraints,
--   performance indexes, automatic sanitization & `updated_at` timestamp
--   trigger, and strict store-isolated Row Level Security (RLS) policies
--   for authenticated TindaMate store owners.
--
-- Store Ownership Convention:
--   Matches `public.products`, `public.sales`, and `public.customers`:
--   `store_id` references the authenticated store owner's `auth.users(id)`
--   (`DEFAULT auth.uid()`).
-- ============================================================================

-- 1. Create the `public.expenses` table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  amount numeric(12, 2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Data integrity constraints
  CONSTRAINT expenses_title_not_empty CHECK (char_length(btrim(title)) > 0),
  CONSTRAINT expenses_category_not_empty CHECK (char_length(btrim(category)) > 0),
  CONSTRAINT expenses_category_valid CHECK (
    category IN (
      'Utilities',
      'Rent',
      'Supplies',
      'Transportation',
      'Restocking-related Expense',
      'Maintenance',
      'Salaries',
      'Other'
    )
  ),
  CONSTRAINT expenses_amount_positive CHECK (amount > 0)
);

-- 2. Indexes for fast store-scoped queries, historical sorting, and category filtering
CREATE INDEX IF NOT EXISTS idx_expenses_store_id
  ON public.expenses (store_id);

CREATE INDEX IF NOT EXISTS idx_expenses_store_date_created
  ON public.expenses (store_id, expense_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_store_category
  ON public.expenses (store_id, category);

-- 3. Automatic text sanitization and `updated_at` timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_expenses_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Trim text fields cleanly
  NEW.title := btrim(NEW.title);
  NEW.category := COALESCE(NULLIF(btrim(NEW.category), ''), 'Other');

  IF NEW.notes IS NOT NULL THEN
    NEW.notes := NULLIF(btrim(NEW.notes), '');
  END IF;

  -- Round amount to 2 decimal places
  IF NEW.amount IS NOT NULL THEN
    NEW.amount := round(NEW.amount, 2);
  END IF;

  -- Maintain timestamps
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
  END IF;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expenses_before_write ON public.expenses;

CREATE TRIGGER trg_expenses_before_write
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expenses_before_write();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — Strict per-store isolation (`auth.uid() = store_id`)
--    Authenticated users can only view, insert, update, and delete expenses
--    belonging to their own authorized store (`auth.uid()`).

DROP POLICY IF EXISTS "Store owners can view their own expenses" ON public.expenses;
CREATE POLICY "Store owners can view their own expenses"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can insert their own expenses" ON public.expenses;
CREATE POLICY "Store owners can insert their own expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can update their own expenses" ON public.expenses;
CREATE POLICY "Store owners can update their own expenses"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

DROP POLICY IF EXISTS "Store owners can delete their own expenses" ON public.expenses;
CREATE POLICY "Store owners can delete their own expenses"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = store_id);

-- 6. Grant table permissions to authenticated store owners
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;

