import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '@/types/sale';
import { Product } from '@/types/product';
import { calculateSaleTotal } from '@/lib/sales';

const TINDAMATE_CART_STORAGE_KEY = '@tindamate/active_pos_cart';

type CartListener = (cart: CartItem[]) => void;
const listeners = new Set<CartListener>();

let memoryCart: CartItem[] = [];
let isHydrated = false;
let hydrationPromise: Promise<CartItem[]> | null = null;

function notifyListeners() {
  const snapshot = [...memoryCart];
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (err) {
      console.warn('[CartStore] Listener error:', err);
    }
  }
}

function sanitizeCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }
  return rawItems.filter(
    (item): item is CartItem =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as CartItem).productId === 'string' &&
      typeof (item as CartItem).productName === 'string' &&
      typeof (item as CartItem).sellingPrice === 'number' &&
      Number.isFinite((item as CartItem).sellingPrice) &&
      typeof (item as CartItem).quantity === 'number' &&
      Number.isFinite((item as CartItem).quantity) &&
      (item as CartItem).quantity > 0
  );
}

/**
 * Loads persisted cart from AsyncStorage on startup (deduplicated across concurrent callers).
 */
export async function getPersistedCart(): Promise<CartItem[]> {
  if (isHydrated) {
    return memoryCart;
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(TINDAMATE_CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryCart = sanitizeCartItems(parsed);
      }
    } catch (err) {
      console.warn('[CartStore] Failed to load cart from AsyncStorage:', err);
    } finally {
      isHydrated = true;
      hydrationPromise = null;
      notifyListeners();
    }
    return memoryCart;
  })();

  return hydrationPromise;
}

/**
 * Persists the latest cart items to AsyncStorage and notifies all active UI subscribers.
 */
export async function savePersistedCart(cart: CartItem[]): Promise<void> {
  memoryCart = sanitizeCartItems(cart);
  isHydrated = true;
  notifyListeners();
  try {
    if (memoryCart.length === 0) {
      await AsyncStorage.removeItem(TINDAMATE_CART_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(
        TINDAMATE_CART_STORAGE_KEY,
        JSON.stringify(memoryCart)
      );
    }
  } catch (err) {
    console.warn('[CartStore] Failed to save cart to AsyncStorage:', err);
  }
}

/**
 * Returns current snapshot of in-memory cart synchronously.
 */
export function getCartSnapshot(): CartItem[] {
  return memoryCart;
}

/**
 * Calculates the total number of items in the cart (sum of quantities).
 */
export function getCartTotalItemCount(cart: CartItem[]): number {
  if (!Array.isArray(cart)) {
    return 0;
  }
  return cart.reduce((sum, item) => {
    const qty = Number(item?.quantity);
    return sum + (Number.isFinite(qty) && qty > 0 ? Math.trunc(qty) : 0);
  }, 0);
}

/**
 * Returns the quantity of a specific product currently in the cart.
 */
export function getProductCartQuantity(
  cart: CartItem[],
  productId: string | undefined
): number {
  if (!productId || !Array.isArray(cart)) {
    return 0;
  }
  const found = cart.find((item) => item.productId === productId);
  return found && Number.isFinite(found.quantity) && found.quantity > 0
    ? Math.trunc(found.quantity)
    : 0;
}

/**
 * Adds a product with a specified quantity into the cart (capping at available stock).
 */
export function addProductWithQuantityToCart(
  cart: CartItem[],
  product: Product,
  quantityToAdd: number
): CartItem[] {
  const safeQtyToAdd = Math.trunc(quantityToAdd);
  if (
    !product ||
    product.stock_quantity <= 0 ||
    !Number.isFinite(safeQtyToAdd) ||
    safeQtyToAdd <= 0
  ) {
    return cart;
  }

  const existingIndex = cart.findIndex((item) => item.productId === product.id);

  if (existingIndex === -1) {
    const qty = Math.min(safeQtyToAdd, product.stock_quantity);
    const subtotal = calculateSaleTotal(product.selling_price, qty);
    const newItem: CartItem = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      imageUrl: product.image_url,
      unit: product.unit,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price,
      quantity: qty,
      availableStock: product.stock_quantity,
      lowStockThreshold: product.low_stock_threshold,
      subtotal,
    };
    return [...cart, newItem];
  }

  const existing = cart[existingIndex];
  const maxStock = Math.max(0, product.stock_quantity);
  if (existing.quantity >= maxStock) {
    return cart;
  }

  const nextQuantity = Math.min(maxStock, existing.quantity + safeQtyToAdd);
  const nextSubtotal = calculateSaleTotal(product.selling_price, nextQuantity);

  const updatedCart = [...cart];
  updatedCart[existingIndex] = {
    ...existing,
    productName: product.name,
    category: product.category,
    imageUrl: product.image_url,
    unit: product.unit,
    sellingPrice: product.selling_price,
    costPrice: product.cost_price,
    availableStock: maxStock,
    lowStockThreshold: product.low_stock_threshold,
    quantity: nextQuantity,
    subtotal: nextSubtotal,
  };

  return updatedCart;
}

/**
 * Subscribes to real-time cart changes (useful for header cart badges across screens).
 */
export function subscribeToCartChanges(listener: CartListener): () => void {
  listeners.add(listener);
  // Send current snapshot immediately
  listener([...memoryCart]);
  return () => {
    listeners.delete(listener);
  };
}
