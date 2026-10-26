/**
-- ============================================================================
-- TindaMate — Batch 8A: Customer & Credit (Utang) Foundation Types
-- File: src/types/customer.ts
--
-- Single source of truth for Customer, Credit Account, Credit Transaction,
-- and Credit Balance Summary domain entities.
-- ============================================================================
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

