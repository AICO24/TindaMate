/**
 * TindaMate — Batch 9D: Product Cost Basis & COGS Aggregation Foundation Types
 *
 * Single source of truth for Cost of Goods Sold (COGS), Gross Profit,
 * and cost tracking completeness domain types.
 */

/**
 * Aggregated COGS and Gross Profit summary returned by the data/service layer.
 *
 * Monetary amounts (`revenue`, `cogs`, `grossProfit`) are normalized
 * to finite 2-decimal numbers from PostgreSQL `numeric(12, 2)`.
 *
 * Cost Status Model:
 * - Tracked: `sale_items.cost_price IS NOT NULL`
 * - Untracked: `sale_items.cost_price IS NULL`
 *
 * Incomplete Cost Safety Rule:
 * When `hasIncompleteCosts` is true, one or more sold items had no recorded
 * purchase cost at time of sale. In this state, COGS reflects only tracked items,
 * and Gross Profit must be presented as an estimate rather than exact.
 */
export interface COGSSummary {
  /** Total sales revenue (in Philippine Pesos ₱) across sold items */
  revenue: number;
  /** Total Cost of Goods Sold (₱) for items with known historical cost */
  cogs: number;
  /** Gross Profit = Revenue - Tracked COGS */
  grossProfit: number;
  /** Total number of sold line items in the aggregation scope */
  saleItemCount: number;
  /** Count of sold line items that have a recorded historical cost price */
  trackedCostItemCount: number;
  /** Count of sold line items that have NO recorded historical cost price */
  untrackedCostItemCount: number;
  /** Total physical quantity of products sold without a known cost price */
  untrackedQuantity: number;
  /** True if untrackedCostItemCount > 0, indicating COGS/profit is partial/estimated */
  hasIncompleteCosts: boolean;
  /** Filter start timestamp (ISO string or null if unbounded) */
  startDate: string | null;
  /** Filter end timestamp (ISO string or null if unbounded) */
  endDate: string | null;
}

/**
 * Filter parameters for querying store COGS summaries.
 */
export interface COGSFilterParams {
  /** Optional start range (ISO string or Date) */
  startDate?: string | Date | null;
  /** Optional end range (ISO string or Date) */
  endDate?: string | Date | null;
}

