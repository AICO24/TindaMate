-- ============================================================================
-- TindaMate — Batch 9D: Product Cost Basis & COGS Aggregation Foundation Migration
-- File: supabase/migrations/20261031000001_batch9d_cogs_aggregation_foundation.sql
--
-- Purpose:
--   1. Creates store-scoped server function `public.get_store_cogs_summary`
--      to aggregate:
--      - Total Revenue (from authoritative sold line items / sales)
--      - Tracked COGS (Cost of Goods Sold = sum of quantity * cost_price
--        WHERE cost_price IS NOT NULL)
--      - Gross Profit = Revenue - Tracked COGS
--      - Line item counts (total, tracked, untracked)
--      - Untracked quantity
--      - Incomplete costs flag (has_incomplete_costs = true if any untracked item)
--   2. Enforces strict store scoping via auth.uid() and SECURITY INVOKER.
--   3. Treats missing historical cost (cost_price IS NULL) as UNTRACKED,
--      never converting to zero or fabricating historical cost from current products.
--   4. Preserves 100% monetary precision with PostgreSQL numeric(12, 2).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_store_cogs_summary(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid := auth.uid();

  -- Item-level aggregates from public.sale_items
  v_item_revenue numeric(12, 2) := 0.00;
  v_tracked_cogs numeric(12, 2) := 0.00;
  v_sale_item_count integer := 0;
  v_tracked_cost_item_count integer := 0;
  v_untracked_cost_item_count integer := 0;
  v_untracked_quantity integer := 0;

  -- Orphan legacy sales aggregates (sales rows lacking sale_items rows, if any)
  v_orphan_revenue numeric(12, 2) := 0.00;
  v_orphan_quantity integer := 0;
  v_orphan_sale_count integer := 0;

  -- Final combined figures
  v_total_revenue numeric(12, 2) := 0.00;
  v_total_cogs numeric(12, 2) := 0.00;
  v_gross_profit numeric(12, 2) := 0.00;
  v_total_item_count integer := 0;
  v_total_tracked_count integer := 0;
  v_total_untracked_count integer := 0;
  v_total_untracked_qty integer := 0;
  v_has_incomplete_costs boolean := false;
BEGIN
  -- 1. Security Check: Authenticated session required
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Your session has expired. Please log in again.'
      USING ERRCODE = '28000';
  END IF;

  -- 2. Aggregate from public.sale_items within store and optional date range
  SELECT
    coalesce(sum(si.subtotal), 0.00)::numeric(12, 2),
    coalesce(sum(round(si.quantity * si.cost_price, 2)) FILTER (WHERE si.cost_price IS NOT NULL), 0.00)::numeric(12, 2),
    coalesce(count(*), 0)::integer,
    coalesce(count(*) FILTER (WHERE si.cost_price IS NOT NULL), 0)::integer,
    coalesce(count(*) FILTER (WHERE si.cost_price IS NULL), 0)::integer,
    coalesce(sum(si.quantity) FILTER (WHERE si.cost_price IS NULL), 0)::integer
  INTO
    v_item_revenue,
    v_tracked_cogs,
    v_sale_item_count,
    v_tracked_cost_item_count,
    v_untracked_cost_item_count,
    v_untracked_quantity
  FROM public.sale_items si
  WHERE si.store_id = v_store_id
    AND (p_start_date IS NULL OR si.created_at >= p_start_date)
    AND (p_end_date IS NULL OR si.created_at <= p_end_date);

  -- 3. Safety check for any legacy sales lacking sale_items records
  SELECT
    coalesce(sum(s.total_amount), 0.00)::numeric(12, 2),
    coalesce(sum(s.quantity), 0)::integer,
    coalesce(count(*), 0)::integer
  INTO
    v_orphan_revenue,
    v_orphan_quantity,
    v_orphan_sale_count
  FROM public.sales s
  WHERE s.store_id = v_store_id
    AND (p_start_date IS NULL OR s.created_at >= p_start_date)
    AND (p_end_date IS NULL OR s.created_at <= p_end_date)
    AND NOT EXISTS (
      SELECT 1
      FROM public.sale_items si
      WHERE si.sale_id = s.id
    );

  -- 4. Calculate combined aggregates
  v_total_revenue := round(v_item_revenue + v_orphan_revenue, 2);
  v_total_cogs := round(v_tracked_cogs, 2);
  v_gross_profit := round(v_total_revenue - v_total_cogs, 2);
  v_total_item_count := v_sale_item_count + v_orphan_sale_count;
  v_total_tracked_count := v_tracked_cost_item_count;
  v_total_untracked_count := v_untracked_cost_item_count + v_orphan_sale_count;
  v_total_untracked_qty := v_untracked_quantity + v_orphan_quantity;
  v_has_incomplete_costs := (v_total_untracked_count > 0);

  -- 5. Return standardized JSON payload
  RETURN jsonb_build_object(
    'revenue', v_total_revenue,
    'cogs', v_total_cogs,
    'gross_profit', v_gross_profit,
    'sale_item_count', v_total_item_count,
    'tracked_cost_item_count', v_total_tracked_count,
    'untracked_cost_item_count', v_total_untracked_count,
    'untracked_quantity', v_total_untracked_qty,
    'has_incomplete_costs', v_has_incomplete_costs,
    'start_date', p_start_date,
    'end_date', p_end_date
  );
END;
$$;

-- Grant execution permission to authenticated store owners
GRANT EXECUTE ON FUNCTION public.get_store_cogs_summary(timestamptz, timestamptz) TO authenticated;

