# TindaMate — Reports & Analytics: Post R-2 Review & Batch R-3 Plan

**Review Date:** 2026-11-17  
**Target Screen:** `src/app/reports.tsx`  
**Reference Audit:** `docs/audits/REPORTS_ANALYTICS_UI_UX_AUDIT_AND_IMPLEMENTATION_PLAN.md`  
**Status:** Read-Only Verification & Batch R-3 Proposal

---

## 1. Executive Summary

Batches **R-1** (Financial Truthfulness, Incomplete Cost Transparency, P&L Breakdown & Full-Width Interactive Chart) and **R-2** (Tab-Specific Domain Cards, Enriched Top Products Drill-Down, Initial-Load Error Recovery & Visual Hierarchy Polish) have been **fully implemented and verified** in `src/app/reports.tsx`.

A thorough code inspection of `src/app/reports.tsx` (`1,588` lines) against the original R-0 audit reveals **four remaining actionable improvements**—specifically around **partial-fetch resilience (`Promise.allSettled`)**, **smooth period-switching transitions without unmounting the screen**, **interactive press states / drill-down ergonomics**, and **incomplete inventory cost valuation indicators**—that justify a focused final polish batch (**Batch R-3**).

---

## 2. R-1 and R-2 Verification

### Batch R-1 Verification (100% Complete)

| R-1 Requirement | Verification Status | Implementation Reference (`src/app/reports.tsx`) |
| :--- | :---: | :--- |
| **Incomplete product cost transparency** | Verified | `hasIncompleteCosts = Boolean(cogsSummary?.hasIncompleteCosts)` (`L254`), `trackedCostItemCount` (`L255`), `untrackedCostItemCount` (`L256`), and `untrackedQuantity` (`L257`) are computed and surfaced. |
| **Estimated Gross Profit & Net Profit labels** | Verified | `profitMetrics` (`L326–L350`) prefixes values with `~` and appends `Est. Gross Profit*` / `Est. Net Profit*` when `hasIncompleteCosts` is true; `Profit & Cost Summary` (`L714–L753`) displays matching `~` prefixes and a footnote (`L749–L753`). |
| **Amber incomplete-cost warning banner** | Verified | Rendered at `L649–L678` when `hasIncompleteCosts` is true on `All`, `Sales`, or `Profit` tabs, detailing untracked unit/product counts and navigating to `/products` on press. |
| **Truthful unavailable-value handling** | Verified | `totalCOGS` (`L252`) and `totalUtang` (`L264`) preserve `null` when unavailable, rendering `'—'` (`L290`, `L383`, `L699`, `L826`, `L988`, `L1028`) instead of misleading `₱0.00`. |
| **Full-width interactive Sales Trend chart** | Verified | Stacked full-width inside `kpiChartCard` (`L552–L646`) with interactive bar selection (`selectedBarIdx`, `activeBarIdx` at `L91`, `L404–L409`, `L586–L638`) and an active bar readout pill (`{label}: ₱X.XX` at `L579–L584`). |
| **Profit & Cost Summary breakdown** | Verified | Dedicated P&L card (`L681–L756`) showing `Sales Revenue` -> `- Tracked COGS` -> `= Gross Profit` -> `- Operating Expenses` -> `= Net Store Profit (or Net Store Loss)`. |

### Batch R-2 Verification (100% Complete)

| R-2 Requirement | Verification Status | Implementation Reference (`src/app/reports.tsx`) |
| :--- | :---: | :--- |
| **Store Inventory Health card (`Inventory` tab)** | Verified | Rendered at `L759–L808` when `selectedTab === 'Inventory'`, showing `Total Products`, `In Stock`, `Low Stock`, `Out of Stock`, `Tracked Cost Value (X/Y)`, and a `Manage →` action to `/products`. |
| **Customer Credit & Collections card (`Utang` tab)** | Verified | Rendered at `L811–L864` when `selectedTab === 'Utang'`, showing `Total Outstanding Utang`, `Customers with Balance`, `Collected Today`, and an `Open Ledger →` action to `/customers`. |
| **Enriched Top Products details & navigation** | Verified | Rendered at `L867–L963` with rank badge (`1..5`), `${unitsSold} unit(s) sold · ${sharePercent}% of sales`, right-aligned `formatPesoCurrency(item.revenue)`, and UUID-validated `/products/[id]` navigation (`L886–L900`). |
| **Initial-load error & retry state** | Verified | `isInitialLoadError` (`L411–L415`) renders a dedicated `errorStateCard` (`L527–L548`) with a `Try Again` CTA when initial analytics loading fails before any summary data is available. |
| **Dynamic period subtitle & metric readability** | Verified | Header subtitle dynamically shows `${periodLabel} store performance & profit` (`L424`); redundant `heroHeaderZone` removed; `fontVariant: ['tabular-nums']` and `adjustsFontSizeToFit` applied to financial KPIs (`L560`, `L1011`, `L1250`, `L1393`, `L1557`). |

---

## 3. Remaining Findings

### Finding R3-1 (P1): All-or-Nothing `Promise.all` Fails Entire Screen on Partial Service Error & Silently Drops Utang Errors
- **Location:** `src/app/reports.tsx#L126-L153`
- **Issue:**
  - `loadAnalytics` uses `Promise.all` (`L127`) across `salesData`, `productsData`, `cogsData`, `expenseData`, and `topProductsData`, while `fetchDashboardUtangSummary()` uses `.catch(() => null)` (`L143`).
  - If a secondary query such as `fetchStoreCOGSSummary` or `fetchStoreTopProductsForRange` fails while `salesData` and `productsData` succeed, the entire `Promise.all` rejects—preventing valid sales, chart, and inventory metrics from updating and wiping `cogsSummary`, `expenseSummary`, and `topProducts` on initial failure (`L181–L184`).
  - Conversely, if `fetchDashboardUtangSummary()` fails while the other 5 queries succeed, `.catch(() => null)` silently swallows the failure without setting `errorMessage`, leaving the `Utang` tab showing `'—'` with no error banner or retry option.
- **Recommendation:** Replace `Promise.all` in `loadAnalytics` (`L126–L153`) with `Promise.allSettled` (matching the pattern established in `src/app/home.tsx` during Batch D-5). Apply each fulfilled dataset independently and surface a consolidated `DashboardErrorBanner` message whenever one or more domain fetches fail.

### Finding R3-2 (P1): Full-Screen Loading Skeleton Unmounts All Cards on Every Period Filter Tap & Missing Refresh Guard
- **Location:** `src/app/reports.tsx#L107-L116`, `L201-L206`, `L451-L453`, `L520-L526`
- **Issue:**
  - When a user taps `Today`, `This Week`, `This Month`, or `All Time`, `handlePeriodChange` (`L201`) calls `loadAnalytics(period, false)`.
  - Inside `loadAnalytics`, `if (!showRefresh) setIsLoading(true)` (`L113–L115`) runs even when report cards are already rendered on screen. Because `L520` renders `isLoading ? <View style={styles.loadingCard}>...` instead of the report content, every period switch unmounts the entire screen, collapses scroll height, and resets the user's scroll position.
  - Additionally, `handleRefresh` (`L451–L453`) does not guard against duplicate concurrent refreshes (`if (isRefreshing || isLoading) return;`).
- **Recommendation:**
  - Track whether initial data has loaded (or introduce `isPeriodSwitching`) so full-screen `isLoading` is only used before the first successful load (or when retrying from an empty initial-load error).
  - During period changes after initial load, keep existing cards mounted with a subtle inline loading indicator / opacity transition and guard against concurrent refresh calls.

### Finding R3-3 (P2): Incomplete Inventory Cost Valuation Indicator on `Store Inventory Health` Card
- **Location:** `src/app/reports.tsx#L266-L285`, `L798-L806`
- **Issue:**
  - On the `Inventory` tab, `Store Inventory Health` displays `Tracked Cost Value (${trackedCostProducts}/${productSummary.totalProducts})` (`L800`).
  - However, when `trackedCostProducts < productSummary.totalProducts` (meaning some products in the catalog have `cost_price === null`), the peso figure (`formatPesoCurrency(inventoryValue)` at `L803`) does not use the `~` estimate prefix or an amber indicator, unlike Gross/Net Profit in the P&L card.
- **Recommendation:** When `productSummary.totalProducts > 0 && trackedCostProducts < productSummary.totalProducts`, prefix `inventoryValue` with `~` in both the `Inventory` KPI hero (`L372`) and the `Store Inventory Health` footer (`L803`), and display a concise helper note indicating how many products are missing cost prices.

### Finding R3-4 (P2): Interactive Press States, Hit Targets & Breakdown Grid Drill-Down Ergonomics
- **Location:** `src/app/reports.tsx#L463-L508`, `L765-L772`, `L817-L822`, `L872-L879`, `L966-L1040`
- **Issue:**
  - Period segment buttons (`L463–L482`), category tab chips (`L494–L508`), and section header links (`Manage →` at `L765`, `Open Ledger →` at `L817`, `See All →` at `L872`) do not provide visual press feedback (`({ pressed }) => ...`) or `hitSlop` on compact header links.
  - The 4 tiles in `Financial Breakdown` (`Sales`, `Recorded COGS`, `Expenses`, `Unpaid Utang` at `L968–L1039`) are static `<View>` containers; making them tappable to switch to the corresponding report tab (or navigate to `/expenses` for Expenses) makes the summary grid actionable.
- **Recommendation:** Add consistent `pressed` opacity/scale feedback and `hitSlop` to period segments, category chips, and section links, and make the `Financial Breakdown` tiles interactive shortcuts with clear accessibility roles and labels.

---

## 4. Completed vs. Pending Recommendations

| Item ID | Recommendation Summary | Batch | Status |
| :--- | :--- | :---: | :---: |
| **R1-1** | Incomplete product cost transparency (`hasIncompleteCosts`, counts) | R-1 | Completed |
| **R1-2** | Estimated Gross Profit & Net Profit labels (`~₱...`, `Est. *`) | R-1 | Completed |
| **R1-3** | Actionable amber incomplete-cost warning banner (`/products`) | R-1 | Completed |
| **R1-4** | Truthful unavailable-value handling (`null` -> `'—'`) | R-1 | Completed |
| **R1-5** | Full-width interactive Sales Trend chart with bar selection readout | R-1 | Completed |
| **R1-6** | Dedicated Profit & Cost Summary (P&L) breakdown card | R-1 | Completed |
| **R2-1** | Store Inventory Health card on `Inventory` tab | R-2 | Completed |
| **R2-2** | Customer Credit & Collections card on `Utang` tab | R-2 | Completed |
| **R2-3** | Enriched Top Products details (rank, units, % share) & `/products/[id]` navigation | R-2 | Completed |
| **R2-4** | Dedicated initial-load error recovery card (`Try Again`) | R-2 | Completed |
| **R2-5** | Dynamic period header subtitle & `tabular-nums` financial typography | R-2 | Completed |
| **R3-1** | Partial fetch failure isolation (`Promise.allSettled`) & Utang error visibility | **R-3** | **Pending** |
| **R3-2** | Smooth period-switching without full-screen unmount + concurrent refresh guard | **R-3** | **Pending** |
| **R3-3** | Incomplete inventory cost valuation indicator (`~` prefix & helper note) | **R-3** | **Pending** |
| **R3-4** | Interactive press states (`pressed`, `hitSlop`) & actionable Financial Breakdown tiles | **R-3** | **Pending** |

---

## 5. Proposed Batch R-3 Scope

### Objective & Scope
Implement **Batch R-3: Resilience, Smooth Period Switching & Interaction Polish** in `src/app/reports.tsx` to resolve the 4 remaining P1/P2 findings without altering financial formulas, backend RPCs, or theme tokens.

### Confirmed Findings Included in R-3
1. **R3-1 (P1):** Convert `Promise.all` in `loadAnalytics` to `Promise.allSettled` so partial service failures preserve successful domain cards and surface a non-blocking `DashboardErrorBanner` (including when `fetchDashboardUtangSummary` fails).
2. **R3-2 (P1):** Keep existing report cards mounted when switching between `Today`, `This Week`, `This Month`, and `All Time` (using `isPeriodSwitching` visual feedback instead of unmounting into `loadingCard`), and guard `handleRefresh` against concurrent triggers.
3. **R3-3 (P2):** Indicate incomplete inventory cost coverage (`~` prefix and helper note) when `trackedCostProducts < productSummary.totalProducts` on the `Inventory` KPI hero and `Store Inventory Health` card.
4. **R3-4 (P2):** Add `pressed` state styling and `hitSlop` to period segments, category chips, and section links, and make `Financial Breakdown` tiles interactive shortcuts (`Sales` -> `Sales` tab, `Recorded COGS` -> `Profit` tab, `Expenses` -> `/expenses`, `Unpaid Utang` -> `Utang` tab).

### Exact Files Potentially Affected
- `src/app/reports.tsx`

### Acceptance Criteria
- Switching periods (`Today`, `This Week`, `This Month`, `All Time`) after initial load does not unmount existing cards or reset scroll position; a subtle updating state is shown while fetching.
- If any single analytics service fails (including COGS, Expenses, Top Products, or Utang), fulfilled domain metrics still render and `DashboardErrorBanner` appears with a working retry button.
- When some products lack `cost_price`, `Inventory Cost Value` displays a `~` prefix and clarifies partial cost coverage.
- All period segments, category chips, section action links, and Financial Breakdown tiles have clear press feedback and accessibility attributes.
- `npx tsc --noEmit` and `npx eslint src/app/reports.tsx` pass with **0 errors and 0 warnings**.

### Explicit Exclusions
- No changes to Supabase database tables, views, or RPCs.
- No changes to financial calculation services (`src/lib/sales.ts`, `src/lib/expenses.ts`, `src/lib/customers.ts`, `src/lib/products.ts`).
- No new npm dependencies or third-party charting libraries.

---

## 6. Regression Risks

| Risk Area | Potential Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Partial State Updates (`Promise.allSettled`)** | Stale metrics from a previous period could remain visible if a period-dependent fetch (`sales`, `cogs`, `expenses`, `topProducts`) fails during a period switch. | When switching periods, reset period-scoped states (`cogsSummary`, `expenseSummary`, `topProducts`) to `null` / `[]` only for the specific rejected promise so failed period metrics cleanly render `'—'` rather than stale numbers from the prior period. |
| **Initial Load vs. Period Switch State** | Showing partial cards before the very first load completes could flash empty `'—'` values. | Keep `isLoading` true only until the first fetch cycle finishes (when all core summaries are still uninitialized), and use `isPeriodSwitching` for subsequent period changes. |
| **Breakdown Tile Navigation** | Tapping a tile could conflict with expected tab selection vs. route navigation. | Use tab selection (`Sales`, `Profit`, `Utang`) for in-report domains and route navigation (`/expenses`) for `Expenses`, with explicit `accessibilityHint`s. |

---

## 7. Manual Testing Requirements

1. **Smooth Period Switching:**
   - Open Reports & Analytics and wait for initial load.
   - Scroll slightly down and tap `Today` -> `This Week` -> `This Month` -> `All Time`.
   - Verify cards stay mounted (no full-screen skeleton flash or scroll jump) and metrics update smoothly.
2. **Partial Failure & Error Banner Resilience:**
   - Simulate offline mode after initial load and switch periods or pull to refresh.
   - Verify `DashboardErrorBanner` appears at the top with a working retry button.
   - Simulate offline mode before opening Reports & Analytics and verify the full-screen `Unable to load reports` recovery card appears and recovers on `Try Again`.
3. **Incomplete Inventory Cost Indicator:**
   - With at least one product missing `cost_price`, switch to the `Inventory` tab and verify the hero value and `Tracked Cost Value (X/Y)` display the `~` estimate prefix and partial-coverage note.
4. **Interactive Press States & Breakdown Shortcuts:**
   - Tap each tile in `Financial Breakdown` (`Sales`, `Recorded COGS`, `Expenses`, `Unpaid Utang`) and verify `Sales`, `Profit`, and `Utang` switch to their respective tabs while `Expenses` navigates to `/expenses`.
   - Verify press feedback on period segments, category chips, `Manage →`, `Open Ledger →`, and `See All →`.
