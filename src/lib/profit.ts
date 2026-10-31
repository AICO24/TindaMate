/**
 * TindaMate — Batch 9D: Product Cost Basis & COGS Aggregation Service
 *
 * Provides store-scoped COGS, Gross Profit, and cost completeness metrics.
 *
 * Accounting Rules:
 * - Gross Revenue = Sum of authoritative sale-item subtotals
 * - Tracked COGS = Sum of (quantity * cost_price) ONLY where cost_price IS NOT NULL
 * - Untracked Cost = Items where cost_price IS NULL (never converted to 0, never fabricated from current product cost)
 * - Gross Profit = Revenue - Tracked COGS
 * - Incomplete Flag = Set to true whenever untracked items exist
 */

import { getAuthenticatedStoreId } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { COGSFilterParams, COGSSummary } from '@/types/profit';
import { SaleItem } from '@/types/sale';

/**
 * Normalizes any date input into a clean ISO 8601 string or null.
 */
function toISOOrNull(dateVal?: string | Date | null): string | null {
  if (!dateVal) {
    return null;
  }
  if (dateVal instanceof Date) {
    return Number.isNaN(dateVal.getTime()) ? null : dateVal.toISOString();
  }
  const parsed = new Date(dateVal);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Maps Supabase / PostgREST errors to clear, vendor-friendly messages.
 */
export function mapProfitDatabaseError(
  error: unknown,
  fallbackMessage: string
): string {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const errObj = error as { code?: string; message?: string; details?: string };
  const code = errObj.code ?? '';
  const message = (errObj.message ?? '').toLowerCase();

  if (
    code === 'PGRST202' ||
    message.includes('could not find the function') ||
    message.includes('get_store_cogs_summary')
  ) {
    return 'The COGS aggregation function is not yet installed in Supabase. Please execute migration 20261031000001_batch9d_cogs_aggregation_foundation.sql in your Supabase SQL Editor.';
  }

  if (
    code === '42501' ||
    message.includes('violates row-level security policy') ||
    message.includes('row-level security')
  ) {
    return 'You do not have permission to view sales profit data for this store.';
  }

  if (
    code === '28000' ||
    message.includes('jwt') ||
    message.includes('session has expired') ||
    message.includes('not authenticated')
  ) {
    return 'Your store session has expired. Please log in again to continue.';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to connect') ||
    message.includes('timeout')
  ) {
    return 'Unable to reach your store database. Please check your internet connection and try again.';
  }

  return errObj.message || fallbackMessage;
}

/**
 * Normalizes raw RPC or object payload into a strict COGSSummary entity.
 */
export function normalizeCOGSSummaryRow(
  raw: Record<string, unknown>
): COGSSummary {
  const parseAmount = (val: unknown): number => {
    const num = Number(val);
    return Number.isFinite(num) ? Number(num.toFixed(2)) : 0.0;
  };

  const parseCount = (val: unknown): number => {
    const num = Number(val);
    return Number.isSafeInteger(num) && num > 0 ? num : 0;
  };

  const revenue = parseAmount(raw.revenue);
  const cogs = parseAmount(raw.cogs);
  const grossProfit = parseAmount(raw.gross_profit ?? revenue - cogs);

  const saleItemCount = parseCount(raw.sale_item_count);
  const trackedCostItemCount = parseCount(raw.tracked_cost_item_count);
  const untrackedCostItemCount = parseCount(raw.untracked_cost_item_count);
  const untrackedQuantity = parseCount(raw.untracked_quantity);

  const hasIncompleteCosts =
    typeof raw.has_incomplete_costs === 'boolean'
      ? raw.has_incomplete_costs
      : untrackedCostItemCount > 0;

  const startDate =
    typeof raw.start_date === 'string' ? raw.start_date : null;
  const endDate = typeof raw.end_date === 'string' ? raw.end_date : null;

  return {
    revenue,
    cogs,
    grossProfit,
    saleItemCount,
    trackedCostItemCount,
    untrackedCostItemCount,
    untrackedQuantity,
    hasIncompleteCosts,
    startDate,
    endDate,
  };
}

/**
 * Calculates line-item Cost of Goods Sold:
 * Returns (quantity * cost_price) if cost is known; otherwise returns null (untracked).
 * Never coerces untracked cost into 0.
 */
export function calculateItemCOGS(
  quantity: number,
  costPrice: number | null | undefined
): number | null {
  if (
    costPrice === null ||
    costPrice === undefined ||
    !Number.isFinite(costPrice) ||
    costPrice < 0
  ) {
    return null;
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    return 0.0;
  }
  const totalCostCentavos = Math.round(costPrice * 100) * quantity;
  return Number((totalCostCentavos / 100).toFixed(2));
}

/**
 * Pure client-side derivation of COGSSummary from an array of SaleItems.
 * Uses integer-centavo arithmetic for exact monetary precision.
 */
export function computeCOGSSummaryFromItems(
  items: SaleItem[],
  startDate?: string | null,
  endDate?: string | null
): COGSSummary {
  let revenueCentavos = 0;
  let cogsCentavos = 0;
  let trackedCount = 0;
  let untrackedCount = 0;
  let untrackedQuantity = 0;

  for (const item of items) {
    // Authoritative revenue from line subtotal
    const subtotalCentavos = Math.round((item.subtotal ?? 0) * 100);
    revenueCentavos += subtotalCentavos;

    const lineCost = calculateItemCOGS(item.quantity, item.cost_price);
    if (lineCost !== null) {
      trackedCount += 1;
      cogsCentavos += Math.round(lineCost * 100);
    } else {
      untrackedCount += 1;
      untrackedQuantity += item.quantity > 0 ? item.quantity : 0;
    }
  }

  const revenue = Number((revenueCentavos / 100).toFixed(2));
  const cogs = Number((cogsCentavos / 100).toFixed(2));
  const grossProfit = Number(((revenueCentavos - cogsCentavos) / 100).toFixed(2));

  return {
    revenue,
    cogs,
    grossProfit,
    saleItemCount: items.length,
    trackedCostItemCount: trackedCount,
    untrackedCostItemCount: untrackedCount,
    untrackedQuantity,
    hasIncompleteCosts: untrackedCount > 0,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
  };
}

/**
 * Fetches the COGS summary for the authenticated store within an optional date range:
 * 1. Verifies the authenticated user/store session.
 * 2. Invokes store-scoped RPC `public.get_store_cogs_summary`.
 * 3. Returns normalized COGSSummary with centavo-accurate values.
 */
export async function fetchStoreCOGSSummary(
  params: COGSFilterParams = {}
): Promise<COGSSummary> {
  // Ensure store authentication
  await getAuthenticatedStoreId();

  const startDateISO = toISOOrNull(params.startDate);
  const endDateISO = toISOOrNull(params.endDate);

  const { data, error } = await supabase.rpc('get_store_cogs_summary', {
    p_start_date: startDateISO,
    p_end_date: endDateISO,
  });

  if (error) {
    throw new Error(
      mapProfitDatabaseError(
        error,
        'Could not calculate COGS and profit summary for your store.'
      )
    );
  }

  if (!data || typeof data !== 'object') {
    return {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      saleItemCount: 0,
      trackedCostItemCount: 0,
      untrackedCostItemCount: 0,
      untrackedQuantity: 0,
      hasIncompleteCosts: false,
      startDate: startDateISO,
      endDate: endDateISO,
    };
  }

  return normalizeCOGSSummaryRow(data as Record<string, unknown>);
}

