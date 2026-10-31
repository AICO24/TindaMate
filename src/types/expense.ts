/**
 * TindaMate — Batch 9A: Expense Management Foundation Types
 * File: src/types/expense.ts
 *
 * Single source of truth for Expense domain entities, practical sari-sari store
 * expense categories, form values, and validation errors.
 */

export const EXPENSE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Supplies',
  'Transportation',
  'Restocking-related Expense',
  'Maintenance',
  'Salaries',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseFilterTab = 'All' | ExpenseCategory;

/**
 * Normalized Expense entity returned to UI components.
 * Monetary `amount` is normalized to a finite 2-decimal number from PostgreSQL `numeric(12, 2)`.
 */
export interface Expense {
  id: string;
  store_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Validated payload for creating a new store expense.
 */
export interface CreateExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string | null;
}

/**
 * Validated payload for updating an existing store expense.
 */
export interface UpdateExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string | null;
}

/**
 * Controlled string form state used by Add Expense and Edit Expense screens.
 */
export interface ExpenseFormValues {
  title: string;
  category: string;
  amount: string;
  expenseDate: string;
  notes: string;
}

/**
 * Field-level validation error messages for the Expense form.
 */
export interface ExpenseFormErrors {
  title?: string;
  category?: string;
  amount?: string;
  expenseDate?: string;
  notes?: string;
}

/**
 * Summary metrics of store expenses for the Dashboard (Batch 9B).
 */
export interface DashboardExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
}


