import { getAuthenticatedStoreId } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import {
  CreateCustomerInput,
  Customer,
  CustomerCreditSummary,
  CustomerFilterTab,
  CustomerFormErrors,
  CustomerFormValues,
  CustomerWithCredit,
  UpdateCustomerInput,
} from '@/types/customer';

/**
 * Validates the Customer input form values without silent coercion:
 * - Name: Required, cannot be whitespace-only
 * - Phone: Optional, trimmed if present
 * - Notes: Optional, trimmed if present
 */
export function validateCustomerForm(values: CustomerFormValues): {
  isValid: boolean;
  errors: CustomerFormErrors;
  sanitized?: CreateCustomerInput;
} {
  const errors: CustomerFormErrors = {};
  const trimmedName = values.name.trim();

  if (!trimmedName) {
    errors.name = 'Please enter the customer name.';
  } else if (trimmedName.length > 100) {
    errors.name = 'Customer name cannot exceed 100 characters.';
  }

  const trimmedPhone = values.phone.trim();
  const trimmedNotes = values.notes.trim();

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
      name: trimmedName,
      phone: trimmedPhone.length > 0 ? trimmedPhone : null,
      notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    },
  };
}

/**
 * Normalizes a raw Supabase `public.customers` row into a strongly-typed `Customer` entity.
 */
export function normalizeCustomerRow(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id ?? ''),
    store_id: String(row.store_id ?? ''),
    name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : 'Customer',
    phone: typeof row.phone === 'string' && row.phone.trim() ? row.phone.trim() : null,
    notes: typeof row.notes === 'string' && row.notes.trim() ? row.notes.trim() : null,
    is_active: Boolean(row.is_active ?? true),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

/**
 * Normalizes a raw row from `public.customer_credit_summaries` into a typed `CustomerCreditSummary`.
 */
export function normalizeCreditSummaryRow(
  row: Record<string, unknown>
): CustomerCreditSummary {
  const totalChargedRaw = Number(row.total_charged ?? 0);
  const totalPaidRaw = Number(row.total_paid ?? 0);
  const currentBalanceRaw = Number(row.current_balance ?? 0);

  return {
    credit_account_id: String(row.credit_account_id ?? ''),
    store_id: String(row.store_id ?? ''),
    customer_id: String(row.customer_id ?? ''),
    customer_name: String(row.customer_name ?? ''),
    customer_phone:
      typeof row.customer_phone === 'string' && row.customer_phone.trim()
        ? row.customer_phone.trim()
        : null,
    customer_is_active: Boolean(row.customer_is_active ?? true),
    account_status: row.account_status === 'settled' ? 'settled' : 'open',
    total_charged: Number.isFinite(totalChargedRaw)
      ? Number(totalChargedRaw.toFixed(2))
      : 0,
    total_paid: Number.isFinite(totalPaidRaw)
      ? Number(totalPaidRaw.toFixed(2))
      : 0,
    current_balance: Number.isFinite(currentBalanceRaw)
      ? Number(currentBalanceRaw.toFixed(2))
      : 0,
    last_transaction_at:
      typeof row.last_transaction_at === 'string'
        ? row.last_transaction_at
        : null,
  };
}

/**
 * Maps database/network errors to clean, user-friendly messages for sari-sari store owners.
 */
export function mapCustomerDatabaseError(
  error: unknown,
  fallbackMessage: string
): string {
  if (!error) return fallbackMessage;

  const errObj = error as { code?: string; message?: string; details?: string };
  const message = errObj.message?.toLowerCase() || '';

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to connect') ||
    message.includes('timeout')
  ) {
    return 'Unable to reach your store database. Please check your internet connection and try again.';
  }

  if (
    errObj.code === '28000' ||
    message.includes('jwt') ||
    message.includes('session has expired') ||
    message.includes('not authenticated')
  ) {
    return 'Your store session has expired. Please log in again to continue.';
  }

  if (
    errObj.code === '42501' ||
    message.includes('violates row-level security policy')
  ) {
    return 'You do not have permission to manage customers for this store.';
  }

  return fallbackMessage;
}

/**
 * Fetches store customers belonging to the authenticated store, optionally filtered
 * by search query (name or phone) and active status tab.
 */
export async function fetchStoreCustomers(
  searchQuery?: string,
  filterTab: CustomerFilterTab = 'All'
): Promise<CustomerWithCredit[]> {
  const storeId = await getAuthenticatedStoreId();

  // 1. Fetch customers
  let query = supabase
    .from('customers')
    .select('id, store_id, name, phone, notes, is_active, created_at, updated_at')
    .eq('store_id', storeId)
    .order('name', { ascending: true });

  const cleanSearch = searchQuery?.trim() || '';
  if (cleanSearch) {
    // Search by name or phone
    query = query.or(`name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`);
  }

  if (filterTab === 'Active') {
    query = query.eq('is_active', true);
  } else if (filterTab === 'Inactive') {
    query = query.eq('is_active', false);
  }

  const { data: customerRows, error: customerError } = await query;

  if (customerError) {
    throw new Error(
      mapCustomerDatabaseError(
        customerError,
        'Could not load your store customers. Please try again.'
      )
    );
  }

  const customers: Customer[] = (customerRows ?? []).map((row) =>
    normalizeCustomerRow(row as Record<string, unknown>)
  );

  if (customers.length === 0) {
    return [];
  }

  // 2. Fetch credit summaries for all store customers
  let summariesMap = new Map<string, CustomerCreditSummary>();
  try {
    const { data: summaryRows, error: summaryError } = await supabase
      .from('customer_credit_summaries')
      .select('*')
      .eq('store_id', storeId);

    if (!summaryError && summaryRows) {
      for (const row of summaryRows) {
        const summary = normalizeCreditSummaryRow(row as Record<string, unknown>);
        summariesMap.set(summary.customer_id, summary);
      }
    }
  } catch {
    // If view query fails or hasn't had transactions, graceful fallback to 0 balance
  }

  // 3. Combine customer and credit summary
  let result: CustomerWithCredit[] = customers.map((customer) => ({
    ...customer,
    credit_summary: summariesMap.get(customer.id) ?? null,
  }));

  // If filtered by 'With Utang', only include customers with positive balance
  if (filterTab === 'With Utang') {
    result = result.filter(
      (c) => (c.credit_summary?.current_balance ?? 0) > 0
    );
  }

  return result;
}

/**
 * Fetches a single customer by ID belonging to the authenticated store,
 * including their authoritative credit summary.
 */
export async function fetchStoreCustomerById(
  customerId: string
): Promise<CustomerWithCredit | null> {
  if (!customerId || !customerId.trim()) {
    return null;
  }

  const storeId = await getAuthenticatedStoreId();

  // 1. Fetch customer profile
  const { data: customerRow, error: customerError } = await supabase
    .from('customers')
    .select('id, store_id, name, phone, notes, is_active, created_at, updated_at')
    .eq('id', customerId.trim())
    .eq('store_id', storeId)
    .maybeSingle();

  if (customerError) {
    throw new Error(
      mapCustomerDatabaseError(
        customerError,
        'Could not load customer details. Please try again.'
      )
    );
  }

  if (!customerRow) {
    return null;
  }

  const customer = normalizeCustomerRow(customerRow as Record<string, unknown>);

  // 2. Fetch associated credit balance summary from view
  let creditSummary: CustomerCreditSummary | null = null;
  try {
    const { data: summaryRow, error: summaryError } = await supabase
      .from('customer_credit_summaries')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('store_id', storeId)
      .maybeSingle();

    if (!summaryError && summaryRow) {
      creditSummary = normalizeCreditSummaryRow(
        summaryRow as Record<string, unknown>
      );
    }
  } catch {
    creditSummary = null;
  }

  return {
    ...customer,
    credit_summary: creditSummary,
  };
}

/**
 * Creates a new customer for the authenticated store:
 * 1. Inserts into `public.customers`
 * 2. Initializes the 1-to-1 `public.credit_accounts` record
 */
export async function createStoreCustomer(
  input: CreateCustomerInput
): Promise<CustomerWithCredit> {
  const storeId = await getAuthenticatedStoreId();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Customer name is required.');
  }

  // 1. Insert customer record
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .insert({
      store_id: storeId,
      name: trimmedName,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      is_active: true,
    })
    .select('id, store_id, name, phone, notes, is_active, created_at, updated_at')
    .single();

  if (customerError || !customerData) {
    throw new Error(
      mapCustomerDatabaseError(
        customerError,
        'Could not create customer. Please try again.'
      )
    );
  }

  const customer = normalizeCustomerRow(customerData as Record<string, unknown>);

  // 2. Initialize customer credit account (safe idempotency)
  try {
    await supabase.from('credit_accounts').insert({
      store_id: storeId,
      customer_id: customer.id,
      status: 'open',
    });
  } catch {
    // If account already exists or constraint triggers, ignore
  }

  return {
    ...customer,
    credit_summary: {
      credit_account_id: '',
      store_id: storeId,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_is_active: true,
      account_status: 'open',
      total_charged: 0,
      total_paid: 0,
      current_balance: 0,
      last_transaction_at: null,
    },
  };
}

/**
 * Updates an existing customer profile:
 * - Allows modifying: `name`, `phone`, `notes`, `is_active`
 * - Preserves: `id`, `store_id`, `created_at`
 */
export async function updateStoreCustomer(
  customerId: string,
  input: UpdateCustomerInput
): Promise<CustomerWithCredit> {
  const storeId = await getAuthenticatedStoreId();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Customer name cannot be empty.');
  }

  const updatePayload: Record<string, unknown> = {
    name: trimmedName,
    phone: input.phone !== undefined ? (input.phone?.trim() || null) : undefined,
    notes: input.notes !== undefined ? (input.notes?.trim() || null) : undefined,
    updated_at: new Date().toISOString(),
  };

  if (input.is_active !== undefined) {
    updatePayload.is_active = Boolean(input.is_active);
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('id', customerId.trim())
    .eq('store_id', storeId)
    .select('id, store_id, name, phone, notes, is_active, created_at, updated_at')
    .single();

  if (updateError || !updatedRow) {
    throw new Error(
      mapCustomerDatabaseError(
        updateError,
        'Could not update customer details. Please try again.'
      )
    );
  }

  const updatedCustomer = normalizeCustomerRow(
    updatedRow as Record<string, unknown>
  );

  // Re-fetch credit summary
  const fullDetails = await fetchStoreCustomerById(updatedCustomer.id);
  return (
    fullDetails ?? {
      ...updatedCustomer,
      credit_summary: null,
    }
  );
}

/**
 * Toggles the active status of a customer (deactivate or reactivate):
 * - Does NOT delete customer records or credit ledger history
 */
export async function toggleCustomerActiveStatus(
  customerId: string,
  isActive: boolean
): Promise<CustomerWithCredit> {
  return updateStoreCustomer(customerId, {
    name: (await fetchStoreCustomerById(customerId))?.name || 'Customer',
    is_active: isActive,
  });
}

