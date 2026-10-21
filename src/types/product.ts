/**
 * TindaMate — Batch 3: Product & Inventory Foundation Types
 *
 * Single source of truth for Product domain types, stock status values,
 * form state, validation errors, and store summary metrics.
 */

export type ProductStockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

/**
 * Normalized Product domain entity returned to UI components.
 * Monetary values (`selling_price`, `cost_price`) are normalized to finite numbers
 * from PostgreSQL `numeric(12, 2)` columns.
 */
export interface Product {
  id: string;
  store_id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  selling_price: number;
  cost_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  status: ProductStockStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Controlled form input strings used by Add Product and Edit Product screens.
 */
export interface ProductFormValues {
  name: string;
  category: string;
  imageUrl: string;
  sellingPrice: string;
  costPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  unit: string;
}

/**
 * Field-level validation error messages for the Product form.
 */
export interface ProductFormErrors {
  name?: string;
  category?: string;
  imageUrl?: string;
  sellingPrice?: string;
  costPrice?: string;
  stockQuantity?: string;
  lowStockThreshold?: string;
  unit?: string;
}

/**
 * Validated, sanitized payload ready for Supabase INSERT or UPDATE.
 */
export interface ValidatedProductInput {
  name: string;
  category: string | null;
  image_url: string | null;
  selling_price: number;
  cost_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  status: ProductStockStatus;
}

/**
 * Aggregated store product summary used by the Dashboard and Products screen.
 */
export interface StoreProductSummary {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const DEFAULT_PRODUCT_UNIT = 'pcs';
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export const COMMON_PRODUCT_UNITS = [
  'pcs',
  'pack',
  'bottle',
  'can',
  'sachet',
  'kg',
  'box',
] as const;

