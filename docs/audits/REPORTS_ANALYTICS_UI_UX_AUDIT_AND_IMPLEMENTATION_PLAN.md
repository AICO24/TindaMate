# TindaMate — Reports & Analytics (R-0): Comprehensive UI/UX & Functionality Audit and Implementation Plan

**Project:** TindaMate — *Your Digital Tindahan Assistant*  
**Module Audited:** Reports & Analytics (`src/app/reports.tsx` and supporting domain services in `src/lib/*` and `src/types/*`)  
**Audit Date:** November 17, 2026  
**Role:** Senior React Native Engineer, Mobile UI/UX Designer, Financial Dashboard Specialist & QA Architect  
**Task Mode:** Strictly Read-Only Audit & Implementation Planning (Zero application source code files modified)

---

## 1. Executive Summary

### 1.1 Overall Assessment
The TindaMate Reports & Analytics module ([src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx)) is backed by an exceptionally strong, centavo-accurate, Philippine Standard Time (`Asia/Manila` / `UTC+08:00`) data layer:
- `getReportingPeriodRange()` ([src/lib/expenses.ts](file:///c:/TindaMate/src/lib/expenses.ts#L611-L772)) computes exact PHT calendar boundaries for `Today`, `This Week`, `This Month`, and `All Time`.
- `fetchStoreCOGSSummary()` ([src/lib/profit.ts](file:///c:/TindaMate/src/lib/profit.ts#L211-L250)) invokes the store-scoped PostgreSQL RPC `public.get_store_cogs_summary`, returning `revenue`, `cogs`, `grossProfit`, `trackedCostItemCount`, `untrackedCostItemCount`, `untrackedQuantity`, and `hasIncompleteCosts`.
- `computeSalesBuckets()` ([src/lib/chartBuckets.ts](file:///c:/TindaMate/src/lib/chartBuckets.ts#L33-L264)) aggregates chronological PHT sales buckets (`12a/6a/12p/6p` for Today, `Mon..Sun` for This Week, `W1..W5` for This Month, and up to 6 months for All Time).
- `fetchStoreTopProductsForRange()` ([src/lib/sales.ts](file:///c:/TindaMate/src/lib/sales.ts#L1527-L1590)) paginates through `public.sale_items` and ranks top-selling products by actual line-item revenue and units sold.

**However, the UI layer in `src/app/reports.tsx` fails to surface critical financial safety flags and rich domain metrics already returned by these services:**
1. **P0 Financial Transparency Defect:** `src/app/reports.tsx` completely ignores `cogsSummary.hasIncompleteCosts`, `untrackedCostItemCount`, and `trackedCostItemCount`—presenting Gross Profit and Net Profit as exact confirmed figures even when sold items had `cost_price = NULL` (`₱0.00` COGS deducted), and coalescing `null` `cogsSummary` or `utangSummary` into `₱0.00`!
2. **P1 Disconnected Category Tabs:** Tapping the 4 category tabs (`Sales`, `Profit`, `Inventory`, `Utang`) only updates the top-left text of `kpiChartCard` while leaving the chart (`Sales Trend`), `Top Products`, and the 2x2 breakdown grid completely static.
3. **P1 Missing Product Revenue & Units Sold in Top Products:** `TopProductMetric` provides `revenue` and `unitsSold`, but `src/app/reports.tsx` only renders `name` and `sharePercent%`, and tapping a product row navigates generically to `/products` instead of `/products/[id]`.
4. **P1 Cramped Side-by-Side KPI + Bar Chart Layout:** Placing a `30px` Peso amount and a 7-bar chart side-by-side in a single row squeezes bars down to `10px` wide with no Y-axis or tap-to-inspect bar values.

---

## 2. Actual Reports & Analytics Route & Entry Points

- **Route File:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx) (`/reports`), registered in [src/app/_layout.tsx](file:///c:/TindaMate/src/app/_layout.tsx#L117).
- **Navigation Entry Points into `/reports`:**
  1. **Dashboard (`src/app/home.tsx`):**
     - `DashboardKpiRow` Tile 2 (`Gross Profit` / `Est. Profit*`)
     - `SalesOverviewCard` period trigger (`This Week ⌄`)
     - `QuickActionsSection` Tile 4 (`View Reports`)
     - `Store Finances` section header (`Reports ›`) and `profitSummaryCard`
  2. **More Menu (`src/app/more.tsx`):** `"Reports"` menu item.
  3. **Bottom Navigation (`DashboardBottomNav.tsx`):** Resolves `/reports` under the `'more'` active tab ([src/components/dashboard/DashboardBottomNav.tsx](file:///c:/TindaMate/src/components/dashboard/DashboardBottomNav.tsx#L46)).

---

## 3. Files and Components Inspected

| File Path | Lines | Role & Responsibility |
| :--- | :---: | :--- |
| [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx) | 1,000 | Main Reports & Analytics screen (`/reports`) |
| [src/lib/profit.ts](file:///c:/TindaMate/src/lib/profit.ts) | 251 | `fetchStoreCOGSSummary` RPC caller, `computeCOGSSummaryFromItems`, `normalizeCOGSSummaryRow` |
| [src/types/profit.ts](file:///c:/TindaMate/src/types/profit.ts) | 75 | `COGSSummary`, `ReportPeriod`, `ReportingPeriodRange`, Incomplete Cost Safety Rule specification |
| [src/lib/expenses.ts](file:///c:/TindaMate/src/lib/expenses.ts) | 903 | `getReportingPeriodRange` (PHT date/timestamp boundaries), `fetchStoreExpenseSummaryForRange` |
| [src/lib/sales.ts](file:///c:/TindaMate/src/lib/sales.ts) | 1,591 | `fetchStoreSales`, `fetchStoreTopProductsForRange`, `computeTopProductsFromSaleItems` |
| [src/lib/chartBuckets.ts](file:///c:/TindaMate/src/lib/chartBuckets.ts) | 264 | `computeSalesBuckets` (`today` 4x6h, `week` 7d, `month` W1–W5, `all` 1–6m in PHT) |
| [src/lib/pht.ts](file:///c:/TindaMate/src/lib/pht.ts) | 101 | Pure `Asia/Manila` (`UTC+08:00`) calendar extraction helpers |
| [src/lib/customers.ts](file:///c:/TindaMate/src/lib/customers.ts) | 1,026 | `fetchDashboardUtangSummary` (`totalOutstandingUtang`, `customersWithBalanceCount`, `todayPaymentsTotal`) |
| [src/lib/products.ts](file:///c:/TindaMate/src/lib/products.ts) | 610 | `fetchStoreProducts`, `computeStoreProductSummary`, `formatPesoCurrency` |
| [src/constants/theme.ts](file:///c:/TindaMate/src/constants/theme.ts) | 461 | Centralized Design 2.0 tokens (`Colors`, `Spacing`, `BorderRadius`, `Typography`, `Shadows`) |
| [src/components/products/ProductScreenHeader.tsx](file:///c:/TindaMate/src/components/products/ProductScreenHeader.tsx) | 418 | Shared curved deep-green header component |
| [src/components/dashboard/DashboardErrorBanner.tsx](file:///c:/TindaMate/src/components/dashboard/DashboardErrorBanner.tsx) | 161 | Shared error & retry banner component |

---

## 4. Existing Functionality Inventory

| Feature | Current Behavior in `src/app/reports.tsx` | Data Source |
| :--- | :--- | :--- |
| **Period Selector** | 4-segment control (`Today`, `This Week`, `This Month` [default], `All Time`). Switching triggers `loadAnalytics(period, false)`. | `getReportingPeriodRange(period)` |
| **Category Tabs** | 4 horizontal chips (`Sales`, `Profit`, `Inventory`, `Utang`). Currently **only** changes `heroMetric` text on the left side of `kpiChartCard`. | Local `selectedTab` state |
| **Stale Request Guard** | Uses `activeRequestIdRef` ([lines 99, 103, 150](file:///c:/TindaMate/src/app/reports.tsx#L99-L150)) to discard out-of-order responses when switching periods rapidly. | Local `useRef` |
| **Main KPI & Bar Chart Card** | Left column shows `heroMetric` (`amount`, `label`, `badge`); right column shows mini `Sales Trend` vertical bars (`chartBars`). | `computeSalesBuckets` |
| **Top Products Card** | Lists up to 5 top products with thumbnail, product name, `sharePercent%`, and orange progress bar. (Omits `revenue` and `unitsSold`). | `fetchStoreTopProductsForRange` |
| **Breakdown Grid (2x2)** | 4 static tiles: `${periodLabel} Sales`, `Recorded COGS`, `${periodLabel} Expenses`, `Unpaid Utang`. | `sales`, `cogsSummary`, `expenseSummary`, `utangSummary` |
| **Pull-to-Refresh** | `RefreshControl` calling `loadAnalytics(selectedPeriod, true)`. | `loadAnalytics` |

---

## 5. Confirmed Findings and Priorities

### Finding R-1 (P0 — Critical Financial Correctness & Presentation Issue): Incomplete Product Costs (`hasIncompleteCosts`) Are Ignored & Null Summaries Coalesce to `₱0.00`
- **File & Lines:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L137), [L244-L256](file:///c:/TindaMate/src/app/reports.tsx#L244-L256), [L296-L305](file:///c:/TindaMate/src/app/reports.tsx#L296-L305), [L623-L663](file:///c:/TindaMate/src/app/reports.tsx#L623-L663)
- **Description:**
  1. `cogsSummary` (`COGSSummary`) includes `hasIncompleteCosts`, `trackedCostItemCount`, `untrackedCostItemCount`, and `untrackedQuantity` ([src/types/profit.ts](file:///c:/TindaMate/src/types/profit.ts#L18-L40)). `src/app/reports.tsx` never reads any of these fields!
  2. When sold products have `cost_price = NULL`, `grossProfit` (`Revenue - Tracked COGS`) and `netStoreProfit` (`Gross Profit - Expenses`) are overstated because untracked items contribute `₱0.00` to COGS. Yet the `Profit` tab displays them as exact figures without a `~` prefix, `"Estimated"` label, or incomplete-cost warning banner.
  3. Line 245 sets `const totalCOGS = cogsSummary?.cogs ?? 0;`, and line 137 runs `fetchDashboardUtangSummary().catch(() => null)` followed by `const totalUtang = utangSummary?.totalOutstandingUtang ?? 0;` (`line 256`). If `cogsSummary` or `utangSummary` is `null` (unavailable), the UI renders **`₱0.00`** instead of `'—'`!
- **Actual User Impact:** Store owners with unrecorded product cost prices are shown inflated Gross Profit and Net Profit numbers as if they were exact, and network failures on Utang display a false `₱0.00` unpaid balance.
- **Recommended Solution:**
  - Read `hasIncompleteCosts = Boolean(cogsSummary?.hasIncompleteCosts)`.
  - Prefix estimated Gross Profit and Net Store Profit with `~` and label them `"Est. Gross Profit*"` / `"Est. Net Profit*"` whenever `hasIncompleteCosts` is `true`.
  - Render a clear, high-contrast amber warning banner on the `Profit` (and `Sales`) view whenever `hasIncompleteCosts` is `true`, stating: `"${cogsSummary.untrackedCostItemCount} sold line item(s) (${cogsSummary.untrackedQuantity} units) had no recorded cost price in this period. COGS reflects only tracked items, so profit is estimated."` with a 1-tap action to `/products` to update product cost prices.
  - Display `'—'` (not `₱0.00`) when `cogsSummary === null` or `utangSummary === null`.
- **Regression Risk:** None (strictly surfaces existing `COGSSummary` fields and fixes null coalescing).

---

### Finding R-2 (P1 — Significant Usability & Reporting Clarity Issue): Category Tabs (`Sales`, `Profit`, `Inventory`, `Utang`) Do Not Adapt Screen Sections or Surface Net Profit, Inventory Health, or Utang Collections
- **File & Lines:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L295-L345), [L428-L451](file:///c:/TindaMate/src/app/reports.tsx#L428-L451), [L471-L665](file:///c:/TindaMate/src/app/reports.tsx#L471-L665)
- **Description:**
  - Switching between `Sales`, `Profit`, `Inventory`, and `Utang` only changes 3 text lines in `kpiLeftCol`.
  - **Net Store Profit is hidden** unless the user taps `Profit` and squints at the tiny `11px` pill badge (`Net after expenses: ₱...`). There is no Net Profit tile in the Breakdown Grid, nor a Profit & Loss statement card (`Sales Revenue` $\rightarrow$ `- Tracked COGS` $\rightarrow$ `= Gross Profit` $\rightarrow$ `- Operating Expenses` $\rightarrow$ `= Net Profit`).
  - **Inventory metrics already fetched in state (`productSummary` & `products`) are hidden:** `inStockCount`, `lowStockCount`, `outOfStockCount`, and Inventory Cost Value (for items with `cost_price`) are not shown in any breakdown card when `Inventory` is selected.
  - **Utang metrics already fetched in state (`utangSummary`) are incomplete:** `utangSummary.todayPaymentsTotal` (`Collected Today`) and `customersWithBalanceCount` are not shown in the breakdown section, and there is no shortcut to `/customers`.
- **Actual User Impact:** The 4 category tabs feel non-functional because 85% of the screen stays frozen on Sales/Top Products regardless of which tab is selected, and store owners cannot see a clear Profit & Loss breakdown.
- **Recommended Solution:**
  - Make the Breakdown & Detail sections context-aware while keeping the overall screen scannable:
    - **Profit & Loss Summary Card (visible prominently on `Profit` tab and summarized in Breakdown Grid):** Clearly itemizes:
      1. `${periodLabel} Sales Revenue` (`+ ₱...`)
      2. `Tracked Cost of Goods (COGS)` (`- ₱...`, with `${trackedCostItemCount}/${saleItemCount} items tracked`)
      3. `Gross Profit` / `Est. Gross Profit*` (`= ₱...`)
      4. `${periodLabel} Operating Expenses` (`- ₱...`, `${expenseCount} entries`)
      5. **Net Store Profit / Est. Net Profit*** (`= ₱...`, highlighted in green if $\ge 0$ or red if $< 0$).
    - **Inventory Breakdown Card (when `Inventory` tab is active or in Inventory summary):** Shows `Total Products`, `In Stock`, `Low Stock`, `Out of Stock`, `Retail Value`, and `Tracked Cost Value` with a `"Manage Inventory →"` link to `/products`.
    - **Utang & Collections Breakdown Card (when `Utang` tab is active):** Shows `Total Outstanding Utang`, `Customers with Balance`, `Payments Collected Today` (`utangSummary.todayPaymentsTotal`), and a `"Open Customer Ledger →"` link to `/customers`.
- **Regression Risk:** Low — uses data already fetched in `loadAnalytics`.

---

### Finding R-3 (P1 — Significant Usability Issue): `Top Products` Omits Product Revenue, Units Sold, and Direct Product Detail Navigation
- **File & Lines:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L541-L609)
- **Description:**
  - `topProducts` (`TopProductMetric[]`) contains `{ id, name, imageUrl, revenue, unitsSold, sharePercent }`.
  - However, `topProductRow` (`lines 559–605`) only renders `item.name` and `{item.sharePercent}%`! A store owner sees `"Lucky Me Pancit Canton — 35%"` without knowing how many units were sold (`14 sold`) or how much Peso revenue it generated (`₱210.00`).
  - Additionally, tapping a product row calls `router.push('/products')` (`line 562`) instead of opening that product's detail screen (`/products/${item.id}`) when a valid UUID `item.id` exists, and there is no rank badge (`#1`, `#2`, etc.).
- **Actual User Impact:** Store owners cannot see actual Peso revenue or unit volume for their best-selling items.
- **Recommended Solution:**
  - Display rank number (`1`..`5`), product thumbnail, `item.name`, subtitle `${item.unitsSold} ${item.unitsSold === 1 ? 'unit' : 'units'} sold · ${item.sharePercent}% of sales`, and right-aligned `formatPesoCurrency(item.revenue)` in `tabular-nums`.
  - Navigate to `/products/${item.id}` when `item.id` is a valid product ID (or `/products` fallback).
- **Regression Risk:** Low.

---

### Finding R-4 (P1 — Mobile Readability & Chart Usability Issue): Cramped Side-by-Side `kpiChartCard` Layout & Non-Interactive `10px` Chart Bars
- **File & Lines:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L347-L357), [L471-L539](file:///c:/TindaMate/src/app/reports.tsx#L471-L539), [L792-L880](file:///c:/TindaMate/src/app/reports.tsx#L792-L880)
- **Description:**
  - `kpiChartCard` uses `flexDirection: 'row'` (`line 793`), cramming `kpiLeftCol` and `chartCol` side-by-side.
  - Because `chartCol` is squeezed into ~45% of the card width, `barWidth` is forced down to `10px` (`line 355`), there is no Y-axis scale, and users cannot tap a bar (`12a/6a/12p/6p`, `Mon..Sun`, `W1..W5`, `Jun..Nov`) to inspect its exact Peso total!
- **Actual User Impact:** On `320dp–375dp` phones, long Peso amounts (`₱125,450.00`) and badge pills collide with the mini chart, and individual chart bars are too narrow (`10px`) to read or tap.
- **Recommended Solution:**
  - Change `kpiChartCard` to a clean **vertical stack** (`flexDirection: 'column'`):
    - **Top Section:** Full-width Hero KPI header (Label, large `tabular-nums` Amount, and contextual status/net-profit pill).
    - **Bottom Section (Divider + Full-Width Interactive Sales Trend Chart):** Full-width bar chart (`barWidth: 20–28dp`) with interactive tap-to-inspect callout bubbles (`selectedBucketIdx` state, defaulting to the latest bucket) showing the exact `formatPesoCurrency(bucket.amount)` for any tapped time bucket!
- **Regression Risk:** Low — keeps `computeSalesBuckets` 100% untouched while dramatically improving chart legibility and touch targets.

---

### Finding R-5 (P1 — Error & Loading State Flaw): Full Error State Renders Zeroed `₱0.00` Analytics Below Error Banner
- **File & Lines:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L176-L190), [L453-L469](file:///c:/TindaMate/src/app/reports.tsx#L453-L469)
- **Description:**
  - When `loadAnalytics` fails on initial load (`errorMessage !== null` and `cogsSummary === null && sales.length === 0`), `isLoading` becomes `false` (`line 187`).
  - The screen renders `<DashboardErrorBanner>` (`line 454`) and **immediately below it renders all report cards with `₱0.00` sales, `No product sales recorded`, and `₱0.00` breakdown tiles**!
  - Also, when switching `selectedPeriod` (`Today` $\rightarrow$ `This Week`), `loadAnalytics` sets `setIsLoading(true)` (`line 108`), which unmounts the entire report body and replaces it with `loadingCard`, causing a jarring layout jump on every period tap.
- **Actual User Impact:** Network failures look like empty `₱0.00` store history, and switching periods causes full-screen layout jumps.
- **Recommended Solution:**
  - When `errorMessage && !cogsSummary && sales.length === 0 && products.length === 0`, render a dedicated **"Could Not Load Store Reports"** error recovery card with `WarningTriangleIcon` and a `"Retry Loading"` primary `TindaMateButton` (matching `ProductsListScreen` and `CustomersListScreen`).
  - Keep `DashboardErrorBanner` at the top when refreshing/switching periods with existing data already in state.
- **Regression Risk:** None.

---

### Finding R-6 (P2 — Header & Design System Compliance): Duplicate `heroHeaderZone` Wrapper, Dead `leftIcon`, Missing `tabular-nums`, and Unused `ActivityIndicator`
- **File & Lines:** [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L3), [L363-L383](file:///c:/TindaMate/src/app/reports.tsx#L363-L383), [L690-L696](file:///c:/TindaMate/src/app/reports.tsx#L690-L696), [L809-L814](file:///c:/TindaMate/src/app/reports.tsx#L809-L814), [L951-L955](file:///c:/TindaMate/src/app/reports.tsx#L951-L955), [L990-L994](file:///c:/TindaMate/src/app/reports.tsx#L990-L994)
- **Description:**
  1. Line 3 imports `ActivityIndicator` but never uses it (`@typescript-eslint/no-unused-vars` warning).
  2. Lines 363–383 wrap `ProductScreenHeader` inside `<View style={styles.heroHeaderZone}>` (duplicate curved green container) and pass `showBack={true}` alongside `leftIcon={<TrendChartVectorIcon />}` (which `ProductScreenHeader` ignores when `showBack={true}`). Also, no `subtitle` is passed to `ProductScreenHeader`.
  3. `kpiBigAmount` (`line 809`), `topProductShare` (`line 951`), and `breakdownValue` (`line 990`) all omit `fontVariant: ['tabular-nums']`, and `breakdownValue` lacks `adjustsFontSizeToFit` / `numberOfLines={1}` for large Peso figures on `320dp` screens.
- **Recommended Solution:**
  - Remove unused `ActivityIndicator` import and redundant `heroHeaderZone` wrapper.
  - Pass `subtitle={`${periodLabel} store performance & profit`}` to `ProductScreenHeader`.
  - Add `fontVariant: ['tabular-nums']`, `numberOfLines={1}`, and `adjustsFontSizeToFit` to all monetary and percentage text styles.
- **Regression Risk:** None.

---

## 6. Financial Correctness & Presentation Review

| Metric | Underlying Calculation / Source | Audit Verdict on Calculation | Audit Verdict on Current UI Presentation |
| :--- | :--- | :--- | :--- |
| **Period Boundaries** | `getReportingPeriodRange(period)` ([src/lib/expenses.ts](file:///c:/TindaMate/src/lib/expenses.ts#L611-L772)) | **Verified Correct:** Uses `Asia/Manila` (`UTC+08:00`) start-inclusive / end-exclusive ISO timestamps for `sales` and `sale_items`, and inclusive `YYYY-MM-DD` dates for `expenses`. | **Good:** Period selector cleanly switches between `Today`, `This Week`, `This Month`, and `All Time`. |
| **Sales Revenue** | `totalSalesAmount` ([src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L231-L237)) & `cogsSummary.revenue` | **Verified Correct:** Sums `sale.total_amount` for in-range sales. | **Needs `tabular-nums`** on `kpiBigAmount` and `breakdownValue`. |
| **Tracked vs. Untracked COGS** | `fetchStoreCOGSSummary` (`public.get_store_cogs_summary` RPC, [src/lib/profit.ts](file:///c:/TindaMate/src/lib/profit.ts#L211-L250)) | **Verified Correct:** Never fabricates `0` for `NULL` cost prices; tracks `trackedCostItemCount`, `untrackedCostItemCount`, and `hasIncompleteCosts`. | **P0 Defect in UI:** `reports.tsx` ignores `hasIncompleteCosts` and `untrackedCostItemCount`, and coalesces `null` `cogsSummary` to `₱0.00`. |
| **Gross Profit** | `cogsSummary.grossProfit` (`Revenue - Tracked COGS`) | **Verified Correct** in service/RPC. | **P0 Defect in UI:** Displayed as exact `"Gross Profit"` even when `hasIncompleteCosts === true` (must be `"Est. Gross Profit*"` with `~` prefix and warning banner). |
| **Operating Expenses** | `fetchStoreExpenseSummaryForRange` ([src/lib/expenses.ts](file:///c:/TindaMate/src/lib/expenses.ts#L841-L900)) | **Verified Correct:** Paginates in chunks of 1,000 and sums in integer centavos. | **Good:** Shows `'—'` when `null` and entry count in caption. |
| **Net Store Profit** | `netStoreProfit` (`grossProfit - totalExpenses` in centavos, [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx#L248-L255)) | **Verified Correct:** Integer-centavo subtraction; returns `null` if either input is `null`. | **P1 Defect in UI:** Hidden on 3 of 4 tabs (only shown inside a small pill on the `Profit` tab) and not marked as estimated when `hasIncompleteCosts === true`. |
| **Customer Utang** | `fetchDashboardUtangSummary` ([src/lib/customers.ts](file:///c:/TindaMate/src/lib/customers.ts#L952-L1024)) | **Verified Correct:** Sums open balances from `customer_credit_summaries` and today's payments from `credit_transactions`. | **P1 Defect in UI:** `.catch(() => null)` coalesces to `₱0.00` on failure instead of `'—'`, and `todayPaymentsTotal` is hidden. |

---

## 7. Loading, Empty, and Error-State Review

1. **Initial Loading:** Renders `TindaMateLoadingView` inside `styles.loadingCard` (`lines 461–467`). Clean and consistent.
2. **Full Fetch Error:** Currently renders `DashboardErrorBanner` *above* zeroed `₱0.00` report cards (`lines 453–666`). Should render a dedicated `"Could Not Load Store Reports"` error state card with a `"Retry Loading"` button when no data is loaded, and only show `DashboardErrorBanner` when refreshing existing data.
3. **Empty Period Sales:** `isChartEmpty` shows `"No sales in this period"` (`line 534`), and `topProducts.length === 0` shows `"No product sales recorded for this period yet."` (`line 554`).

---

## 8. Responsive and Accessibility Review

- **Narrow Android Screens (`320dp–360dp`):**
  - `kpiChartCard` (`flexDirection: 'row'`) squeezes the hero amount and 7-bar chart horizontally. Converting `kpiChartCard` to a vertical stack (`flexDirection: 'column'`) gives both the hero KPI and the bar chart `100%` of the card width.
  - `breakdownTile` (`width: '48.4%'`) needs `numberOfLines={1}` and `adjustsFontSizeToFit` on `breakdownValue` so 6-figure Peso totals never wrap or clip.
- **Touch Targets & Accessibility:**
  - Period segment buttons and category tabs have `accessibilityRole` and `accessibilityState={{ selected }}`.
  - Chart bars in `kpiChartCard` are currently non-interactive `10px` `View`s with no `accessibilityLabel` for screen readers (`Mon: ₱1,200.00`). Making each bar a wide, accessible `Pressable` with a tap-to-inspect callout bubble solves both screen-reader accessibility and visual inspection.

---

## 9. Proposed Implementation Batches

Since all Reports & Analytics UI lives in a single self-contained route file ([src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx)), the improvements are structured into **2 focused, sequential batches** (or can be executed together upon approval):

---

### Batch R-1 — Financial Transparency (`hasIncompleteCosts`), P&L Statement Card & Full-Width Interactive Chart

1. **Scope:** Resolve the P0 incomplete-cost transparency defect, fix null coalescing on COGS/Utang, convert `kpiChartCard` from a cramped horizontal row to a full-width stacked Hero KPI + Interactive Bar Chart with tap-to-inspect callouts, and add the **Profit & Loss Statement Card** (Revenue, Tracked COGS, Gross Profit, Operating Expenses, and Net Store Profit).
2. **Specific Files Involved:**
   - [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx)
3. **Key Improvements:**
   - Read `hasIncompleteCosts = Boolean(cogsSummary?.hasIncompleteCosts)`, `trackedCostItemCount`, `untrackedCostItemCount`, and `untrackedQuantity`.
   - Prefix estimated Gross Profit and Net Store Profit with `~` and label them `"Est. Gross Profit*"` / `"Est. Net Profit*"` when `hasIncompleteCosts` is `true`.
   - Display a clear amber **Incomplete Cost Warning Banner** (linking to `/products`) whenever `hasIncompleteCosts` is `true`.
   - Fix `totalCOGS` and `totalUtang` so `null` (`cogsSummary === null` or `utangSummary === null`) displays `'—'` rather than `₱0.00`.
   - Stack the Hero KPI header above the full-width `Sales Trend` chart inside `kpiChartCard`, with interactive bar selection (`selectedBarIdx`) showing a callout pill (`e.g., Wed: ₱1,450.00`) above the selected/latest bar.
   - Add a **Profit & Cost Summary Card** showing the complete equation: `Sales Revenue` $\rightarrow$ `- Tracked COGS` $\rightarrow$ `= Gross Profit` $\rightarrow$ `- Operating Expenses` $\rightarrow$ `= Net Store Profit`.
4. **Acceptance Criteria:**
   - When `hasIncompleteCosts` is `true`, Gross Profit and Net Profit are clearly marked as estimated (`~` + `*`) and the incomplete-cost warning banner is visible.
   - When `cogsSummary` or `utangSummary` is `null`, their values render as `'—'`, never `₱0.00`.
   - The Sales Trend chart spans the full width of `kpiChartCard` with tap-to-inspect bar callouts and accessible labels.
5. **Manual Testing Checklist:**
   - [ ] Switch across `Today`, `This Week`, `This Month`, and `All Time` and verify the full-width chart buckets and callout values update accurately.
   - [ ] Verify that if any sold item in the period lacked a `cost_price`, the amber incomplete-cost warning banner and `~` estimated profit labels appear.
   - [ ] Verify the Profit & Cost Summary Card accurately displays Sales Revenue, Tracked COGS, Gross Profit, Expenses, and Net Store Profit.
6. **Dependencies:** None.

---

### Batch R-2 — Tab-Aware Breakdown Sections (Inventory & Utang), Top Products Revenue/Units & Error/Header Polish

1. **Scope:** Enrich `Top Products` with Peso revenue, units sold, rank badges, and direct `/products/[id]` navigation; add context-aware Inventory and Utang breakdown cards when those tabs are selected; fix the initial load error state card; and clean up the header, `tabular-nums`, and unused imports.
2. **Specific Files Involved:**
   - [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx)
3. **Key Improvements:**
   - **Top Products Enhancement:** Display rank badge (`#1`..`#5`), product name, `${item.unitsSold} sold · ${item.sharePercent}%`, and right-aligned `formatPesoCurrency(item.revenue)` (`tabular-nums`), navigating to `/products/${item.id}` on tap.
   - **Tab-Aware Detail Cards:**
     - When `selectedTab === 'Inventory'`, highlight Inventory health metrics (`Total Products`, `In Stock`, `Low Stock`, `Out of Stock`, `Inventory Retail Value`, and a `"Manage Inventory →"` CTA to `/products`).
     - When `selectedTab === 'Utang'`, highlight Utang & Collection metrics (`Total Outstanding Utang`, `Customers with Balance`, `Collected Today` from `utangSummary.todayPaymentsTotal`, and an `"Open Customer Ledger →"` CTA to `/customers`).
   - **Error State & Header Polish:**
     - Render a dedicated `"Could Not Load Store Reports"` card with `"Retry Loading"` when initial fetch fails (`errorMessage && !cogsSummary && sales.length === 0`).
     - Remove the duplicate `heroHeaderZone` wrapper, pass a dynamic `subtitle` to `ProductScreenHeader`, remove the unused `ActivityIndicator` import, and add `fontVariant: ['tabular-nums']` + `adjustsFontSizeToFit` to all financial values.
4. **Acceptance Criteria:**
   - Every row in `Top Products` displays units sold, percentage share, and Peso revenue in `tabular-nums`.
   - Selecting `Profit`, `Inventory`, or `Utang` surfaces relevant domain breakdown cards and action links.
   - `npx tsc --noEmit` and `npx eslint src/app/reports.tsx` pass with **0 errors and 0 warnings**.
5. **Manual Testing Checklist:**
   - [ ] Tap each category tab (`Sales`, `Profit`, `Inventory`, `Utang`) and verify context-appropriate breakdown cards and action links appear.
   - [ ] Tap a product in `Top Products` and verify it opens `/products/[id]`.
   - [ ] Test offline initial load and verify the `"Could Not Load Store Reports"` retry card appears instead of `₱0.00` cards.
6. **Dependencies:** Batch R-1.

---

## 10. Files Potentially Affected by Each Batch

| File Path | Batch R-1 | Batch R-2 | Protected Files (Zero Modifications Allowed) |
| :--- | :---: | :---: | :--- |
| [src/app/reports.tsx](file:///c:/TindaMate/src/app/reports.tsx) | **Yes** | **Yes** | `src/lib/profit.ts`, `src/types/profit.ts`, `src/lib/expenses.ts`, `src/lib/sales.ts`, `src/lib/customers.ts`, `src/lib/products.ts`, `src/lib/chartBuckets.ts`, `src/lib/pht.ts`, `src/constants/theme.ts`, `supabase/migrations/*` |

---

## 11. Regression Risks & Mitigations

| Risk Area | Potential Regression | Mitigation Strategy |
| :--- | :--- | :--- |
| **Rapid Period Switching** | Out-of-order network responses overwriting newer period state. | Preserve the existing `activeRequestIdRef` guard in `loadAnalytics` (`lines 99–190`). |
| **Selected Chart Bar Index Out of Bounds** | Switching from `This Week` (7 bars) to `Today` (4 bars) when `selectedBarIdx === 6`. | Reset `selectedBarIdx` to `null` (defaulting to the last bar) whenever `selectedPeriod` changes. |
| **Product Navigation from Top Products** | Historical `sale_items` with a deleted product or fallback name key instead of a UUID. | Check `/^[0-9a-f]{8}-/i.test(item.id)` before routing to `/products/${item.id}`; otherwise fall back to `/products`. |

---

## 12. Manual Testing Strategy

1. **Period Boundary & PHT Verification:** Test `Today`, `This Week`, `This Month`, and `All Time` filters and verify sales totals, expense counts, COGS, and chart bucket labels match store records.
2. **Incomplete Cost Safety Verification:** Test with a period containing a sold product whose `cost_price` was `NULL` and verify `~` prefixes, `"Est. Gross Profit*"` / `"Est. Net Profit*"` labels, and the amber warning banner.
3. **Interactive Chart & Tab Verification:** Tap individual chart bars across all 4 periods to verify callout amounts, and switch across `Sales`, `Profit`, `Inventory`, and `Utang` tabs.
4. **Top Products Verification:** Verify units sold, Peso revenue, `%` share, and tap-through to Product Details.

---

## 13. Explicit List of Protected Financial Logic and Functionality

The following files and functions **must remain 100% untouched** during implementation:
- `src/lib/profit.ts`: `fetchStoreCOGSSummary`, `computeCOGSSummaryFromItems`, `calculateItemCOGS`, `normalizeCOGSSummaryRow`
- `src/lib/expenses.ts`: `getReportingPeriodRange`, `fetchStoreExpenseSummaryForRange`, `computeExpenseSummaryFromList`
- `src/lib/sales.ts`: `fetchStoreSales`, `fetchStoreTopProductsForRange`, `computeTopProductsFromSaleItems`
- `src/lib/chartBuckets.ts`: `computeSalesBuckets`
- `src/lib/pht.ts`: `getPHTParts`, `getPHTDateKey`, `toPHTMillis`
- `src/lib/customers.ts`: `fetchDashboardUtangSummary`
- `src/lib/products.ts`: `fetchStoreProducts`, `computeStoreProductSummary`, `formatPesoCurrency`
- `src/constants/theme.ts` and all Supabase migrations/RPCs.
