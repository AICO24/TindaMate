import { getAuthenticatedStoreId } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import {
  CreateExpenseInput,
  DashboardExpenseSummary,
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
  ExpenseFilterTab,
  ExpenseFormErrors,
  ExpenseFormValues,
  UpdateExpenseInput,
} from '@/types/expense';

/**
 * Returns today's date in local time formatted as YYYY-MM-DD.
 */
export function getTodayDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date in local time formatted as YYYY-MM-DD.
 */
export function getYesterdayDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether a string is a valid calendar date in YYYY-MM-DD format.
 */
export function isValidExpenseDateString(dateStr: string): boolean {
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (
    !Number.isSafeInteger(year) ||
    !Number.isSafeInteger(month) ||
    !Number.isSafeInteger(day) ||
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

/**
 * Formats a YYYY-MM-DD expense date string into a human-friendly label
 * (e.g., "Oct 31, 2026").
 */
export function formatExpenseDate(dateStr: string): string {
  if (!dateStr) return '—';
  const trimmed = dateStr.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    if (!Number.isNaN(localDate.getTime())) {
      return localDate.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  const fallback = new Date(dateStr);
  if (Number.isNaN(fallback.getTime())) {
    return dateStr;
  }
  return fallback.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Checks whether a category string matches one of the predefined ExpenseCategory options.
 */
export function isValidExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Normalizes a raw Supabase `public.expenses` row into a strongly-typed `Expense` entity.
 * Uses integer centavos rounding to avoid floating-point anomalies.
 */
export function normalizeExpenseRow(row: Record<string, unknown>): Expense {
  const rawAmount = Number(row.amount ?? 0);
  const safeAmount = Number.isFinite(rawAmount)
    ? Number((Math.round(rawAmount * 100) / 100).toFixed(2))
    : 0;

  const rawCategory = typeof row.category === 'string' ? row.category.trim() : '';
  const category: ExpenseCategory = isValidExpenseCategory(rawCategory)
    ? rawCategory
    : 'Other';

  const rawDate =
    typeof row.expense_date === 'string' && row.expense_date.trim()
      ? row.expense_date.trim().slice(0, 10)
      : getTodayDateISO();

  const rawNotes =
    typeof row.notes === 'string' && row.notes.trim().length > 0
      ? row.notes.trim()
      : null;

  return {
    id: String(row.id ?? ''),
    store_id: String(row.store_id ?? ''),
    title:
      typeof row.title === 'string' && row.title.trim()
        ? row.title.trim()
        : 'Store Expense',
    category,
    amount: safeAmount,
    expense_date: rawDate,
    notes: rawNotes,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

/**
 * Validates Expense Form Values with strict monetary and date checks:
 * - Title: Required, trimmed, 1-120 chars
 * - Amount: Required, valid monetary format, > 0 (evaluated in integer centavos)
 * - Category: Required, must be a valid ExpenseCategory
 * - Expense Date: Required, valid YYYY-MM-DD calendar date
 * - Notes: Optional, max 300 chars
 */
export function validateExpenseForm(values: ExpenseFormValues): {
  isValid: boolean;
  errors: ExpenseFormErrors;
  sanitized?: CreateExpenseInput;
} {
  const errors: ExpenseFormErrors = {};

  // 1. Title
  const trimmedTitle = values.title.trim();
  if (!trimmedTitle) {
    errors.title = 'Expense title is required.';
  } else if (trimmedTitle.length > 120) {
    errors.title = 'Expense title must be 120 characters or less.';
  }

  // 2. Category
  const trimmedCategory = values.category.trim();
  if (!trimmedCategory) {
    errors.category = 'Please select an expense category.';
  } else if (!isValidExpenseCategory(trimmedCategory)) {
    errors.category = 'Please choose a valid expense category.';
  }

  // 3. Amount (safe integer centavo handling)
  const rawAmount = values.amount
    .trim()
    .replace(/,/g, '')
    .replace(/^₱\s?/, '');
  let validatedAmount = 0;

  if (!rawAmount) {
    errors.amount = 'Expense amount is required.';
  } else if (!/^-?\d+(\.\d{1,2})?$/.test(rawAmount)) {
    errors.amount = 'Enter a valid amount (for example, 150 or 150.50).';
  } else {
    const numericAmount = Number(rawAmount);
    if (!Number.isFinite(numericAmount) || Number.isNaN(numericAmount)) {
      errors.amount = 'Enter a valid expense amount.';
    } else {
      const centavos = Math.round(numericAmount * 100);
      if (centavos <= 0) {
        errors.amount = 'Expense amount must be greater than zero.';
      } else if (centavos > 99999999999) {
        errors.amount = 'Expense amount is too large.';
      } else {
        validatedAmount = Number((centavos / 100).toFixed(2));
      }
    }
  }

  // 4. Expense Date
  const trimmedDate = values.expenseDate.trim();
  if (!trimmedDate) {
    errors.expenseDate = 'Expense date is required.';
  } else if (!isValidExpenseDateString(trimmedDate)) {
    errors.expenseDate = 'Enter a valid date in YYYY-MM-DD format (e.g., 2026-10-31).';
  }

  // 5. Notes (Optional)
  const trimmedNotes = values.notes.trim();
  if (trimmedNotes.length > 300) {
    errors.notes = 'Notes cannot exceed 300 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: {},
    sanitized: {
      title: trimmedTitle,
      category: trimmedCategory as ExpenseCategory,
      amount: validatedAmount,
      expense_date: trimmedDate,
      notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    },
  };
}

/**
 * Maps Supabase / PostgREST errors to clear, vendor-friendly messages.
 */
export function mapExpenseDatabaseError(
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
    code === 'PGRST205' ||
    message.includes("could not find the table 'public.expenses'")
  ) {
    return 'Expenses table is not yet set up in Supabase. Please run the Batch 9A migration SQL in your Supabase SQL Editor and retry.';
  }

  if (
    code === '42501' ||
    message.includes('violates row-level security policy') ||
    message.includes('row-level security')
  ) {
    return 'You do not have permission to manage expenses for this store.';
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
 * Fetches expenses belonging to the authenticated store, ordered by
 * `expense_date` DESC, then `created_at` DESC.
 */
export async function fetchStoreExpenses(
  searchQuery?: string,
  categoryFilter: ExpenseFilterTab = 'All'
): Promise<Expense[]> {
  const storeId = await getAuthenticatedStoreId();

  let query = supabase
    .from('expenses')
    .select(
      'id, store_id, title, category, amount, expense_date, notes, created_at, updated_at'
    )
    .eq('store_id', storeId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (categoryFilter && categoryFilter !== 'All') {
    query = query.eq('category', categoryFilter);
  }

  const cleanSearch = searchQuery?.trim() || '';
  if (cleanSearch) {
    query = query.or(
      `title.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%,notes.ilike.%${cleanSearch}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      mapExpenseDatabaseError(
        error,
        'Could not load your store expenses. Please try again.'
      )
    );
  }

  return (data ?? []).map((row) =>
    normalizeExpenseRow(row as Record<string, unknown>)
  );
}

/**
 * Fetches a single expense by ID belonging to the authenticated store.
 */
export async function fetchStoreExpenseById(
  expenseId: string
): Promise<Expense | null> {
  if (!expenseId || !expenseId.trim()) {
    return null;
  }

  const storeId = await getAuthenticatedStoreId();

  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, store_id, title, category, amount, expense_date, notes, created_at, updated_at'
    )
    .eq('id', expenseId.trim())
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) {
    throw new Error(
      mapExpenseDatabaseError(
        error,
        'Could not load expense details. Please try again.'
      )
    );
  }

  if (!data) {
    return null;
  }

  return normalizeExpenseRow(data as Record<string, unknown>);
}

/**
 * Creates a new expense for the authenticated store.
 * Store ownership (`store_id`) is resolved from the authenticated session and enforced by RLS.
 */
export async function createStoreExpense(
  input: CreateExpenseInput
): Promise<Expense> {
  const storeId = await getAuthenticatedStoreId();
  const trimmedTitle = input.title.trim();

  if (!trimmedTitle) {
    throw new Error('Expense title is required.');
  }

  const centavos = Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(centavos) || centavos <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }
  const safeAmount = Number((centavos / 100).toFixed(2));

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      store_id: storeId,
      title: trimmedTitle,
      category: input.category,
      amount: safeAmount,
      expense_date: input.expense_date.trim(),
      notes: input.notes?.trim() || null,
    })
    .select(
      'id, store_id, title, category, amount, expense_date, notes, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    throw new Error(
      mapExpenseDatabaseError(
        error,
        'Could not save the expense. Please check your details and try again.'
      )
    );
  }

  return normalizeExpenseRow(data as Record<string, unknown>);
}

/**
 * Updates an existing expense belonging to the authenticated store.
 */
export async function updateStoreExpense(
  expenseId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  if (!expenseId || !expenseId.trim()) {
    throw new Error('Invalid expense ID.');
  }

  const storeId = await getAuthenticatedStoreId();
  const trimmedTitle = input.title.trim();

  if (!trimmedTitle) {
    throw new Error('Expense title cannot be empty.');
  }

  const centavos = Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(centavos) || centavos <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }
  const safeAmount = Number((centavos / 100).toFixed(2));

  const { data, error } = await supabase
    .from('expenses')
    .update({
      title: trimmedTitle,
      category: input.category,
      amount: safeAmount,
      expense_date: input.expense_date.trim(),
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId.trim())
    .eq('store_id', storeId)
    .select(
      'id, store_id, title, category, amount, expense_date, notes, created_at, updated_at'
    )
    .single();

  if (error || !data) {
    throw new Error(
      mapExpenseDatabaseError(
        error,
        'Could not update the expense. Please try again.'
      )
    );
  }

  return normalizeExpenseRow(data as Record<string, unknown>);
}

/**
 * Deletes an expense belonging to the authenticated store.
 */
export async function deleteStoreExpense(expenseId: string): Promise<void> {
  if (!expenseId || !expenseId.trim()) {
    throw new Error('Invalid expense ID.');
  }

  const storeId = await getAuthenticatedStoreId();

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId.trim())
    .eq('store_id', storeId);

  if (error) {
    throw new Error(
      mapExpenseDatabaseError(
        error,
        'Could not delete the expense. Please try again.'
      )
    );
  }
}

/**
 * Computes the store's today's expenses summary from an array of expenses,
 * using safe integer centavos to avoid floating-point accumulation errors.
 */
export function computeTodayExpenseSummary(
  expenses: Pick<Expense, 'amount' | 'expense_date'>[],
  targetDateISO: string = getTodayDateISO()
): DashboardExpenseSummary {
  let totalCentavos = 0;
  let count = 0;

  for (const item of expenses) {
    if (item.expense_date === targetDateISO) {
      const rawAmount = Number(item.amount);
      if (Number.isFinite(rawAmount) && rawAmount > 0) {
        totalCentavos += Math.round(rawAmount * 100);
        count += 1;
      }
    }
  }

  return {
    totalExpenses: Number((totalCentavos / 100).toFixed(2)),
    expenseCount: count,
  };
}

/**
 * Fetches the current-day expense summary for the authenticated store:
 * 1. Resolves store_id from the authenticated user session.
 * 2. Queries `public.expenses` for records matching `expense_date = today` in local time.
 * 3. Calculates total amount and transaction count with integer-centavo monetary safety.
 *
 * Strictly scoped to `store_id = authenticated user ID` and protected by Supabase RLS.
 */
export async function fetchDashboardExpenseSummary(): Promise<DashboardExpenseSummary> {
  const storeId = await getAuthenticatedStoreId();
  const todayISO = getTodayDateISO();

  const { data, error } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('store_id', storeId)
    .eq('expense_date', todayISO);

  if (error) {
    throw new Error(
      mapExpenseDatabaseError(
        error,
        "Could not load today's expense summary."
      )
    );
  }

  const normalizedRows = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const rawAmount = Number(record.amount ?? 0);
    const dateStr =
      typeof record.expense_date === 'string'
        ? record.expense_date.trim().slice(0, 10)
        : todayISO;
    return {
      amount: Number.isFinite(rawAmount) ? rawAmount : 0,
      expense_date: dateStr,
    };
  });

  return computeTodayExpenseSummary(normalizedRows, todayISO);
}


