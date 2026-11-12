# TindaMate — Batch 10B-4: Sales Trend Chart Read-Only Audit

**Document Date:** November 12, 2026  
**Auditor:** Senior React Native, TypeScript, Supabase & Financial Data Visualization Engineer  
**Audit Scope:** STRICTLY READ-ONLY audit of the Sales Trend Chart in `src/app/reports.tsx`  
**Current Branch:** `main` (Checkpoint `27ef59f`)  
**Status:** Audit Complete — Actionable Defects Identified

---

## 1. Executive Summary

This audit evaluates the current implementation of the **Sales Trend Chart** rendered on the Reports screen (`src/app/reports.tsx`). 

Following the successful completion of Batch 10B-1 (Expense Period Synchronization), Batch 10B-2 (Top Products Aggregation Correction), and Batch 10B-3 (Reports Date Range Filters), the Reports screen now supports four active reporting periods: `Today`, `This Week`, `This Month`, and `All Time`.

The audit revealed that the current chart implementation is **fundamentally flawed and misleading**:
1. **Critical Data Fabrication:** When `sales.length === 0` (e.g. on initial store creation, on a day with no transactions, or on a network error), the chart returns a hardcoded ascending array `[0.3, 0.45, 0.6, 0.78, 0.95]`, displaying an artificial upward sales trend to the store owner.
2. **Modulo Round-Robin Indexing:** When sales exist, transactions are assigned to 5 bars using `idx % 5` on the descending array. Transactions from completely different days or weeks are merged together based solely on their position in the array. Timestamps and calendar dates are completely ignored.
3. **Zero Philippine Timezone Awareness:** `sale.created_at` is never parsed or converted to Philippine Standard Time (`Asia/Manila` / UTC+08:00).
4. **Artificial Minimum Bar Height:** Buckets with zero sales are clamped to `Math.max(0.24, ...)`, causing empty intervals to appear at 24% of maximum sales volume.
5. **No Visual Context or Labels:** The chart renders 5 unlabeled vertical green bars regardless of whether the user selects `Today`, `This Week`, `This Month`, or `All Time`.

---

## 2. Exact Files & Functions Inspected

| File Path | Function / Block Inspected | Lines |
| :--- | :--- | :--- |
| `src/app/reports.tsx` | `chartBars` `useMemo` computation | Lines 257–268 |
| `src/app/reports.tsx` | `kpiChartCard` & `barChartWrap` rendering | Lines 449–485 |
| `src/app/reports.tsx` | `styles.barChartWrap`, `styles.verticalBar` | Lines 779–789 |
| `src/lib/sales.ts` | `fetchStoreSales` | Lines 1046–1084 |
| `src/lib/expenses.ts` | `getReportingPeriodRange` | Lines 645–772 |
| `src/types/profit.ts` | `ReportPeriod`, `ReportingPeriodRange` | Lines 35–58 |
| `src/app/home.tsx` | Dashboard `weeklyBars` aggregation comparison | Lines 540–615 |
| `src/components/dashboard/SalesOverviewCard.tsx` | Dashboard 7-bar chart implementation | Lines 1–105 |

---

## 3. Current Sales Trend Chart Architecture

The chart on the Reports screen is rendered inside the primary KPI card (`kpiChartCard`), to the right of the large hero metric.

### 3.1 Data Flow & State Binding
1. `loadAnalytics(period)` fetches sales for the selected period range via `fetchStoreSales(startTimestampISO, endTimestampISO)`.
2. `fetchStoreSales` returns `Sale[]` sorted by `created_at DESC` (newest first).
3. `chartBars` is computed as a 5-element number array representing normalized bar ratios between `0.24` and `1.0`.
4. In JSX (`src/app/reports.tsx:468-484`), `barChartWrap` renders 5 vertical `<View>` bars with:
   - `height: Math.round(ratio * 76)` (pixels)
   - `width: 14` (pixels)
   - Color: `Colors.primary` (`#16A34A`), with the last bar highlighted in `Colors.primaryDark` (`#15803D`).
5. **Charting Library:** No third-party charting library (e.g. `react-native-chart-kit`, `victory-native`) is used. It is a custom pure-React Native CSS/View micro-chart.

---

## 4. Chronological Grouping Assessment

### 4.1 Confirmed Defect: Modulo Array Indexing
In `src/app/reports.tsx:262-265`:
```typescript
const buckets = [0, 0, 0, 0, 0];
sales.forEach((sale, idx) => {
  buckets[4 - (idx % 5)] += Number(sale.total_amount) || 0;
});
```

Because `sales` is sorted descending (`created_at DESC`), the indexing distributes sales in round-robin fashion:
- `idx = 0` (newest sale) -> Bucket `4 - (0 % 5) = 4` (Bar 4, rightmost)
- `idx = 1` (2nd newest sale) -> Bucket `4 - (1 % 5) = 3` (Bar 3)
- `idx = 2` (3rd newest sale) -> Bucket `4 - (2 % 5) = 2` (Bar 2)
- `idx = 3` (4th newest sale) -> Bucket `4 - (3 % 5) = 1` (Bar 1)
- `idx = 4` (5th newest sale) -> Bucket `4 - (4 % 5) = 0` (Bar 0, leftmost)
- `idx = 5` (6th newest sale) -> Bucket `4 - (5 % 5) = 4` (**Co-mingled into Bar 4 with the newest sale!**)
- `idx = 6` (7th newest sale) -> Bucket `3`
- ...

**Failure Modes:**
- **Zero Temporal Validity:** If a store made 1 sale today and 4 sales last week, the sale today and a sale from last week are arbitrarily assigned to different bars, and the 6th sale is added back to today's bar.
- **Reverse Chronology Confusion:** Newer items are placed in bucket 4, older items in bucket 0, but as soon as `idx >= 5`, older transactions loop back into the newest bucket.
- **No Temporal Buckets:** The 5 bars do not represent hours, days, weeks, or months.

---

## 5. Philippine Timezone Assessment

- **Timestamp Parsing:** None. `sale.created_at` is completely ignored in `chartBars`.
- **Timezone Safety:** Because timestamps are never parsed, `Asia/Manila` (UTC+08:00) calendar dates are not evaluated.
- **Midnight Boundary Risk:** A sale occurring at 11:59 PM PHT versus 12:01 AM PHT is not separated by calendar day; it is purely partitioned by `idx % 5`.

---

## 6. Reporting Period Consistency

The Reports screen allows switching between `Today`, `This Week`, `This Month`, and `All Time`.

| Period | Current Chart Behavior | Expected Logical Bucketing |
| :--- | :--- | :--- |
| **Today** | 5 modulo bars scrambling today's transactions | Time-of-day intervals (e.g. 4x 6-hour blocks: Morning, Midday, Afternoon, Evening) or hourly activity |
| **This Week** | 5 modulo bars scrambling 7 days of transactions | 7 distinct daily bars (Mon, Tue, Wed, Thu, Fri, Sat, Sun) matching Philippine calendar week |
| **This Month** | 5 modulo bars scrambling 30 days of transactions | 4 to 5 calendar weekly intervals or day-grouped trendline |
| **All Time** | 5 modulo bars scrambling months/years of transactions | Chronological monthly buckets (e.g. past 6 or 12 calendar months) |

### Category Tab Mismatch
The chart sits beside `heroMetric`. When the user toggles category tabs:
- **Sales Tab:** Shows Sales amount + Sales 5-bar chart.
- **Profit Tab:** Shows Gross Profit amount, but the 5-bar chart still displays Sales volume.
- **Inventory Tab:** Shows Inventory Value, but the 5-bar chart still displays Sales volume.
- **Utang Tab:** Shows Outstanding Utang, but the 5-bar chart still displays Sales volume.

The chart is hardcoded exclusively to `sales` without visual indicators explaining that it reflects sales revenue.

---

## 7. Empty & Error State Assessment

### 7.1 Confirmed Critical Defect: Fabricated Trend
In `src/app/reports.tsx:259-261`:
```typescript
if (sales.length === 0) {
  return [0.3, 0.45, 0.6, 0.78, 0.95];
}
```
- When a store has **0 sales** in the selected period, the chart renders 5 rising bars (`30% -> 45% -> 60% -> 78% -> 95%`).
- Store owners seeing this chart are misled into believing business is growing, when in reality zero transactions occurred.

### 7.2 Artificial Floor Height
In `src/app/reports.tsx:267`:
```typescript
return buckets.map((v) => Math.max(0.24, Math.min(1, v / maxVal)));
```
- If a bucket has `₱0.00` in sales, it is artificially raised to `0.24` (24% of max height, or ~18px).
- A day with 0 sales appears to have nearly a quarter of peak sales volume.

### 7.3 Error State Behavior
- If a network or database failure occurs, `sales` defaults to `[]`.
- The UI displays `DashboardErrorBanner`, but beneath the error banner, the KPI card still displays the fake ascending trend `[0.3, 0.45, 0.6, 0.78, 0.95]`.

---

## 8. Performance & Scalability Findings

1. **Client-Side Aggregation:** Computation occurs in `useMemo` in JavaScript. For `Today`, `This Week`, and `This Month`, the volume is low (tens to hundreds of items), so client aggregation is instantaneous.
2. **"All Time" PostgREST Limit:** `fetchStoreSales` does not paginate and is capped at PostgREST's default of 1,000 rows. In stores with > 1,000 sales, historical sales beyond the 1,000 most recent are excluded from the query.
3. **Stale Request Protection:** As verified in Batch 10B-3, `activeRequestIdRef` properly protects `sales` state updates from out-of-order responses during rapid tab switching.

---

## 9. Financial Data Integrity Findings

1. **Revenue Source:** Uses `Number(sale.total_amount) || 0`, which is the correct header transaction amount from multi-item POS sales.
2. **Double Counting:** Does not double-count with `sale_items`.
3. **Sum Consistency:** The mathematical sum of `buckets[0..4]` equals `totalSalesAmount` (when `sales.length > 0`), but the distribution across bars is artificial.
4. **Zero-State Integrity:** Completely violated by returning hardcoded ratios when `sales.length === 0`.

---

## 10. Issues Matrix

| Finding ID | File & Line | Current Behavior | Expected Behavior | Severity | Recommended Correction | Regression Risks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CHART-10B4-01** | `src/app/reports.tsx:259-261` | Returns fake upward trend `[0.3, 0.45, 0.6, 0.78, 0.95]` when `sales.length === 0` | Render zero/flat bars or an empty chart placeholder indicating "No sales in period" | **CRITICAL** | Return `[0, 0, 0, 0, 0]` or empty state indicator; never fabricate non-zero ratios | None; fixes misleading UI |
| **CHART-10B4-02** | `src/app/reports.tsx:262-265` | Groups sales using array index modulo `buckets[4 - (idx % 5)]` | Group sales into chronological temporal intervals based on `sale.created_at` | **HIGH** | Parse `created_at` and accumulate into period-specific chronological buckets (e.g. 7 days for `week`) | None if bucket boundaries match PHT |
| **CHART-10B4-03** | `src/app/reports.tsx:257-268` | `sale.created_at` is completely ignored; zero PHT timezone handling | Parse timestamps in Philippine Standard Time (`Asia/Manila` / UTC+08:00) | **HIGH** | Use date utility to assign sales to PHT calendar dates | Potential off-by-one day if UTC is used instead of UTC+08:00 |
| **CHART-10B4-04** | `src/app/reports.tsx:267` | Clamps minimum bar height to `0.24` (24%) via `Math.max(0.24, ...)` | Empty buckets must render at `0` height or faint base line (e.g. 2px indicator) | **MEDIUM** | Remove artificial `0.24` floor or set minimal baseline (e.g. 3px) strictly when amount > 0 | Visual design adjustment |
| **CHART-10B4-05** | `src/app/reports.tsx:257-268`, `468-484` | Always renders 5 unlabeled bars regardless of whether period is Today, Week, Month, or All Time | Adapt bucket count or display labels (e.g. 7 daily bars for `This Week`) | **MEDIUM** | Implement period-aware bucketing model: Today (time blocks), Week (7 days), Month (weeks), All Time (months) | Card width constraint in `kpiChartCard` must be respected |
| **CHART-10B4-06** | `src/app/reports.tsx:449-485` | 5-bar sales chart is displayed regardless of whether user selects Sales, Profit, Inventory, or Utang tab | Chart should clearly state it represents Sales trend, or adapt metric to active tab | **LOW** | Add small subtitle or badge clarifying "Sales Trend" | Minor layout tweak |
| **CHART-10B4-07** | `src/lib/sales.ts:1052-1070` | Unpaginated `fetchStoreSales` capped at PostgREST 1,000 rows for "All Time" | Paginate sales or aggregate historical trend via database RPC | **LOW** | Implement pagination or RPC aggregation in future scalability batch | High row counts could increase load time |

---

## 11. Final Verdict

### **NOT SAFE FOR IMPLEMENTATION AS CURRENTLY DESIGNED**

The existing chart logic in `src/app/reports.tsx` cannot be used in a production financial application due to **Critical Finding CHART-10B4-01** (fabricated sales trend on zero data) and **High Finding CHART-10B4-02** (modulo array scrambling).

### Recommended Minimal Implementation Scope for Batch 10B-4
1. **Eliminate Fabricated Data:** Return empty/zero ratios when `sales.length === 0`.
2. **Implement Chronological Time Bucketing:**
   - **`today`:** 4 chronological 6-hour blocks (`12am–6am`, `6am–12pm`, `12pm–6pm`, `6pm–12am` PHT) or 5 active store operating blocks (`6am–9am`, `9am–12pm`, `12pm–3pm`, `3pm–6pm`, `6pm–9pm+`).
   - **`week`:** 7 chronological daily bars (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`) strictly mapped to Philippine calendar days.
   - **`month`:** 4 to 5 chronological weekly segments (`W1: 1–7`, `W2: 8–14`, `W3: 15–21`, `W4: 22–28`, `W5: 29–end`).
   - **`all`:** Recent chronological monthly intervals or yearly buckets.
3. **Philippine Standard Time (`Asia/Manila`):** Ensure all timestamp-to-bucket mappings use UTC+08:00 offset.
4. **Remove `0.24` Artificial Floor:** Ensure zero-revenue buckets render as zero height (or a faint 2px zero-line) so store owners can visually distinguish active periods from inactive periods.
5. **Preserve Clean UI Layout:** Fit comfortably within the existing `kpiChartCard` without breaking typography or layout.
