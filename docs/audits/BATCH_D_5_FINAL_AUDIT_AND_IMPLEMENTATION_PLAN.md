# TindaMate — Batch D-5: Dashboard Final Audit & Implementation Plan

**Document Date:** November 17, 2026  
**Project Directory:** `C:\TindaMate`  
**Audit Scope:** Strictly Read-Only Final QA & UX Audit of Dashboard (`/home` and `src/components/dashboard/*`) following Batches D-1 through D-4  
**Status:** Read-Only Audit Complete — Awaiting User Approval Before Implementing Batch D-5  

---

## 1. Executive Summary

Following the successful implementation and manual testing of Batches D-1 (Financial Accuracy & Profit/COGS Transparency), D-2 (Quick Actions, Recent Activity & Card Polish), D-3 (Header Personalization & PHT Greeting), and D-4 (Interaction & Accessibility Refinements), the TindaMate Dashboard is substantially cleaner, financially truthful, and responsive.

This final read-only QA audit inspected `src/app/home.tsx`, every component in `src/components/dashboard/`, and `src/constants/theme.ts` to identify any remaining gaps in **partial error visibility, loading/empty states, modal safe-area insets, narrow-screen chart ergonomics, and render performance**.

The audit identified **6 remaining actionable findings** (**3 P1** and **3 P2**) that can be cleanly resolved in Batch D-5 without touching any Supabase queries, RPCs, financial calculations, or design tokens.

---

## 2. Files and Components Inspected

| File Path | Inspected Scope |
| :--- | :--- |
| [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx) | Full file (1,497 lines): session handling, `loadDashboardData`, `handleRefresh`, `weeklyBuckets`, `todayNetProfit`, modals, styles |
| [src/components/dashboard/DashboardErrorBanner.tsx](file:///c:/TindaMate/src/components/dashboard/DashboardErrorBanner.tsx) | Full file (161 lines): error alert banner, retry and dismiss controls |
| [src/components/dashboard/RecentActivitySection.tsx](file:///c:/TindaMate/src/components/dashboard/RecentActivitySection.tsx) | Full file (313 lines): props (`isLoading`), 3-row sales feed, empty state |
| [src/components/dashboard/SalesOverviewCard.tsx](file:///c:/TindaMate/src/components/dashboard/SalesOverviewCard.tsx) | Full file (365 lines): weekly bar chart, Y-axis, bar widths, callout bubble, empty-week state |
| [src/components/dashboard/TodaySalesCard.tsx](file:///c:/TindaMate/src/components/dashboard/TodaySalesCard.tsx) | Full file (205 lines): hero sales card, press/hover states |
| [src/components/dashboard/DashboardKpiRow.tsx](file:///c:/TindaMate/src/components/dashboard/DashboardKpiRow.tsx) | Full file (187 lines): 3-tile KPI strip |
| [src/components/dashboard/LowStockAlert.tsx](file:///c:/TindaMate/src/components/dashboard/LowStockAlert.tsx) | Full file (157 lines): conditional stock alert banner |
| [src/components/dashboard/QuickActionsSection.tsx](file:///c:/TindaMate/src/components/dashboard/QuickActionsSection.tsx) & [QuickActionTile.tsx](file:///c:/TindaMate/src/components/dashboard/QuickActionTile.tsx) | Full files: 4-tile shortcut strip |
| [src/components/dashboard/UtangOverviewCard.tsx](file:///c:/TindaMate/src/components/dashboard/UtangOverviewCard.tsx) & [ExpenseOverviewCard.tsx](file:///c:/TindaMate/src/components/dashboard/ExpenseOverviewCard.tsx) | Full files: compact & full financial cards |
| [src/components/dashboard/DashboardHeader.tsx](file:///c:/TindaMate/src/components/dashboard/DashboardHeader.tsx), [DashboardHeroBanner.tsx](file:///c:/TindaMate/src/components/dashboard/DashboardHeroBanner.tsx), [HeaderWaveBackground.tsx](file:///c:/TindaMate/src/components/dashboard/HeaderWaveBackground.tsx) | Full files: header canopy, PHT greeting, dynamic store pill |
| [src/constants/theme.ts](file:///c:/TindaMate/src/constants/theme.ts) | Full file (461 lines): Design 2.0 tokens |
| [docs/audits/DASHBOARD_UI_UX_AUDIT_AND_IMPLEMENTATION_PLAN.md](file:///c:/TindaMate/docs/audits/DASHBOARD_UI_UX_AUDIT_AND_IMPLEMENTATION_PLAN.md) & [docs/audits/BATCH_D_4_IMPLEMENTATION_REPORT.md](file:///c:/TindaMate/docs/audits/BATCH_D_4_IMPLEMENTATION_REPORT.md) | Prior audit and D-4 completion record |

---

## 3. Remaining Audit Findings (Evidence-Based)

### Finding 1 — Silent Partial Failures for Sales, Inventory & COGS + Stale `errorMessage` on Focus Reload
- **Priority:** **P1 (Significant Usability & Data Transparency Issue)**
- **Location:** [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx#L144-L275)
- **Code Evidence:**
  - `loadDashboardData()` only sets `errorMessage` when **all four** of `productRes`, `salesRes`, `utangRes`, and `expenseRes` are rejected simultaneously (`lines 256–267`).
  - If `salesRes` (`fetchDashboardSalesData`) fails while `productRes` succeeds, `TodaySalesCard` silently renders `₱0.00` and `RecentActivitySection` renders `"No sales recorded yet"` with **no error banner**.
  - If `cogsRes` (`fetchStoreCOGSSummary`) fails (`lines 226–230`), `todayCogsSummary` is set to `null`, causing `DashboardKpiRow` and `profitSummaryCard` to display `'—'` with **no explanation or retry prompt**.
  - `loadDashboardData()` does not clear `setErrorMessage(null)` at the start of a focus reload (`useFocusEffect`), meaning an error banner from a failed refresh persists even after returning to `/home` and succeeding.
- **User Impact:** Store owners may misinterpret a partial network failure as `₱0.00` in today's sales or broken profit metrics.

### Finding 2 — Unused `isLoading` Prop in `RecentActivitySection` (No Refresh Skeleton State)
- **Priority:** **P1 (Significant Loading State Gap)**
- **Location:** [src/components/dashboard/RecentActivitySection.tsx](file:///c:/TindaMate/src/components/dashboard/RecentActivitySection.tsx#L22), [L41-L47](file:///c:/TindaMate/src/components/dashboard/RecentActivitySection.tsx#L41-L47), and [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx#L906)
- **Code Evidence:**
  - `RecentActivitySectionProps` declares `isLoading?: boolean` and `home.tsx` passes `isLoading={isCardLoading}`, yet `RecentActivitySection` never destructures or renders `isLoading`.
  - During pull-to-refresh (`isCardLoading = true`), `UtangOverviewCard` and `ExpenseOverviewCard` show skeleton placeholders, while `RecentActivitySection` shows stale data or `"No sales recorded yet"`.
- **User Impact:** Inconsistent loading feedback across adjacent Dashboard sections during refresh.

### Finding 3 — `SalesOverviewCard` Empty-Week State & Narrow-Screen Bar Spacing
- **Priority:** **P1 (Usability & Responsive Layout)**
- **Location:** [src/components/dashboard/SalesOverviewCard.tsx](file:///c:/TindaMate/src/components/dashboard/SalesOverviewCard.tsx#L115-L185), [L325-L327](file:///c:/TindaMate/src/components/dashboard/SalesOverviewCard.tsx#L325-L327)
- **Code Evidence:**
  - When all 7 days of the current week have `amount === 0`, `SalesOverviewCard` renders 7 tiny `2px` bars with a `₱0` callout bubble floating over Today, without any quiet helper message indicating the week has no recorded sales yet.
  - `barFill` has a hardcoded `width: 24` (`line 326`) regardless of viewport width; on `320dp` Android devices, 7 bars at `24dp` (`168dp`) plus Y-axis (`22dp`), gap, and card padding leave minimal breathing room.
- **User Impact:** Empty weeks look slightly ambiguous, and `320dp` devices have tighter bar spacing.

### Finding 4 — Store Account Modal Lacks Bottom Safe-Area Inset Padding
- **Priority:** **P2 (Responsive Layout & Safe Area)**
- **Location:** [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx#L1075-L1203), [L1277-L1283](file:///c:/TindaMate/src/app/home.tsx#L1277-L1283)
- **Code Evidence:**
  - `styles.modalCard` uses fixed `padding: Spacing.four` (`24px`) at the bottom without accounting for `insets.bottom`.
- **User Impact:** On gesture-navigation Android devices and modern iPhones, the `"Log Out of Account"` button sits close to the system gesture bar.

### Finding 5 — Unmemoized Chart Bucketing & Quick Actions Array in `home.tsx`
- **Priority:** **P2 (Performance Optimization)**
- **Location:** [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx#L549-L698)
- **Code Evidence:**
  - `getReportingPeriodRange('week')`, `computeSalesBuckets(...)`, `weeklyBars`, `maxWeeklyAmount`, and `quickActions` execute directly in the component render body on every state update (e.g., opening/closing the Store Account modal or toggling `isRefreshing`).
- **User Impact:** Unnecessary CPU work during modal opens/closes and refresh state transitions.

### Finding 6 — `profitSummaryCard` Missing Skeleton/Refreshing Indicator & Explicit COGS Unavailable Hint
- **Priority:** **P2 (Visual Polish & Loading Consistency)**
- **Location:** [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx#L945-L1031)
- **Code Evidence:**
  - When `todayCogsSummary === null` (e.g., `fetchStoreCOGSSummary` failed) in Authenticated mode, `profitSummaryCard` shows `'—'` across Net Profit, Tracked COGS, and Gross Profit without a subtle inline note explaining that today's COGS/profit data is temporarily unavailable.
- **User Impact:** Clearer distinction between `₱0.00` profit and temporarily unavailable COGS/profit data.

---

## 4. Explicit List of Completed D-1 through D-4 Improvements (Do Not Repeat)

The following improvements are already verified in the codebase and **must not** be duplicated or regressed in D-5:
- **D-1:** PHT `todayRange` COGS query, removal of revenue-as-profit fallback, Monday comparison fix, `DashboardKpiRow` labels (`Week's Sales`, `Gross Profit`/`Est. Profit*`, `Stock Alerts`), combined `LowStockAlert` counts, `Store Finances` section + `profitSummaryCard` + incomplete-cost warning, `ExpenseOverviewCard` icon & `"Today's Expenses"` label, `UtangOverviewCard` `+{paymentsLabel} today`.
- **D-2:** Direct `QuickActionsSection` routes (`/sales`, `/products/add`, `/expenses/add`, `/reports`), `RecentActivitySection` 3-row feed with item count and Utang customer context, removal of `#000000` hover borders, `tabular-nums` on KPI values.
- **D-3:** PHT greeting in `DashboardHeroBanner`, dynamic `storeName` in status pill, tightened `FadeInDown` delays (`40ms–220ms`), `Colors.backgroundWarm` loading background.
- **D-4:** `if (isRefreshing) return;` guard in `handleRefresh`, Store Account modal `storeName` display & close press feedback, tactile scale press states across cards, honest `accessibilityLabel`/`accessibilityHint`/`accessibilityState` attributes.

---

## 5. Recommendations for Batch D-5 Implementation

1. **Surface Partial Fetch Failures & Clear Stale `errorMessage` ([src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx)):**
   - Clear `setErrorMessage(null)` at the start of `loadDashboardData()` in authenticated mode.
   - Track `cogsError: string | null` and `coreLoadError` (if `salesRes` or `productRes` fails, set `errorMessage` so `DashboardErrorBanner` appears with `Retry` instead of silently showing `₱0.00` sales!).
   - In `profitSummaryCard`, if `cogsError` is set (and `!isGuestMode`), render a compact inline notice (`"Profit & COGS data unavailable — pull down or tap Retry above."`).
2. **Implement Skeleton State in `RecentActivitySection` ([src/components/dashboard/RecentActivitySection.tsx](file:///c:/TindaMate/src/components/dashboard/RecentActivitySection.tsx)):**
   - Destructure `isLoading = false` and render 2–3 clean skeleton pill rows when `isLoading && !hasSales` (matching `UtangOverviewCard` / `ExpenseOverviewCard` skeleton styling).
3. **Polish `SalesOverviewCard` Empty-Week & Narrow-Screen Bar Width ([src/components/dashboard/SalesOverviewCard.tsx](file:///c:/TindaMate/src/components/dashboard/SalesOverviewCard.tsx)):**
   - Use `useWindowDimensions()` to scale `barFill` width (`18dp` when `windowWidth < 360`, `24dp` otherwise).
   - When all 7 `weeklyBars` have `amount === 0`, display a subtle caption below the chart (`"No sales recorded this week yet"`).
4. **Add Bottom Safe-Area Inset to Store Account Modal ([src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx)):**
   - Apply `paddingBottom: Math.max(Spacing.four, insets.bottom + Spacing.three)` to `styles.modalCard`.
5. **Memoize Weekly Chart Buckets & Quick Actions ([src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx)):**
   - Wrap `weeklyBars` / `maxWeeklyAmount` / `salesComparisonLabel` in `useMemo` keyed on `[allStoreSales, todaySalesSummary.totalAmount, todaySalesSummary.transactionCount]`, and `quickActions` in `useMemo` keyed on `[isGuestMode]`.

---

## 6. Proposed Files to Modify

| File Path | Planned D-5 Changes |
| :--- | :--- |
| [src/app/home.tsx](file:///c:/TindaMate/src/app/home.tsx) | Clear `errorMessage` on load, surface `salesRes`/`productRes` partial errors in `DashboardErrorBanner`, track `cogsError` for `profitSummaryCard` unavailable hint, add `insets.bottom` to Store Account modal, memoize `weeklyBars` and `quickActions`. |
| [src/components/dashboard/RecentActivitySection.tsx](file:///c:/TindaMate/src/components/dashboard/RecentActivitySection.tsx) | Wire `isLoading` prop to render compact skeleton rows during initial/refresh loading when no rows are cached. |
| [src/components/dashboard/SalesOverviewCard.tsx](file:///c:/TindaMate/src/components/dashboard/SalesOverviewCard.tsx) | Responsive `barFill` width (`18dp` on `<360dp` phones) and subtle `"No sales recorded this week yet"` caption when all weekly bars are zero. |

---

## 7. Technical and Regression Risks

| Risk | Mitigation |
| :--- | :--- |
| **`useMemo` Stale Date Across Midnight** | `allStoreSales` and `todaySalesSummary` refresh on `useFocusEffect` and `handleRefresh`, which updates `useMemo` dependencies automatically. |
| **Partial Error Banner Noise** | Only trigger `errorMessage` for core `salesRes` or `productRes` failures (or `allSalesRes`), while keeping `utangError` and `expenseError` isolated inside their own cards and `cogsError` inside `profitSummaryCard`. |

---

## 8. Manual Testing Checklist for Batch D-5

- [ ] Simulate offline/network error on `/home` and verify `DashboardErrorBanner` appears with `Retry` (never showing silent `₱0.00` sales without a warning), then reconnect and tap `Retry` to verify the banner clears.
- [ ] Pull-to-refresh on `/home` and verify `RecentActivitySection` renders skeleton rows smoothly when no cached sales exist.
- [ ] View `SalesOverviewCard` with zero sales for the week and verify the `"No sales recorded this week yet"` caption; check on a narrow (`<360dp`) screen that bars fit comfortably.
- [ ] Open the Store Account modal on a device with bottom gesture navigation and verify `"Log Out of Account"` has comfortable bottom safe-area clearance.
- [ ] Verify Guest Mode (`?guest=1`) still renders `₱0.00` cleanly without error banners.

---

## 9. Implementation Acceptance Criteria

1. `npx tsc --noEmit` passes with **0 errors**.
2. `npx eslint` on all modified files passes with **0 errors**.
3. Zero changes to Supabase queries, RPCs, financial calculations, auth/session logic, or `src/constants/theme.ts`.
4. All 6 findings (P1 & P2) are resolved cleanly without duplicating D-1 through D-4 work.
