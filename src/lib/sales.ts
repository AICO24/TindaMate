import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_PRODUCT_UNIT,
  Product,
} from '@/types/product';
import {
  CompletedSaleResult,
  DateGroupedSales,
  Sale,
  SaleQuantityValidation,
  TodaySalesSummary,
} from '@/types/sale';
import {
  fetchStoreProductById,
  getAuthenticatedStoreId,
  getProductStockStatus,
} from '@/lib/products';
import { supabase } from '@/lib/supabase';

/**
 * Calculates the automatic sale total using integer centavos to avoid
 * IEEE-754 floating-point precision issues with Philippine Peso amounts.
 *
 * Formula: Total = Selling Price × Quantity
 */
export function calculateSaleTotal(unitPrice: number, quantity: number): number {
  if (
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(quantity) ||
    unitPrice < 0 ||
    quantity <= 0
  ) {
    return 0;
  }

  const safeQuantity = Math.trunc(quantity);
  if (safeQuantity <= 0) {
    return 0;
  }

  const unitPriceCentavos = Math.round(unitPrice * 100);
  const totalCentavos = unitPriceCentavos * safeQuantity;

  return Number((totalCentavos / 100).toFixed(2));
}

/**
 * Filters store products to only those that can legitimately be sold
 * according to TindaMate inventory rules (available stock > 0 and valid selling price).
 */
export function filterSellableProducts(products: Product[]): Product[] {
  return products.filter(
    (product) =>
      Number.isFinite(product.stock_quantity) &&
      product.stock_quantity > 0 &&
      Number.isFinite(product.selling_price) &&
      product.selling_price >= 0
  );
}

/**
 * Validates the raw quantity string entered by the user without silently
 * coercing invalid input.
 *
 * Requirements enforced:
 * - Quantity must not be empty
 * - Quantity must be a valid whole number (no letters, decimals, or symbols)
 * - Quantity must be greater than 0
 * - Quantity must not exceed currently available stock
 */
export function validateSaleQuantity(
  rawQuantity: string,
  availableStock: number,
  unit: string = DEFAULT_PRODUCT_UNIT
): SaleQuantityValidation {
  const safeStock = Number.isFinite(availableStock)
    ? Math.max(0, Math.trunc(availableStock))
    : 0;
  const displayUnit = unit.trim() || DEFAULT_PRODUCT_UNIT;

  if (safeStock <= 0) {
    return {
      isValid: false,
      quantity: null,
      error: 'Not enough stock available. This product is out of stock.',
    };
  }

  const trimmed = rawQuantity.trim();
  if (!trimmed) {
    return {
      isValid: false,
      quantity: null,
      error: 'Enter the quantity to sell.',
    };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return {
      isValid: false,
      quantity: null,
      error: 'Enter a valid whole number quantity (for example, 1, 2, or 5).',
    };
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    return {
      isValid: false,
      quantity: null,
      error: 'Enter a valid whole number quantity.',
    };
  }

  if (parsed <= 0) {
    return {
      isValid: false,
      quantity: null,
      error: 'Quantity must be greater than 0.',
    };
  }

  if (parsed > safeStock) {
    return {
      isValid: false,
      quantity: null,
      error: `Not enough stock available. Only ${safeStock} ${displayUnit} available.`,
    };
  }

  return {
    isValid: true,
    quantity: parsed,
  };
}

/**
 * Normalizes a raw Supabase `sales` row into a strongly-typed `Sale` entity.
 */
function normalizeSaleRow(row: Record<string, unknown>): Sale {
  const quantityRaw = Number(row.quantity ?? 0);
  const quantity = Number.isFinite(quantityRaw)
    ? Math.max(0, Math.trunc(quantityRaw))
    : 0;

  const unitPriceRaw = Number(row.unit_price ?? 0);
  const unitPrice = Number.isFinite(unitPriceRaw)
    ? Number(unitPriceRaw.toFixed(2))
    : 0;

  const totalAmountRaw = Number(row.total_amount ?? 0);
  const totalAmount = Number.isFinite(totalAmountRaw)
    ? Number(totalAmountRaw.toFixed(2))
    : calculateSaleTotal(unitPrice, quantity);

  const unitRaw = typeof row.unit === 'string' ? row.unit.trim() : '';

  return {
    id: String(row.id ?? ''),
    store_id: String(row.store_id ?? ''),
    product_id: String(row.product_id ?? ''),
    product_name:
      typeof row.product_name === 'string' && row.product_name.trim().length > 0
        ? row.product_name.trim()
        : 'Store Product',
    unit: unitRaw.length > 0 ? unitRaw : DEFAULT_PRODUCT_UNIT,
    quantity,
    unit_price: unitPrice,
    total_amount: totalAmount,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

/**
 * Normalizes a raw product JSON object returned from the RPC or table query.
 */
function normalizeUpdatedProductRow(row: Record<string, unknown>): Product {
  const sellingPriceRaw = Number(row.selling_price ?? 0);
  const sellingPrice = Number.isFinite(sellingPriceRaw) ? sellingPriceRaw : 0;

  const costPriceRaw =
    row.cost_price === null ||
    row.cost_price === undefined ||
    row.cost_price === ''
      ? null
      : Number(row.cost_price);
  const costPrice =
    costPriceRaw !== null && Number.isFinite(costPriceRaw) ? costPriceRaw : null;

  const stockQuantityRaw = Number(row.stock_quantity ?? 0);
  const stockQuantity = Number.isFinite(stockQuantityRaw)
    ? Math.max(0, Math.trunc(stockQuantityRaw))
    : 0;

  const thresholdRaw = Number(
    row.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
  );
  const lowStockThreshold = Number.isFinite(thresholdRaw)
    ? Math.max(0, Math.trunc(thresholdRaw))
    : DEFAULT_LOW_STOCK_THRESHOLD;

  const unitRaw = typeof row.unit === 'string' ? row.unit.trim() : '';
  const unit = unitRaw.length > 0 ? unitRaw : DEFAULT_PRODUCT_UNIT;

  const categoryRaw =
    typeof row.category === 'string' ? row.category.trim() : '';
  const imageUrlRaw =
    typeof row.image_url === 'string' ? row.image_url.trim() : '';

  return {
    id: String(row.id ?? ''),
    store_id: String(row.store_id ?? ''),
    name: typeof row.name === 'string' ? row.name.trim() : '',
    category: categoryRaw.length > 0 ? categoryRaw : null,
    image_url: imageUrlRaw.length > 0 ? imageUrlRaw : null,
    selling_price: sellingPrice,
    cost_price: costPrice,
    stock_quantity: stockQuantity,
    low_stock_threshold: lowStockThreshold,
    unit,
    status: getProductStockStatus(stockQuantity, lowStockThreshold),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

/**
 * Maps Supabase / PostgreSQL errors to clear, store-owner-friendly messages
 * without exposing raw SQL internals. Logs technical details in development.
 */
export function mapSaleDatabaseError(error: unknown, fallback: string): string {
  if (__DEV__ && error) {
    console.warn('[Sales Database Error]:', error);
  }

  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const code = maybeError.code ?? '';
  const rawMessage = maybeError.message ?? '';
  const message = rawMessage.toLowerCase();

  if (
    code === 'PGRST205' ||
    message.includes("could not find the table 'public.sales'")
  ) {
    return 'Sales table is not yet set up in Supabase. Please run the Batch 4 Sales migration SQL in your Supabase SQL Editor and retry.';
  }

  if (code === 'P0001' || message.includes('not enough stock')) {
    return 'Not enough stock available.';
  }

  if (
    code === 'P0002' ||
    message.includes('product not found') ||
    message.includes('does not belong to your store')
  ) {
    return 'This product could not be found or no longer belongs to your store.';
  }

  if (code === '42501' || message.includes('row-level security')) {
    return 'You do not have permission to record a sale for this store.';
  }

  if (
    code === '28000' ||
    message.includes('session has expired') ||
    message.includes('jwt')
  ) {
    return 'Your session has expired. Please log in again.';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('failed to fetch')
  ) {
    return 'Unable to connect to TindaMate servers. Check your internet connection and try again.';
  }

  if (code === '23514' || message.includes('check constraint')) {
    if (message.includes('stock_quantity')) {
      return 'Not enough stock available.';
    }
    return 'Invalid sale details. Please check the quantity and try again.';
  }

  return fallback;
}

/**
 * Fallback consistency-guarded sale processor used only if the atomic
 * `public.record_product_sale` RPC has not yet been installed in Supabase.
 *
 * Ensures:
 * - Sale is NEVER created without deducting stock.
 * - Stock is NEVER left deducted if creating the sale fails (compensating rollback).
 */
async function recordProductSaleWithGuardedFallback(
  storeId: string,
  latestProduct: Product,
  quantity: number
): Promise<CompletedSaleResult> {
  const unitPrice = Number(latestProduct.selling_price.toFixed(2));
  const totalAmount = calculateSaleTotal(unitPrice, quantity);
  const nextStockQuantity = latestProduct.stock_quantity - quantity;

  if (nextStockQuantity < 0) {
    throw new Error('Not enough stock available.');
  }

  const nextStatus = getProductStockStatus(
    nextStockQuantity,
    latestProduct.low_stock_threshold
  );

  // Pre-verify that `public.sales` is reachable before touching product inventory
  const { error: salesTableCheckError } = await supabase
    .from('sales')
    .select('id')
    .eq('store_id', storeId)
    .limit(1);

  if (salesTableCheckError) {
    throw new Error(
      mapSaleDatabaseError(
        salesTableCheckError,
        'Could not access the sales table. Product stock was not deducted.'
      )
    );
  }

  // Step 1: Deduct stock with an exact optimistic-concurrency match on `stock_quantity`
  // (`.eq('stock_quantity', latestProduct.stock_quantity)`) to prevent concurrent over-selling.
  const { data: updatedProductData, error: stockError } = await supabase
    .from('products')
    .update({
      stock_quantity: nextStockQuantity,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', latestProduct.id)
    .eq('store_id', storeId)
    .eq('stock_quantity', latestProduct.stock_quantity)
    .select(
      'id, store_id, name, category, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, unit, status, created_at, updated_at'
    )
    .maybeSingle();

  if (stockError) {
    throw new Error(
      mapSaleDatabaseError(
        stockError,
        'Could not update product inventory. The sale was not recorded.'
      )
    );
  }

  if (!updatedProductData) {
    // Stock changed concurrently between review and confirmation
    const refreshed = await fetchStoreProductById(latestProduct.id);
    if (!refreshed) {
      throw new Error(
        'This product could not be found or no longer belongs to your store.'
      );
    }
    if (refreshed.stock_quantity < quantity) {
      throw new Error('Not enough stock available.');
    }
    throw new Error(
      'Product stock was just updated. Please review the current stock and try again.'
    );
  }

  // Step 2: Insert the sale record into `public.sales`
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert({
      store_id: storeId,
      product_id: latestProduct.id,
      product_name: latestProduct.name,
      unit: latestProduct.unit,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
    })
    .select(
      'id, store_id, product_id, product_name, unit, quantity, unit_price, total_amount, created_at'
    )
    .single();

  if (saleError || !saleData) {
    // Compensating rollback: restore the deducted stock immediately so stock is NEVER
    // deducted when saving the sale fails.
    const restoredStatus = getProductStockStatus(
      latestProduct.stock_quantity,
      latestProduct.low_stock_threshold
    );
    await supabase
      .from('products')
      .update({
        stock_quantity: latestProduct.stock_quantity,
        status: restoredStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', latestProduct.id)
      .eq('store_id', storeId);

    throw new Error(
      mapSaleDatabaseError(
        saleError,
        'Could not save the sale transaction. Product stock was not deducted.'
      )
    );
  }

  return {
    sale: normalizeSaleRow(saleData as Record<string, unknown>),
    updatedProduct: normalizeUpdatedProductRow(
      updatedProductData as Record<string, unknown>
    ),
  };
}

/**
 * Confirms and records a completed product sale:
 * 1. Validates quantity > 0
 * 2. Verifies authenticated user/store session
 * 3. Re-fetches the product from Supabase to validate it still exists and belongs to the store
 * 4. Re-checks current stock to ensure sufficient stock remains
 * 5. Atomically creates the sale record (with historical `unit_price`) and deducts stock
 *    via `public.record_product_sale` (with safe rollback fallback if RPC is absent)
 */
export async function recordProductSale(
  productId: string,
  quantity: number
): Promise<CompletedSaleResult> {
  if (!productId || !productId.trim()) {
    throw new Error('Please select a valid product to sell.');
  }

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a whole number greater than 0.');
  }

  const storeId = await getAuthenticatedStoreId();

  // Re-fetch product right before confirmation to verify existence, ownership, and live stock
  const latestProduct = await fetchStoreProductById(productId);
  if (!latestProduct) {
    throw new Error(
      'This product could not be found or no longer belongs to your store.'
    );
  }

  if (latestProduct.store_id !== storeId) {
    throw new Error(
      'You do not have permission to record a sale for this product.'
    );
  }

  if (latestProduct.stock_quantity < quantity) {
    throw new Error('Not enough stock available.');
  }

  // Primary path: Atomic PostgreSQL RPC transaction (`public.record_product_sale`)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'record_product_sale',
    {
      p_product_id: latestProduct.id,
      p_quantity: quantity,
    }
  );

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    const payload = rpcData as {
      sale?: Record<string, unknown>;
      product?: Record<string, unknown>;
    };

    if (payload.sale && payload.product) {
      return {
        sale: normalizeSaleRow(payload.sale),
        updatedProduct: normalizeUpdatedProductRow(payload.product),
      };
    }
  }

  if (rpcError) {
    const rpcCode = rpcError.code ?? '';
    const rpcMsg = (rpcError.message ?? '').toLowerCase();

    // If the RPC function itself isn't in the schema cache (e.g. only table was created),
    // use the consistency-guarded fallback.
    if (
      rpcCode === 'PGRST202' ||
      rpcMsg.includes('could not find the function')
    ) {
      return recordProductSaleWithGuardedFallback(
        storeId,
        latestProduct,
        quantity
      );
    }

    throw new Error(
      mapSaleDatabaseError(
        rpcError,
        'Could not complete the sale. Please try again.'
      )
    );
  }

  throw new Error('Could not complete the sale. Please try again.');
}

/**
 * Fetches recorded sales for the authenticated user's store, newest first.
 * Established as part of the Sales Foundation for upcoming Sales History & Summary features.
 */
export async function fetchStoreSales(): Promise<Sale[]> {
  const storeId = await getAuthenticatedStoreId();

  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, store_id, product_id, product_name, unit, quantity, unit_price, total_amount, created_at'
    )
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      mapSaleDatabaseError(
        error,
        'Could not load your store sales. Please try again.'
      )
    );
  }

  return (data ?? []).map((row) =>
    normalizeSaleRow(row as Record<string, unknown>)
  );
}

/**
 * Fetches a single historical sale by ID belonging to the authenticated store.
 * Always returns the exact historical record stored in `public.sales`.
 */
export async function fetchStoreSaleById(saleId: string): Promise<Sale | null> {
  if (!saleId || !saleId.trim()) {
    return null;
  }

  const storeId = await getAuthenticatedStoreId();

  const { data, error } = await supabase
    .from('sales')
    .select(
      'id, store_id, product_id, product_name, unit, quantity, unit_price, total_amount, created_at'
    )
    .eq('id', saleId.trim())
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    throw new Error(
      mapSaleDatabaseError(error, 'Could not load sale details. Please try again.')
    );
  }

  if (!data) {
    return null;
  }

  return normalizeSaleRow(data as Record<string, unknown>);
}

/**
 * Computes the current calendar day's sales summary (total amount & transaction count)
 * from a list of store sales records in the user's local timezone.
 */
export function computeTodaySalesSummary(sales: Sale[]): TodaySalesSummary {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  let todayTotalCentavos = 0;
  let todayCount = 0;

  for (const sale of sales) {
    const saleDate = new Date(sale.created_at);
    if (
      !Number.isNaN(saleDate.getTime()) &&
      saleDate.getFullYear() === currentYear &&
      saleDate.getMonth() === currentMonth &&
      saleDate.getDate() === currentDate
    ) {
      todayCount += 1;
      const amountCentavos = Math.round(sale.total_amount * 100);
      todayTotalCentavos += amountCentavos;
    }
  }

  return {
    totalAmount: Number((todayTotalCentavos / 100).toFixed(2)),
    transactionCount: todayCount,
  };
}

/**
 * Formats a sale's ISO timestamp into a friendly time string (e.g. "2:35 PM").
 */
export function formatSaleTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a sale's ISO timestamp into a friendly date string (e.g. "October 22, 2026").
 */
export function formatSaleDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Groups sales records by human-readable date headers:
 * - "Today"
 * - "Yesterday"
 * - "Month Day, Year" (e.g. "October 20, 2026")
 *
 * Assumes sales are already sorted newest-first (`created_at DESC`),
 * which is guaranteed by `fetchStoreSales`.
 */
export function groupSalesByDate(sales: Sale[]): DateGroupedSales[] {
  if (!sales || sales.length === 0) {
    return [];
  }

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  const groupsMap = new Map<string, { title: string; data: Sale[] }>();

  for (const sale of sales) {
    const saleDate = new Date(sale.created_at);
    if (Number.isNaN(saleDate.getTime())) {
      continue;
    }

    const key = `${saleDate.getFullYear()}-${saleDate.getMonth()}-${saleDate.getDate()}`;
    let group = groupsMap.get(key);

    if (!group) {
      let title: string;
      if (key === todayKey) {
        title = 'Today';
      } else if (key === yesterdayKey) {
        title = 'Yesterday';
      } else {
        title = saleDate.toLocaleDateString('en-PH', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      group = { title, data: [] };
      groupsMap.set(key, group);
    }

    group.data.push(sale);
  }

  return Array.from(groupsMap.values()).map((g) => ({
    dateTitle: g.title,
    data: g.data,
  }));
}
