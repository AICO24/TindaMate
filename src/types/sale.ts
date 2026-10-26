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
export type SalePaymentMethod = 'cash' | 'credit';

export interface Sale {
  id: string;
  store_id: string;
  product_id?: string | null;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
  item_count?: number;
  idempotency_key?: string | null;
  payment_method?: SalePaymentMethod;
  customer_id?: string | null;
  customer_name?: string | null;
}

/**
 * In-memory client cart item used on the Sales screen.
 * Contains product details and client-side quantity for POS cart calculations.
 */
export interface CartItem {
  productId: string;
  productName: string;
  category: string | null;
  imageUrl: string | null;
  unit: string;
  sellingPrice: number;
  costPrice: number | null;
  quantity: number;
  availableStock: number;
  lowStockThreshold: number;
  subtotal: number;
}

/**
 * Summary metrics derived from the active client cart.
 */
export interface CartSummary {
  totalItems: number; // Total units across all cart items (e.g. 2 Cokes + 1 Bread = 3 items)
  distinctCount: number; // Count of unique product lines in the cart
  totalAmount: number; // Pre-checkout estimated total in Philippine Pesos (₱)
}

/**
 * Normalized SaleItem domain entity returned to UI components.
 * Represents an individual product line item inside a sales transaction header.
 */
export interface SaleItem {
  id: string;
  sale_id: string;
  store_id: string;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  cost_price: number | null;
  subtotal: number;
  created_at: string;
}

/**
 * Input payload for multi-item cart sale RPC.
 */
export interface CartSaleItemInput {
  product_id: string;
  quantity: number;
}

/**
 * Result returned after a multi-item cart sale is atomically recorded.
 */
export interface CompletedCartSaleResult {
  sale: Sale;
  items: SaleItem[];
  updatedProducts: Product[];
  creditTransaction?: Record<string, unknown> | null;
  isRetry: boolean;
}

/**
 * Detailed historical transaction payload returned by `fetchStoreSaleById`.
 * Pairs the transaction header with its individual itemized line items.
 */
export interface SaleTransactionDetails {
  sale: Sale;
  items: SaleItem[];
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
 * Payment validation status for POS checkout.
 */
export type PaymentStatus =
  | 'empty'
  | 'invalid'
  | 'insufficient'
  | 'exact'
  | 'overpaid';

/**
 * Result of validating customer payment against cart total amount.
 * Calculations are performed in integer centavos to ensure currency safety.
 */
export interface PaymentValidationResult {
  status: PaymentStatus;
  isValid: boolean;
  amountTendered: number | null;
  change: number;
  amountNeeded: number;
  errorMessage?: string;
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
 * Dashboard sales data payload for the authenticated store.
 */
export interface DashboardSalesData {
  todaySummary: TodaySalesSummary;
  recentSales: Sale[];
}

/**
 * Section grouping of sales by human-readable date.
 */
export interface DateGroupedSales {
  dateTitle: string;
  data: Sale[];
}

