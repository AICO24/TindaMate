# TindaMate — Batch 10B-1: Expense Period & Net Profit Synchronization Implementation Report

**Document ID:** `TM-IMPL-10B-1-20261111`  
**Date:** November 11, 2026  
**Engineer:** Senior React Native Engineer & Financial Systems Engineer  
**Repository:** `AICO24/TindaMate`  
**Base Checkpoint:** `9343bd5`  
**Scope:** Sub-batch 10B-1 (Expense Period & Net Profit Synchronization)  
**Status:** Completed, verified via `npx tsc --noEmit`, pending user runtime verification.

---

## 1. Implementation Summary

Batch 10B-1 resolves the critical financial period mismatch identified in the comprehensive audit (`docs/audits/BATCH_10B_FINANCIAL_REPORTING_AUDIT.md`).

Previously, `/reports` fetched **all-time** gross profit from `fetchStoreCOGSSummary()` and subtracted **today-only** expenses from `fetchDashboardExpenseSummary()`, labeling the single-day expense as "Month Expenses". This severely corrupted the Net Store Profit calculation.

In this batch:
1. A robust Philippine timezone (`Asia/Manila` / UTC+08:00) month boundary utility (`getCurrentPhilippineMonthRange`) was implemented to calculate exact start and end dates for both PostgreSQL `date` columns (`YYYY-MM-DD`) and `timestamptz` columns (ISO strings).
2. A store-scoped, paginated, centavo-accurate date-range expense summary service (`fetchStoreExpenseSummaryForRange`) was added to `src/lib/expenses.ts`.
3. The Reports data loader in `src/app/reports.tsx` was updated to pass matching current-month boundaries to both `fetchStoreCOGSSummary` and `fetchStoreExpenseSummaryForRange`.
4. Net Store Profit was synchronized to:
   $$\text{Net Profit} = \text{Current Month Gross Profit} - \text{Current Month Expenses}$$
   using centavo arithmetic and safe handling for null/loading states.
5. The Breakdown Grid tile label was updated from `"Month Expenses"` to `"This Month's Expenses"`, displaying the authentic expense count and total for the current calendar month.
6. Zero changes were made to `fetchDashboardExpenseSummary()`, ensuring the Home Dashboard's today-only summary remains 100% operational.
7. All uncommitted Batch 10A security and database integrity modifications were strictly preserved.

---

## 2. Exact Files Modified

1. **`src/lib/expenses.ts`**:
   - Added `PhilippineMonthRange` interface.
   - Added `getCurrentPhilippineMonthRange(referenceDate?: Date): PhilippineMonthRange`.
   - Added `computeExpenseSummaryFromList(expenses, startDate, endDate): DashboardExpenseSummary`.
   - Added `fetchStoreExpenseSummaryForRange(startDate: string, endDate: string): Promise<DashboardExpenseSummary>`.
   - Preserved `fetchDashboardExpenseSummary()` and Batch 10A in-memory search sanitization.
2. **`src/app/reports.tsx`**:
   - Updated imports: replaced `fetchDashboardExpenseSummary` with `fetchStoreExpenseSummaryForRange` and `getCurrentPhilippineMonthRange`.
   - Updated `loadAnalytics` to compute current-month boundaries and query both COGS and expenses for that exact range.
   - Updated `netStoreProfit` calculation to evaluate `grossProfit - totalExpenses` using centavo precision, returning `null` if either data source is unavailable.
   - Updated `heroMetric` for tab `'Profit'` to display `"This Month's Gross Profit"` and `"Net after expenses"`.
   - Updated Breakdown Grid tile label to `"This Month's Expenses"`, rendering period-accurate amount and expense count.

---

## 3. Current-Month Date Boundary Logic

The application serves sari-sari stores in the Philippines (`Asia/Manila` timezone, UTC+08:00, no daylight saving time).

### 3.1 Boundary Calculation Model (`getCurrentPhilippineMonthRange`)
```typescript
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: 'numeric',
}).formatToParts(referenceDate);
```
- Extracts the authoritative calendar `year` and `month` in the Philippines.
- Determines the last calendar day of the month using `new Date(Date.UTC(year, month, 0)).getUTCDate()`, accurately handling leap years (e.g. Feb 29 in 2024, Feb 28 in 2025/2026, 30 vs 31 days).

### 3.2 Target Database Column Mappings
For current month November 2026:

| Column / Parameter | Type | Format | Boundary Value (Philippine Time) | Boundary Value (UTC ISO) |
| :--- | :--- | :--- | :--- | :--- |
| `expenses.expense_date` (`startDateDateOnly`) | `date` | `YYYY-MM-DD` | `2026-11-01` | N/A (date-only) |
| `expenses.expense_date` (`endDateDateOnly`) | `date` | `YYYY-MM-DD` | `2026-11-30` | N/A (date-only) |
| `get_store_cogs_summary` (`p_start_date`) | `timestamptz` | ISO 8601 | `2026-11-01 00:00:00.000+08:00` | `2026-10-31T16:00:00.000Z` |
| `get_store_cogs_summary` (`p_end_date`) | `timestamptz` | ISO 8601 | `2026-11-30 23:59:59.999+08:00` | `2026-11-30T15:59:59.999Z` |

Because `get_store_cogs_summary` implements `si.created_at <= p_end_date` (inclusive), the end timestamp is set to `23:59:59.999+08:00`. Passing the start of the next month would improperly include transactions occurring at midnight on December 1st.

---

## 4. Expense Aggregation Implementation

### 4.1 Implementation in `src/lib/expenses.ts`
```typescript
export async function fetchStoreExpenseSummaryForRange(
  startDate: string,
  endDate: string
): Promise<DashboardExpenseSummary> {
  const storeId = await getAuthenticatedStoreId();

  const trimmedStart = startDate.trim();
  const trimmedEnd = endDate.trim();

  if (!trimmedStart || !trimmedEnd) {
    throw new Error(
      'Both start date and end date are required for expense range calculation.'
    );
  }

  let totalCentavos = 0;
  let count = 0;
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('store_id', storeId)
      .gte('expense_date', trimmedStart)
      .lte('expense_date', trimmedEnd)
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(
        mapExpenseDatabaseError(
          error,
          'Could not load store expenses for the specified period.'
        )
      );
    }

    const rows = data ?? [];
    for (const row of rows) {
      const rawAmount = Number((row as Record<string, unknown>).amount ?? 0);
      if (Number.isFinite(rawAmount) && rawAmount > 0) {
        totalCentavos += Math.round(rawAmount * 100);
        count += 1;
      }
    }

    if (rows.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  return {
    totalExpenses: Number((totalCentavos / 100).toFixed(2)),
    expenseCount: count,
  };
}
```

### 4.2 Key Features
1. **Store Isolation & RLS:** Enforces `store_id = authenticated user ID` and respects PostgreSQL Row-Level Security.
2. **Chunked Pagination:** Uses `range(offset, offset + pageSize - 1)` with a 1,000-row page size to guarantee that stores with high expense volumes are never silently truncated by PostgREST row limits.
3. **Centavo Arithmetic:** Accumulates `Math.round(amount * 100)` in integer centavos before converting back to two decimal places, preventing floating-point accumulation drift.
4. **Empty State Safety:** Returns `{ totalExpenses: 0, expenseCount: 0 }` if zero expenses match the range.
5. **No SQL Injection:** Avoids `.or()` filter interpolation.

---

## 5. COGS RPC Date-Filter Integration

The existing PostgreSQL function `public.get_store_cogs_summary` created in migration `20261031000001_batch9d_cogs_aggregation_foundation.sql` already accepted `p_start_date` and `p_end_date`:
```sql
CREATE OR REPLACE FUNCTION public.get_store_cogs_summary(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
```
In `src/app/reports.tsx`, the call was previously:
```typescript
// BEFORE: Unbounded all-time query
fetchStoreCOGSSummary()
```
It has now been updated to:
```typescript
// AFTER: Filtered to current calendar month
const monthRange = getCurrentPhilippineMonthRange();

fetchStoreCOGSSummary({
  startDate: monthRange.startTimestampISO,
  endDate: monthRange.endTimestampISO,
})
```
This requires **zero database migrations** and preserves all historical cost snapshots, tracked item sums, and `hasIncompleteCosts` tracking.

---

## 6. Net Profit Formula Before and After

### Before (Buggy):
$$\text{Net Profit}_{\text{old}} = \text{Gross Profit}_{\text{All-Time}} - \text{Expenses}_{\text{Today}}$$
- **Discrepancy:** All-time revenue and COGS (accumulated over months/years) minus 1 day of expenses.
- **Example:** ₱100,000 all-time gross profit - ₱150 today's expenses = ₱99,850 "Net Profit" today.

### After (Synchronized):
$$\text{Net Profit}_{\text{current\_month}} = \text{Gross Profit}_{\text{Current Month}} - \text{Expenses}_{\text{Current Month}}$$
- **Accuracy:** Both operands are bound to the identical calendar month (`YYYY-MM-01` to `YYYY-MM-LD`).
- **Precision:** Centavo-safe calculation:
  ```typescript
  const grossCentavos = Math.round(grossProfit * 100);
  const expenseCentavos = Math.round(totalExpenses * 100);
  const netStoreProfit = Number(((grossCentavos - expenseCentavos) / 100).toFixed(2));
  ```

---

## 7. Loading and Error Handling

1. **Failure Containment:** If either `fetchStoreCOGSSummary` or `fetchStoreExpenseSummaryForRange` encounters a database error, `Promise.all` throws and enters the component's `catch` block, setting `errorMessage` and displaying `DashboardErrorBanner` with a retry action.
2. **No Fictitious Zero Profit:** If either data source returns `null`, `netStoreProfit` evaluates to `null`. The UI renders `"—"` rather than displaying `₱0.00` as if the store made zero profit.
3. **Empty Data Handling:** If a store has zero sales and zero expenses in the current month, both queries return `0.00`, correctly producing `₱0.00` Net Profit.

---

## 8. TypeScript and Static Verification Results

Executed `npx tsc --noEmit` across the entire project:
```text
Task: npx tsc --noEmit
Exit Code: 0
Output: No compiler errors found. Strict TypeScript typing validated.
```

---

## 9. Regression Checks Performed

1. **Home Dashboard (`src/app/home.tsx`):**
   - Verified `fetchDashboardExpenseSummary()` was NOT altered.
   - Verified the home screen continues to query `expense_date = todayISO` for the daily expense card.
2. **Expense Management (`src/lib/expenses.ts`):**
   - Verified Batch 10A in-memory search filter sanitization (`cleanSearch` in `fetchStoreExpenses`) remains intact.
   - Verified expense validation (`validateExpenseForm`), creation (`createStoreExpense`), updating, and deletion functions are unchanged.
3. **Database Schema & Migrations:**
   - No SQL migrations were added or modified.
   - No database mutations were performed.

---

## 10. Manual Testing Checklist (for User Verification)

- [ ] **Reports Screen Loading:** Navigate to `/reports` (More -> Reports). Screen loads without runtime errors.
- [ ] **Profit Tab Hero Metric:** Tap the `Profit` tab.
  - Hero amount displays current month's Gross Profit (e.g. `₱X,XXX.XX`).
  - Hero badge displays `Net after expenses: ₱X,XXX.XX` matching `Gross Profit - Month Expenses`.
- [ ] **Breakdown Grid:**
  - Tile 2 ("Recorded COGS") shows COGS for the current month.
  - Tile 3 label displays `"This Month's Expenses"`.
  - Tile 3 amount matches the sum of all expenses logged within the current calendar month.
  - Tile 3 caption reflects the count of expense entries this month.
- [ ] **Home Dashboard Parity:** Navigate to Home (`/home`). Verify the "Today's Expenses" card still reflects today's expenses only, completely unaffected by the monthly reports calculation.
- [ ] **Pull to Refresh:** Pull down on `/reports` to trigger refresh. Verifies clean reload without crash or state inconsistency.

---

## 11. Known Limitations

1. **Current Month Static Horizon:** Batch 10B-1 aligns the reporting baseline to the current calendar month. Interactive timeframe selectors (`Today`, `This Week`, `This Month`, `All Time`, Custom Range) will be introduced in Sub-batch 10B-3.
2. **Top Products Still on Header Table:** Multi-item cart attribution and inventory fallback in `topProducts` will be corrected in Sub-batch 10B-2.
3. **Array Index Modulo Sales Chart:** The 5-bar trend chart remains on its temporary layout and will be updated to chronological time-series bucketing in Sub-batch 10B-4.

---

## 12. Confirmation of Batch 10A Preservation

All Batch 10A modifications remain present and untouched in the working tree:
- `src/app/_layout.tsx`: Auth flow & deep link routing.
- `src/app/login.tsx`: Return URL sanitization.
- `src/app/more.tsx`: Sign-out cache clearing.
- `src/lib/customers.ts`: Customer search sanitization.
- `src/lib/expenses.ts`: Expense search sanitization.
- `src/lib/oauth.ts`: OAuth redirect handlers.
- `src/lib/sales.ts`: Deprecation tag on legacy fallback.
- `src/lib/supabase.ts`: Strict secure token storage.
- `supabase/migrations/20261111000000_batch10a_security_and_integrity.sql`: Storage RLS & credit trigger migration.
