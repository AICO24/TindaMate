/**
 * TindaMate — Batch 4: Sales Feature Foundation Types
 *
 * Single source of truth for Sale domain entities, quantity validation,
 * and completed transaction results.
 */

import { Product } from '@/types/product';

/**
 * Normalized Sale domain entity returned to UI components.
 * Monetary values (`unit_price`, `total_amount`) are normalized to finite numbers
 * from PostgreSQL `numeric(12, 2)` columns.
 *
 * Note: `unit_price` and `product_name` are stored at the time of sale so
 * historical sales remain accurate even if the product's price or name changes later.
 */
export interface Sale {
  id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
}

/**
 * Validation result for the quantity sold input.
 */
export interface SaleQuantityValidation {
  isValid: boolean;
  quantity: number | null;
  error?: string;
}

/**
 * Result returned after a sale is atomically recorded and inventory stock deducted.
 */
export interface CompletedSaleResult {
  sale: Sale;
  updatedProduct: Product;
}

/**
 * Lightweight current-day sales summary for the authenticated store.
 */
export interface TodaySalesSummary {
  totalAmount: number;
  transactionCount: number;
}

/**
 * Section grouping of sales by human-readable date.
 */
export interface DateGroupedSales {
  dateTitle: string;
  data: Sale[];
}

