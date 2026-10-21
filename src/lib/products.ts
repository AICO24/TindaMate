import { supabase } from '@/lib/supabase';
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_PRODUCT_UNIT,
  Product,
  ProductFormErrors,
  ProductFormValues,
  ProductStockStatus,
  StoreProductSummary,
  ValidatedProductInput,
} from '@/types/product';

/**
 * Centralized TindaMate Stock Status Rule (Batch 3 Section 11)
 *
 * IF stock_quantity <= 0
 *     status = 'Out of Stock'
 * ELSE IF stock_quantity <= low_stock_threshold
 *     status = 'Low Stock'
 * ELSE
 *     status = 'In Stock'
 *
 * Used identically across:
 * - Product List items
 * - Product Details screen
 * - Add / Edit Product live preview & save payload
 * - Dashboard Low Stock KPI count
 */
export function getProductStockStatus(
  stockQuantity: number,
  lowStockThreshold: number
): ProductStockStatus {
  const safeStock = Number.isFinite(stockQuantity) ? stockQuantity : 0;
  const safeThreshold = Number.isFinite(lowStockThreshold)
    ? Math.max(0, lowStockThreshold)
    : DEFAULT_LOW_STOCK_THRESHOLD;

  if (safeStock <= 0) {
    return 'Out of Stock';
  }

  if (safeStock <= safeThreshold) {
    return 'Low Stock';
  }

  return 'In Stock';
}

/**
 * Formats a numeric amount into Philippine Peso currency string (e.g., ₱15.00).
 */
export function formatPesoCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return '₱0.00';
  }

  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Normalizes a raw Supabase row (where `numeric(12,2)` columns may arrive as
 * strings or numbers) into a strongly-typed `Product` object with computed status.
 */
function normalizeProductRow(row: Record<string, unknown>): Product {
  const sellingPriceRaw = Number(row.selling_price ?? 0);
  const sellingPrice = Number.isFinite(sellingPriceRaw) ? sellingPriceRaw : 0;

  const costPriceRaw =
    row.cost_price === null || row.cost_price === undefined || row.cost_price === ''
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
 * Validates Product Form Values according to Batch 3 Section 12 rules.
 * Does NOT silently coerce invalid user input into valid values.
 */
export function validateProductForm(values: ProductFormValues): {
  isValid: boolean;
  errors: ProductFormErrors;
  sanitized?: ValidatedProductInput;
} {
  const errors: ProductFormErrors = {};

  // 1. Product Name: Required, trim whitespace, must not be empty
  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = 'Product name is required.';
  } else if (trimmedName.length > 120) {
    errors.name = 'Product name must be 120 characters or less.';
  }

  // 2. Category: Optional, trim whitespace
  const trimmedCategory = values.category.trim();
  if (trimmedCategory.length > 80) {
    errors.category = 'Category must be 80 characters or less.';
  }

  // 2b. Image URL: Optional, trim whitespace, basic URL format validation if entered
  const trimmedImageUrl = values.imageUrl.trim();
  if (trimmedImageUrl.length > 0) {
    if (!/^https?:\/\/.+/i.test(trimmedImageUrl)) {
      errors.imageUrl = 'Image link must start with http:// or https://';
    } else if (trimmedImageUrl.length > 500) {
      errors.imageUrl = 'Image link is too long (max 500 characters).';
    }
  }

  // 3. Selling Price: Required, valid non-negative number (up to 2 decimal places)
  const rawSellingPrice = values.sellingPrice.trim();
  let parsedSellingPrice = NaN;
  if (!rawSellingPrice) {
    errors.sellingPrice = 'Selling price is required.';
  } else if (!/^-?\d+(\.\d{1,2})?$/.test(rawSellingPrice)) {
    errors.sellingPrice =
      'Enter a valid price (for example, 15 or 15.50).';
  } else {
    parsedSellingPrice = Number(rawSellingPrice);
    if (!Number.isFinite(parsedSellingPrice)) {
      errors.sellingPrice = 'Enter a valid selling price.';
    } else if (parsedSellingPrice < 0) {
      errors.sellingPrice = 'Selling price cannot be negative.';
    } else if (parsedSellingPrice > 999999999.99) {
      errors.sellingPrice = 'Selling price is too large.';
    }
  }

  // 4. Cost Price: Optional; if entered, must be valid and non-negative
  const rawCostPrice = values.costPrice.trim();
  let parsedCostPrice: number | null = null;
  if (rawCostPrice.length > 0) {
    if (!/^-?\d+(\.\d{1,2})?$/.test(rawCostPrice)) {
      errors.costPrice =
        'Enter a valid cost price (for example, 12 or 12.25).';
    } else {
      const numericCost = Number(rawCostPrice);
      if (!Number.isFinite(numericCost)) {
        errors.costPrice = 'Enter a valid cost price.';
      } else if (numericCost < 0) {
        errors.costPrice = 'Cost price cannot be negative.';
      } else if (numericCost > 999999999.99) {
        errors.costPrice = 'Cost price is too large.';
      } else {
        parsedCostPrice = Number(numericCost.toFixed(2));
      }
    }
  }

  // 5. Stock Quantity: Required, whole number >= 0
  const rawStock = values.stockQuantity.trim();
  let parsedStockQuantity = NaN;
  if (!rawStock) {
    errors.stockQuantity = 'Stock quantity is required.';
  } else if (!/^-?\d+$/.test(rawStock)) {
    errors.stockQuantity = 'Enter a whole number for stock quantity (0 or more).';
  } else {
    parsedStockQuantity = Number(rawStock);
    if (!Number.isSafeInteger(parsedStockQuantity)) {
      errors.stockQuantity = 'Enter a valid whole number for stock quantity.';
    } else if (parsedStockQuantity < 0) {
      errors.stockQuantity = 'Stock quantity must be 0 or greater.';
    } else if (parsedStockQuantity > 1000000) {
      errors.stockQuantity = 'Stock quantity is too large.';
    }
  }

  // 6. Low-Stock Threshold: Required/defaulted, whole number >= 0
  const rawThreshold = values.lowStockThreshold.trim();
  let parsedThreshold = NaN;
  if (!rawThreshold) {
    errors.lowStockThreshold =
      'Low-stock alert level is required (enter 0 or more).';
  } else if (!/^-?\d+$/.test(rawThreshold)) {
    errors.lowStockThreshold =
      'Enter a whole number for the low-stock alert level.';
  } else {
    parsedThreshold = Number(rawThreshold);
    if (!Number.isSafeInteger(parsedThreshold)) {
      errors.lowStockThreshold = 'Enter a valid low-stock alert level.';
    } else if (parsedThreshold < 0) {
      errors.lowStockThreshold = 'Low-stock alert level must be 0 or greater.';
    } else if (parsedThreshold > 1000000) {
      errors.lowStockThreshold = 'Low-stock alert level is too large.';
    }
  }

  // 7. Unit: Defaults to 'pcs' if blank, max length check
  const trimmedUnit = values.unit.trim() || DEFAULT_PRODUCT_UNIT;
  if (trimmedUnit.length > 24) {
    errors.unit = 'Unit must be 24 characters or less.';
  }

  const isValid = Object.keys(errors).length === 0;
  if (!isValid) {
    return { isValid: false, errors };
  }

  const normalizedSellingPrice = Number(parsedSellingPrice.toFixed(2));
  const status = getProductStockStatus(parsedStockQuantity, parsedThreshold);

  return {
    isValid: true,
    errors: {},
    sanitized: {
      name: trimmedName,
      category: trimmedCategory.length > 0 ? trimmedCategory : null,
      image_url: trimmedImageUrl.length > 0 ? trimmedImageUrl : null,
      selling_price: normalizedSellingPrice,
      cost_price: parsedCostPrice,
      stock_quantity: parsedStockQuantity,
      low_stock_threshold: parsedThreshold,
      unit: trimmedUnit,
      status,
    },
  };
}

/**
 * Maps Supabase / PostgREST errors to clear, vendor-friendly messages.
 */
export function mapProductDatabaseError(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const maybeError = error as { code?: string; message?: string; details?: string };
  const code = maybeError.code ?? '';
  const message = (maybeError.message ?? '').toLowerCase();

  if (code === 'PGRST205' || message.includes("could not find the table 'public.products'")) {
    return 'Products table is not yet set up in Supabase. Please run the Batch 3 migration SQL in your Supabase SQL Editor and retry.';
  }

  if (code === '42501' || message.includes('row-level security')) {
    return 'You do not have permission to access or modify products for this store.';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection')
  ) {
    return 'Unable to connect to TindaMate servers. Check your internet connection and try again.';
  }

  return maybeError.message || fallback;
}

/**
 * Resolves the currently authenticated vendor's store_id (`auth.users.id`).
 * Throws an error if there is no active authenticated session.
 */
export async function getAuthenticatedStoreId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(mapProductDatabaseError(error, 'Unable to verify your store session.'));
  }

  const userId = data.session?.user?.id;
  if (!userId) {
    throw new Error('Your session has expired. Please log in again.');
  }

  return userId;
}

/**
 * Fetches all products belonging to the authenticated user's store,
 * ordered alphabetically by name (with newest tie-breaker).
 */
export async function fetchStoreProducts(): Promise<Product[]> {
  const storeId = await getAuthenticatedStoreId();

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, store_id, name, category, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, unit, status, created_at, updated_at'
    )
    .eq('store_id', storeId)
    .order('name', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      mapProductDatabaseError(
        error,
        'Could not load your store products. Please try again.'
      )
    );
  }

  return (data ?? []).map((row) =>
    normalizeProductRow(row as Record<string, unknown>)
  );
}

/**
 * Fetches a single product by ID belonging to the authenticated user's store.
 */
export async function fetchStoreProductById(productId: string): Promise<Product | null> {
  const storeId = await getAuthenticatedStoreId();

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, store_id, name, category, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, unit, status, created_at, updated_at'
    )
    .eq('id', productId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    throw new Error(
      mapProductDatabaseError(
        error,
        'Could not load product details. Please try again.'
      )
    );
  }

  if (!data) {
    return null;
  }

  return normalizeProductRow(data as Record<string, unknown>);
}

/**
 * Creates a new product for the authenticated user's store.
 * Note: `store_id` is explicitly set to the authenticated user's ID and
 * verified by database RLS (`WITH CHECK (auth.uid() = store_id)`).
 */
export async function createStoreProduct(
  input: ValidatedProductInput
): Promise<Product> {
  const storeId = await getAuthenticatedStoreId();
  const computedStatus = getProductStockStatus(
    input.stock_quantity,
    input.low_stock_threshold
  );

  const { data, error } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      name: input.name,
      category: input.category,
      image_url: input.image_url,
      selling_price: input.selling_price,
      cost_price: input.cost_price,
      stock_quantity: input.stock_quantity,
      low_stock_threshold: input.low_stock_threshold,
      unit: input.unit,
      status: computedStatus,
    })
    .select(
      'id, store_id, name, category, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, unit, status, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    throw new Error(
      mapProductDatabaseError(
        error,
        'Could not save the new product. Please check your details and try again.'
      )
    );
  }

  return normalizeProductRow(data as Record<string, unknown>);
}

/**
 * Updates an existing product belonging to the authenticated user's store.
 * Updates the existing row in place (`eq('id', productId).eq('store_id', storeId)`)
 * and never creates a duplicate record.
 */
export async function updateStoreProduct(
  productId: string,
  input: ValidatedProductInput
): Promise<Product> {
  const storeId = await getAuthenticatedStoreId();
  const computedStatus = getProductStockStatus(
    input.stock_quantity,
    input.low_stock_threshold
  );

  const { data, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      category: input.category,
      image_url: input.image_url,
      selling_price: input.selling_price,
      cost_price: input.cost_price,
      stock_quantity: input.stock_quantity,
      low_stock_threshold: input.low_stock_threshold,
      unit: input.unit,
      status: computedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('store_id', storeId)
    .select(
      'id, store_id, name, category, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, unit, status, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    throw new Error(
      mapProductDatabaseError(
        error,
        'Could not update the product. Please try again.'
      )
    );
  }

  return normalizeProductRow(data as Record<string, unknown>);
}

/**
 * Computes store product summary metrics using the centralized `getProductStockStatus` rule.
 * Used by the Dashboard (`Products` and `Low Stock` cards) and Products list overview.
 */
export function computeStoreProductSummary(
  products: Pick<Product, 'stock_quantity' | 'low_stock_threshold'>[]
): StoreProductSummary {
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const item of products) {
    const status = getProductStockStatus(
      item.stock_quantity,
      item.low_stock_threshold
    );
    if (status === 'Out of Stock') {
      outOfStockCount += 1;
    } else if (status === 'Low Stock') {
      lowStockCount += 1;
    } else {
      inStockCount += 1;
    }
  }

  return {
    totalProducts: products.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
  };
}

/**
 * Fetches lightweight stock summary counts for the authenticated user's store.
 * Queries only `stock_quantity` and `low_stock_threshold` for the vendor's `store_id`
 * and applies the centralized `getProductStockStatus` rule.
 */
export async function fetchStoreProductSummary(): Promise<StoreProductSummary> {
  const storeId = await getAuthenticatedStoreId();

  const { data, error } = await supabase
    .from('products')
    .select('stock_quantity, low_stock_threshold')
    .eq('store_id', storeId);

  if (error) {
    throw new Error(
      mapProductDatabaseError(
        error,
        'Unable to load store product counts.'
      )
    );
  }

  const normalizedRows = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const stock = Number(record.stock_quantity ?? 0);
    const threshold = Number(
      record.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
    );
    return {
      stock_quantity: Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
      low_stock_threshold: Number.isFinite(threshold)
        ? Math.max(0, Math.trunc(threshold))
        : DEFAULT_LOW_STOCK_THRESHOLD,
    };
  });

  return computeStoreProductSummary(normalizedRows);
}

/**
 * Decodes a base64 string into a standard ArrayBuffer for Supabase Storage uploads.
 */
export function decodeBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const cleaned = base64String.replace(/^data:image\/[a-zA-Z]+;base64,/, '').trim();

  if (typeof atob === 'function') {
    const binaryString = atob(cleaned);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Pure JavaScript base64 decode fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bufferLength = cleaned.length * 0.75;
  if (cleaned.endsWith('=')) bufferLength--;
  if (cleaned.endsWith('==')) bufferLength--;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);

  let p = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const enc1 = chars.indexOf(cleaned[i]);
    const enc2 = chars.indexOf(cleaned[i + 1]);
    const enc3 = chars.indexOf(cleaned[i + 2]);
    const enc4 = chars.indexOf(cleaned[i + 3]);

    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (enc3 !== 64 && enc3 !== -1) {
      bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    }
    if (enc4 !== 64 && enc4 !== -1) {
      bytes[p++] = ((enc3 & 3) << 6) | enc4;
    }
  }

  return arrayBuffer;
}

/**
 * Uploads a local product image file (captured via camera or selected from gallery)
 * to Supabase Storage bucket ('products') and returns its public URL.
 */
export async function uploadProductImage(
  localUri: string,
  base64?: string | null,
  mimeType = 'image/jpeg'
): Promise<string> {
  const storeId = await getAuthenticatedStoreId();
  const fileExt = mimeType.includes('png') ? 'png' : 'jpg';
  const filePath = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  let uploadPayload: Blob | ArrayBuffer;

  if (base64) {
    uploadPayload = decodeBase64ToArrayBuffer(base64);
  } else {
    const response = await fetch(localUri);
    uploadPayload = await response.blob();
  }

  const { data, error } = await supabase.storage
    .from('products')
    .upload(filePath, uploadPayload, {
      contentType: mimeType,
      upsert: true,
    });

  if (error || !data) {
    throw new Error(
      mapProductDatabaseError(
        error,
        'Could not upload product photo. Ensure the "products" storage bucket exists in Supabase.'
      )
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from('products')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

