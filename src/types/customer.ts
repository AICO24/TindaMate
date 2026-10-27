/**
 * TindaMate — Batch 8: Customer & Credit (Utang) Foundation Types
 * File: src/types/customer.ts
 *
 * Single source of truth for Customer, Credit Account, Credit Transaction,
 * and Credit Balance Summary domain entities.
 */

/**
 * Normalized Customer entity returned to UI components.
 */
export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Valid statuses for a customer's credit account.
 */
export type CreditAccountStatus = 'open' | 'settled';

/**
 * Normalized Credit Account entity.
 * Represents the 1-to-1 credit relationship between a store and a customer.
 */
export interface CreditAccount {
  id: string;
  store_id: string;
  customer_id: string;
  status: CreditAccountStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Valid ledger transaction types.
 * - 'charge': Increases outstanding balance (e.g. utang purchase)
 * - 'payment': Decreases outstanding balance (e.g. debt repayment)
 */
export type CreditTransactionType = 'charge' | 'payment';

/**
 * Normalized Credit Transaction ledger entry.
 * Immutable financial record representing an increase or decrease in credit balance.
 */
export interface CreditTransaction {
  id: string;
  store_id: string;
  credit_account_id: string;
  customer_id: string;
  sale_id?: string | null;
  transaction_type: CreditTransactionType;
  amount: number;
  notes?: string | null;
  created_at: string;
}

/**
 * Associated sale metadata for a credit transaction.
 */
export interface CreditTransactionSaleInfo {
  id: string;
  product_name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  item_count?: number;
  payment_method?: string;
  created_at: string;
}

/**
 * Extended Credit Transaction with associated sale details (if transaction originated from a sale).
 */
export interface CustomerCreditTransaction extends CreditTransaction {
  sale?: CreditTransactionSaleInfo | null;
}

/**
 * Derivable balance summary for a customer's credit account.
 * Derived from public.customer_credit_summaries view:
 * - current_balance = total_charged - total_paid
 */
export interface CustomerCreditSummary {
  credit_account_id: string;
  store_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_is_active: boolean;
  account_status: CreditAccountStatus;
  total_charged: number;
  total_paid: number;
  current_balance: number;
  last_transaction_at?: string | null;
}

/**
 * Combined customer entity with its derived credit balance summary.
 */
export interface CustomerWithCredit extends Customer {
  credit_summary: CustomerCreditSummary | null;
}

/**
 * Input for creating a new store customer.
 */
export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  notes?: string | null;
}

/**
 * Input for updating an existing store customer.
 */
export interface UpdateCustomerInput {
  name: string;
  phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

/**
 * Raw string form values for add/edit customer forms.
 */
export interface CustomerFormValues {
  name: string;
  phone: string;
  notes: string;
  isActive?: boolean;
}

/**
 * Field-level validation error map for customer forms.
 */
export interface CustomerFormErrors {
  name?: string;
  phone?: string;
  notes?: string;
  general?: string;
}

/**
 * Filter tabs available on the customer management list.
 */
export type CustomerFilterTab = 'All' | 'Active' | 'With Utang' | 'Inactive';

/**
 * Input for recording a customer payment against their outstanding credit.
 */
export interface RecordPaymentInput {
  customerId: string;
  amount: number;
  notes?: string | null;
  idempotencyKey?: string | null;
}

/**
 * Result returned after a customer payment is atomically recorded.
 */
export interface CompletedPaymentResult {
  payment: CreditTransaction;
  customerId: string;
  creditAccountId: string;
  amount: number;
  previousBalance: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  isRetry: boolean;
}

/**
 * Client validation result for the payment amount input.
 */
export interface PaymentAmountValidation {
  isValid: boolean;
  amount: number | null;
  remainingBalance: number;
  error?: string;
}

/**
 * Summary metrics of customer credit/utang for the Dashboard (Batch 8F).
 * Authoritatively derived from the customer credit ledger and credit summaries:
 * - totalOutstandingUtang: Total outstanding customer credit balance (charges - payments)
 * - customersWithBalanceCount: Count of distinct customers with a positive outstanding balance (> 0)
 * - todayPaymentsTotal: Total payments received and recorded in the credit ledger today
 */
export interface DashboardUtangSummary {
  totalOutstandingUtang: number;
  customersWithBalanceCount: number;
  todayPaymentsTotal: number;
}


