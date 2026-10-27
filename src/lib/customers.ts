import { formatPesoCurrency, getAuthenticatedStoreId } from '@/lib/products';
import { generateIdempotencyKey } from '@/lib/sales';
import { supabase } from '@/lib/supabase';
import {
  CompletedPaymentResult,
  CreateCustomerInput,
  CreditTransactionSaleInfo,
  Customer,
  CustomerCreditSummary,
  CustomerCreditTransaction,
  CustomerFilterTab,
  CustomerFormErrors,
  CustomerFormValues,
  CustomerWithCredit,
  PaymentAmountValidation,
  RecordPaymentInput,
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
 * Normalizes a raw row from `public.credit_transactions` into a typed `CustomerCreditTransaction`.
 */
export function normalizeCreditTransactionRow(
  row: Record<string, unknown>,
  saleInfo?: CreditTransactionSaleInfo | null
): CustomerCreditTransaction {
  const amountRaw = Number(row.amount ?? 0);
  return {
    id: String(row.id ?? ''),
    store_id: String(row.store_id ?? ''),
    credit_account_id: String(row.credit_account_id ?? ''),
    customer_id: String(row.customer_id ?? ''),
    sale_id:
      typeof row.sale_id === 'string' && row.sale_id.trim()
        ? row.sale_id.trim()
        : null,
    transaction_type: row.transaction_type === 'payment' ? 'payment' : 'charge',
    amount: Number.isFinite(amountRaw)
      ? Number(amountRaw.toFixed(2))
      : 0,
    notes:
      typeof row.notes === 'string' && row.notes.trim()
        ? row.notes.trim()
        : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    sale: saleInfo ?? null,
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

  // Preserve user-friendly RAISE EXCEPTION messages from PostgreSQL RPC
  if (
    errObj.message &&
    !errObj.message.startsWith('duplicate key') &&
    !errObj.message.startsWith('null value') &&
    !errObj.message.includes('syntax error') &&
    !errObj.message.includes('relation')
  ) {
    return errObj.message;
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
 * Fetches the credit/utang transaction ledger history for a specific store customer,
 * ordered reverse-chronologically (newest first).
 *
 * For transactions linked to a POS sale (`sale_id` present), fetches authoritative
 * snapshot sale information (product name summary, item count, quantity, total amount)
 * so the store owner has complete transaction context.
 */
export async function fetchCustomerCreditTransactions(
  customerId: string
): Promise<CustomerCreditTransaction[]> {
  if (!customerId || !customerId.trim()) {
    return [];
  }

  const storeId = await getAuthenticatedStoreId();

  // 1. Fetch immutable ledger entries for this customer in this store
  const { data: txRows, error: txError } = await supabase
    .from('credit_transactions')
    .select(
      'id, store_id, credit_account_id, customer_id, sale_id, transaction_type, amount, notes, created_at'
    )
    .eq('store_id', storeId)
    .eq('customer_id', customerId.trim())
    .order('created_at', { ascending: false });

  if (txError) {
    throw new Error(
      mapCustomerDatabaseError(
        txError,
        'Could not load customer credit transaction history. Please try again.'
      )
    );
  }

  if (!txRows || txRows.length === 0) {
    return [];
  }

  // 2. Collect unique sale IDs to fetch associated sale metadata
  const saleIds = Array.from(
    new Set(
      txRows
        .map((row) =>
          typeof row.sale_id === 'string' ? row.sale_id.trim() : null
        )
        .filter((id): id is string => Boolean(id && id.length > 0))
    )
  );

  const salesMap = new Map<string, CreditTransactionSaleInfo>();

  if (saleIds.length > 0) {
    try {
      const { data: saleRows, error: saleError } = await supabase
        .from('sales')
        .select(
          'id, product_name, unit, quantity, unit_price, total_amount, item_count, payment_method, created_at'
        )
        .eq('store_id', storeId)
        .in('id', saleIds);

      if (!saleError && saleRows) {
        for (const row of saleRows) {
          const s = row as Record<string, unknown>;
          salesMap.set(String(s.id), {
            id: String(s.id),
            product_name:
              typeof s.product_name === 'string' && s.product_name.trim()
                ? s.product_name.trim()
                : 'Sale',
            unit: typeof s.unit === 'string' ? s.unit : undefined,
            quantity: Number(s.quantity ?? 1),
            unit_price: Number(s.unit_price ?? 0),
            total_amount: Number(s.total_amount ?? 0),
            item_count: s.item_count ? Number(s.item_count) : undefined,
            payment_method:
              typeof s.payment_method === 'string' ? s.payment_method : undefined,
            created_at: String(s.created_at ?? ''),
          });
        }
      }
    } catch {
      // Non-blocking: If sale lookup fails, we still return the credit transactions
    }
  }

  return txRows.map((row) => {
    const saleId = typeof row.sale_id === 'string' ? row.sale_id.trim() : null;
    const saleInfo = saleId ? salesMap.get(saleId) ?? null : null;
    return normalizeCreditTransactionRow(
      row as Record<string, unknown>,
      saleInfo
    );
  });
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

/**
 * Validates user-entered payment amount against customer's current balance:
 * - Empty string -> Error: 'Please enter a payment amount.'
 * - Non-numeric or NaN -> Error: 'Please enter a valid payment amount.'
 * - <= 0 -> Error: 'Payment amount must be greater than zero.'
 * - > currentBalance -> Error: 'Payment cannot exceed outstanding balance of ₱...'
 * - Valid -> Computes exact remaining balance using integer centavos to avoid float errors.
 */
export function validatePaymentAmountInput(
  rawInput: string,
  currentBalance: number
): PaymentAmountValidation {
  const trimmed = rawInput.trim().replace(/,/g, '').replace(/^₱\s?/, '');

  if (!trimmed) {
    return {
      isValid: false,
      amount: null,
      remainingBalance: currentBalance,
      error: 'Please enter a payment amount.',
    };
  }

  const numericValue = Number(trimmed);
  if (!Number.isFinite(numericValue) || Number.isNaN(numericValue)) {
    return {
      isValid: false,
      amount: null,
      remainingBalance: currentBalance,
      error: 'Please enter a valid payment amount.',
    };
  }

  // Calculate in integer centavos to prevent floating-point anomalies
  const amountCentavos = Math.round(numericValue * 100);
  if (amountCentavos <= 0) {
    return {
      isValid: false,
      amount: null,
      remainingBalance: currentBalance,
      error: 'Payment amount must be greater than zero.',
    };
  }

  const balanceCentavos = Math.round(currentBalance * 100);
  if (amountCentavos > balanceCentavos) {
    const formattedMax = formatPesoCurrency(currentBalance);
    return {
      isValid: false,
      amount: Number((amountCentavos / 100).toFixed(2)),
      remainingBalance: currentBalance,
      error: `Payment cannot exceed outstanding balance of ${formattedMax}.`,
    };
  }

  const remainingCentavos = Math.max(0, balanceCentavos - amountCentavos);
  const remainingBalance = Number((remainingCentavos / 100).toFixed(2));
  const validAmount = Number((amountCentavos / 100).toFixed(2));

  return {
    isValid: true,
    amount: validAmount,
    remainingBalance,
  };
}

/**
 * Authoritatively records a customer payment against their outstanding credit ledger.
 *
 * Primary Path:
 * - Executes atomic PostgreSQL RPC `public.record_customer_payment`
 * - Uses exclusive row-level lock (`FOR UPDATE`) on credit account to eliminate concurrent race conditions
 * - Computes authoritative balance and validates amount > 0 and amount <= balance
 * - Inserts immutable payment transaction into `public.credit_transactions`
 * - Handles idempotency keys to safely prevent accidental double-taps
 *
 * Consistency-Guarded Fallback:
 * - If RPC is missing in schema cache (`PGRST202`), executes direct transactional sequence against Supabase tables with strict balance validation
 */
export async function recordCustomerPayment(
  input: RecordPaymentInput
): Promise<CompletedPaymentResult> {
  const customerId = input.customerId?.trim();
  if (!customerId) {
    throw new Error('Please select a valid customer.');
  }

  const rawAmount = input.amount;
  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const paymentAmount = Number(rawAmount.toFixed(2));
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const storeId = await getAuthenticatedStoreId();
  const idempotencyKey = input.idempotencyKey || generateIdempotencyKey();

  // 1. Primary path: PostgreSQL RPC `public.record_customer_payment`
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'record_customer_payment',
    {
      p_customer_id: customerId,
      p_amount: paymentAmount,
      p_notes: input.notes?.trim() || null,
      p_idempotency_key: idempotencyKey,
    }
  );

  if (!rpcError && rpcData && typeof rpcData === 'object') {
    const payload = rpcData as {
      payment: Record<string, unknown>;
      customer_id: string;
      credit_account_id: string;
      amount: number;
      previous_balance?: number;
      remaining_balance: number;
      is_fully_paid: boolean;
      is_retry: boolean;
    };

    const paymentTx = normalizeCreditTransactionRow(payload.payment);
    const amount = Number(payload.amount ?? paymentAmount);
    const remainingBalance = Number(payload.remaining_balance ?? 0);
    const previousBalance =
      payload.previous_balance !== undefined && payload.previous_balance !== null
        ? Number(payload.previous_balance)
        : Number((remainingBalance + amount).toFixed(2));

    return {
      payment: paymentTx,
      customerId: payload.customer_id,
      creditAccountId: payload.credit_account_id,
      amount,
      previousBalance,
      remainingBalance,
      isFullyPaid: Boolean(payload.is_fully_paid),
      isRetry: Boolean(payload.is_retry),
    };
  }

  // 2. If RPC is unavailable (PGRST202) or not deployed yet, use consistency-guarded fallback
  if (
    rpcError &&
    (rpcError.code === 'PGRST202' ||
      (rpcError.message ?? '').toLowerCase().includes('could not find the function'))
  ) {
    return recordCustomerPaymentFallback({
      customerId,
      amount: paymentAmount,
      notes: input.notes?.trim() || null,
      idempotencyKey,
      storeId,
    });
  }

  // 3. Otherwise propagate user-friendly error
  if (rpcError) {
    throw new Error(
      mapCustomerDatabaseError(
        rpcError,
        'Could not record customer payment. Please try again.'
      )
    );
  }

  throw new Error('Unexpected response while recording customer payment.');
}

/**
 * Consistency-guarded fallback when RPC function is not in schema cache.
 * Performs customer ownership verification, authoritative balance check, and immutable payment insertion.
 */
async function recordCustomerPaymentFallback(params: {
  customerId: string;
  amount: number;
  notes: string | null;
  idempotencyKey: string;
  storeId: string;
}): Promise<CompletedPaymentResult> {
  const { customerId, amount, notes, idempotencyKey, storeId } = params;

  // Check idempotency retry
  try {
    const { data: existingTx } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('store_id', storeId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingTx) {
      const paymentTx = normalizeCreditTransactionRow(
        existingTx as Record<string, unknown>
      );
      const customerWithCredit = await fetchStoreCustomerById(customerId);
      const remainingBalance =
        customerWithCredit?.credit_summary?.current_balance ?? 0;
      return {
        payment: paymentTx,
        customerId,
        creditAccountId: paymentTx.credit_account_id,
        amount: paymentTx.amount,
        previousBalance: Number((remainingBalance + paymentTx.amount).toFixed(2)),
        remainingBalance,
        isFullyPaid: remainingBalance <= 0,
        isRetry: true,
      };
    }
  } catch {
    // If idempotency_key column doesn't exist yet, proceed
  }

  // Fetch customer & authoritative credit summary
  const customer = await fetchStoreCustomerById(customerId);
  if (!customer) {
    throw new Error('Customer not found or does not belong to your store.');
  }

  const currentBalance = customer.credit_summary?.current_balance ?? 0;
  if (currentBalance <= 0) {
    throw new Error('This customer has no outstanding balance to pay.');
  }

  if (amount > currentBalance) {
    throw new Error(
      `Payment amount of ${formatPesoCurrency(amount)} exceeds customer's outstanding balance of ${formatPesoCurrency(currentBalance)}.`
    );
  }

  // Find or create credit account
  let creditAccountId = customer.credit_summary?.credit_account_id;
  if (!creditAccountId) {
    const { data: accData } = await supabase
      .from('credit_accounts')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('store_id', storeId)
      .maybeSingle();
    creditAccountId = accData?.id;
  }

  if (!creditAccountId) {
    const { data: newAcc, error: accError } = await supabase
      .from('credit_accounts')
      .insert({
        store_id: storeId,
        customer_id: customer.id,
        status: 'open',
      })
      .select('id')
      .single();

    if (accError || !newAcc) {
      throw new Error(
        mapCustomerDatabaseError(
          accError,
          'Could not initialize customer credit account.'
        )
      );
    }
    creditAccountId = newAcc.id;
  }

  // Insert payment transaction
  const insertPayload: Record<string, unknown> = {
    store_id: storeId,
    credit_account_id: creditAccountId,
    customer_id: customer.id,
    sale_id: null,
    transaction_type: 'payment',
    amount,
    notes: notes || 'Customer payment',
    idempotency_key: idempotencyKey,
  };

  let { data: txData, error: txError } = await supabase
    .from('credit_transactions')
    .insert(insertPayload)
    .select('*')
    .single();

  // If insert failed because idempotency_key column isn't in older schema, retry without it
  if (txError && txError.message?.includes('idempotency_key')) {
    delete insertPayload.idempotency_key;
    const retry = await supabase
      .from('credit_transactions')
      .insert(insertPayload)
      .select('*')
      .single();
    txData = retry.data;
    txError = retry.error;
  }

  if (txError || !txData) {
    throw new Error(
      mapCustomerDatabaseError(
        txError,
        'Could not record customer payment. Please try again.'
      )
    );
  }

  const payment = normalizeCreditTransactionRow(
    txData as Record<string, unknown>
  );
  const remainingCentavos = Math.max(
    0,
    Math.round(currentBalance * 100) - Math.round(amount * 100)
  );
  const remainingBalance = Number((remainingCentavos / 100).toFixed(2));
  const isFullyPaid = remainingBalance <= 0;

  // Update credit account status
  try {
    await supabase
      .from('credit_accounts')
      .update({
        status: isFullyPaid ? 'settled' : 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', creditAccountId)
      .eq('store_id', storeId);
  } catch {
    // Non-blocking
  }

  return {
    payment,
    customerId: customer.id,
    creditAccountId: payment.credit_account_id,
    amount,
    previousBalance: currentBalance,
    remainingBalance,
    isFullyPaid,
    isRetry: false,
  };
}

