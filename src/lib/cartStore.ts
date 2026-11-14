import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '@/types/sale';
import { Product } from '@/types/product';
import { calculateSaleTotal } from '@/lib/sales';

const TINDAMATE_CART_STORAGE_KEY = '@tindamate/active_pos_cart';

type CartListener = (cart: CartItem[]) => void;
const listeners = new Set<CartListener>();

let memoryCart: CartItem[] = [];
let isHydrated = false;

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(memoryCart);
    } catch (err) {
      console.warn('[CartStore] Listener error:', err);
    }
  }
}

/**
 * Loads persisted cart from AsyncStorage on startup.
 */
export async function getPersistedCart(): Promise<CartItem[]> {
  if (isHydrated) {
    return memoryCart;
  }
  try {
    const raw = await AsyncStorage.getItem(TINDAMATE_CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryCart = parsed;
      }
    }
  } catch (err) {
    console.warn('[CartStore] Failed to load cart from AsyncStorage:', err);
  } finally {
    isHydrated = true;
  }
  return memoryCart;
}

/**
 * Persists the latest cart items to AsyncStorage and notifies all active UI subscribers.
 */
export async function savePersistedCart(cart: CartItem[]): Promise<void> {
  memoryCart = cart;
  isHydrated = true;
  notifyListeners();
  try {
    if (cart.length === 0) {
      await AsyncStorage.removeItem(TINDAMATE_CART_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(
        TINDAMATE_CART_STORAGE_KEY,
        JSON.stringify(cart)
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
  return cart.reduce((sum, item) => sum + (item.quantity > 0 ? item.quantity : 0), 0);
}

/**
 * Adds a product with a specified quantity into the cart (capping at available stock).
 */
export function addProductWithQuantityToCart(
  cart: CartItem[],
  product: Product,
  quantityToAdd: number
): CartItem[] {
  if (!product || product.stock_quantity <= 0 || quantityToAdd <= 0) {
    return cart;
  }
  const existingIndex = cart.findIndex((item) => item.productId === product.id);
  if (existingIndex === -1) {
    const qty = Math.min(quantityToAdd, product.stock_quantity);
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
  const nextQuantity = Math.min(existing.availableStock, existing.quantity + quantityToAdd);
  const nextSubtotal = calculateSaleTotal(existing.sellingPrice, nextQuantity);

  const updatedCart = [...cart];
  updatedCart[existingIndex] = {
    ...existing,
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
  listener(memoryCart);
  return () => {
    listeners.delete(listener);
  };
}
