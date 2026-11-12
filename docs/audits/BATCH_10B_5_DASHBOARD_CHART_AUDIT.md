# TindaMate — Batch 10B-5: Dashboard Sales Chart Read-Only Audit

**Document Date:** November 12, 2026  
**Auditor:** Senior React Native, TypeScript & Financial Data Visualization Specialist  
**Audit Scope:** STRICTLY READ-ONLY audit of the Dashboard Sales Overview Chart (`src/components/dashboard/SalesOverviewCard.tsx` and `src/app/home.tsx`)  
**Current Branch:** `main`  
**Status:** Audit Complete — Actionable Defects Identified  

---

## 1. Executive Summary

Following the completion of Batch 10B-4 (Reports Screen Sales Trend Chart bucketing, PHT awareness, and empty-state correction), this audit investigates the **Sales Overview Chart** rendered on the main Dashboard screen (`src/app/home.tsx` and `src/components/dashboard/SalesOverviewCard.tsx`).

The audit reveals that the Dashboard sales chart suffers from **critical data integrity, timezone, and visual truthfulness defects** that are as severe as—and in some respects more misleading than—the defects previously resolved on the Reports screen:

1. **Critical Historical Fallback (Fabricated "This Week" Trend):** In `home.tsx:583-587`, if the store has zero sales in the current calendar week, the chart silently swaps in `historicalWeekdayCentavos`—the sum of all sales across the store's entire lifetime grouped by day of the week. A card prominently titled `"This Week ⌄"` displays lifetime Monday-to-Sunday sums as if they occurred this week.
2. **Critical False "Today" Tooltip Re-targeting:** In `home.tsx:588-602`, if today has zero sales, the code reassigns `highlightedIdx` (`isToday = true`) to whichever weekday had the highest revenue. The tooltip callout bubble (e.g. `"₱4.5k"`) points to Tuesday or Friday, actively misleading the merchant into believing that past revenue was earned today.
3. **Artificial Visual Floors (14% Zero Floor, 24% Minimum Active Floor):** In `SalesOverviewCard.tsx:118-120`, days with `₱0.00` in sales are clamped to `0.14` (14% height, rendering a 12px tall bar). Days with any sale ($> ₱0.00$) are clamped to a minimum ratio of `0.24` (24% height, rendering a 20px tall bar). Empty days appear significantly active.
4. **Zero Philippine Standard Time Awareness:** In `home.tsx:535-580`, day-of-week indexing and date matching rely entirely on device-local JavaScript Date methods (`getDay()`, `getDate()`, `getMonth()`, `getFullYear()`), ignoring Asia/Manila (UTC+08:00).
5. **Unbounded Query & Incomplete 5-Sale Fallback:** In `home.tsx:186`, `fetchStoreSales()` is called without start/end ISO boundaries, downloading unbounded historical rows. In `home.tsx:534`, if `allStoreSales` fails or is empty, the chart falls back to `recentSales` (which is capped at 5 records), calculating an incomplete weekly sum.

---

## 2. Files & Functions Inspected

| File Path | Function / Block Inspected | Lines |
| :--- | :--- | :--- |
| `src/components/dashboard/SalesOverviewCard.tsx` | Full component source, props, Y-axis scale calculation, ratio clamping, and bar rendering | Lines 1–358 |
| `src/app/home.tsx` | Data fetch orchestrator (`loadDashboardData`) and `weeklyBars` aggregation logic | Lines 160–215, Lines 530–640 |
| `src/app/home.tsx` | `SalesOverviewCard` JSX rendering and navigation binding | Lines 842–858 |
| `src/lib/sales.ts` | `fetchDashboardSalesData` (recent 5 sales & today summary) and `fetchStoreSales` | Lines 1046–1075, Lines 1264–1335 |
| `src/lib/pht.ts` | PHT helper utilities (`getPHTParts`, `getPHTDateKey`, `PHT_WEEKDAY_NAMES`) | Lines 1–101 |
| `src/lib/chartBuckets.ts` | Pure chronological bucketing helper (`computeSalesBuckets`) | Lines 1–264 |
| `src/constants/theme.ts` | Design tokens (`Colors`, `Spacing`, `Typography`, `Shadows`) | Lines 1–250 |

---

## 3. Current Dashboard Chart Architecture

### 3.1 Data Fetching & Flow
1. When the Dashboard mounts or refreshes, `loadDashboardData()` in `src/app/home.tsx` triggers parallel queries:
   - `fetchDashboardSalesData()`: fetches the 5 most recent sales and today's sales summary.
   - `fetchStoreSales()`: fetches unbounded store sales (`Sale[]`) sorted by `created_at DESC`.
2. Sales are stored in component state: `recentSales` and `allStoreSales`.
3. At render time (lines 534–609):
   - `salesSource = allStoreSales.length > 0 ? allStoreSales : recentSales;`
   - An array of 7 elements (`orderedWeekdays`) represents `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`.
   - Iterates through `salesSource`, summing into `currentWeekCentavos` and `historicalWeekdayCentavos`.
   - Evaluates `hasCurrentWeekSales = currentWeekCentavos.some(c => c > 0)`.
   - If `hasCurrentWeekSales` is false, it switches to `historicalWeekdayCentavos`.
   - Generates `weeklyBars: { label: string; amount: number; isToday: boolean }[]`.
4. `SalesOverviewCard` receives `weeklyBars`, `maxWeeklyAmount`, and callback props.
5. `SalesOverviewCard` computes a 4-step Y-axis (`getFourStepYAxisLabels`) and a `chartCeiling` (minimum 1,000 or rounded up to next multiple of 3,000).
6. Each bar is rendered as a vertical `<Pressable>` with:
   - Base ratio: `clampedRatio = bar.amount > 0 ? Math.min(Math.max(rawRatio, 0.24), 1) : 0.14`
   - Pixel height: `Math.round(clampedRatio * 84)`
   - Floating callout bubble on the highlighted bar (`selectedBarIdx !== null ? selectedBarIdx === idx : bar.isToday`).

---

## 4. Chronological Grouping Assessment

### 4.1 Confirmed Defect: Lifetime Historical Weekday Fallback
In `src/app/home.tsx:554-587`:
```typescript
// 1. Sum sales within the current Monday..Sunday week
const currentWeekCentavos = [0, 0, 0, 0, 0, 0, 0];
// 2. Also track historical weekday totals in case current week has 0 sales yet
const historicalWeekdayCentavos = [0, 0, 0, 0, 0, 0, 0];

for (const s of salesSource) {
  const sd = new Date(s.created_at);
  if (Number.isNaN(sd.getTime())) continue;
  const centavos = Math.round(s.total_amount * 100);
  const saleJsDay = sd.getDay();
  const bucketIdx = saleJsDay === 0 ? 6 : saleJsDay - 1;
  historicalWeekdayCentavos[bucketIdx] += centavos;

  for (let idx = 0; idx < 7; idx++) {
    const targetDate = new Date(
      mondayDate.getFullYear(),
      mondayDate.getMonth(),
      mondayDate.getDate() + idx
    );
    if (
      sd.getFullYear() === targetDate.getFullYear() &&
      sd.getMonth() === targetDate.getMonth() &&
      sd.getDate() === targetDate.getDate()
    ) {
      currentWeekCentavos[idx] += centavos;
    }
  }
}

const hasCurrentWeekSales = currentWeekCentavos.some((c) => c > 0);
const activeCentavosBuckets = hasCurrentWeekSales
  ? currentWeekCentavos
  : historicalWeekdayCentavos;
```

**Failure Mode:**
- If a store opened three months ago and had 100 sales, but has recorded **no sales yet this week** (e.g. early Monday morning or during a slow period), `hasCurrentWeekSales` is `false`.
- Instead of showing zero bars for the week, the chart displays `historicalWeekdayCentavos`.
- All past Mondays are added together, all past Tuesdays are added together, etc.
- The merchant is presented with a full, active 7-bar chart under the header **"This Week ⌄"**, presenting false revenue data.

### 4.2 Confirmed Defect: Falsification of "Today" Callout
In `src/app/home.tsx:588-602`:
```typescript
const todayBucketIdx = currentJsDay === 0 ? 6 : currentJsDay - 1;
let highlightedIdx = todayBucketIdx;
if (
  activeCentavosBuckets[todayBucketIdx] === 0 &&
  activeCentavosBuckets.some((c) => c > 0)
) {
  // Highlight the highest/latest non-zero weekday bar so the callout pill shows real revenue
  let maxVal = -1;
  for (let idx = 0; idx < 7; idx++) {
    if (activeCentavosBuckets[idx] >= maxVal && activeCentavosBuckets[idx] > 0) {
      maxVal = activeCentavosBuckets[idx];
      highlightedIdx = idx;
    }
  }
}
```

**Failure Mode:**
- When today has 0 sales, the application deliberately moves the "today" highlight to whichever day had the highest sales volume.
- In `SalesOverviewCard.tsx:128`, `bar.isToday` activates the floating tooltip bubble.
- If today is Thursday and has ₱0 sales, but Tuesday had ₱5,000 in sales, the tooltip bubble hovers over Tuesday with a dark green highlight, indicating today's focus is on Tuesday.
- The UI actively misrepresents historical sales as today's performance.

---

## 5. Philippine Timezone Assessment

- In `home.tsx:535-542`:
  `const nowDate = new Date();`
  `const currentJsDay = nowDate.getDay();`
  `const mondayOffset = currentJsDay === 0 ? -6 : 1 - currentJsDay;`
- In `home.tsx:560-577`:
  `const sd = new Date(s.created_at);`
  `const saleJsDay = sd.getDay();`
  `sd.getFullYear() === targetDate.getFullYear() && sd.getMonth() === targetDate.getMonth() && sd.getDate() === targetDate.getDate()`

**Failure Mode:**
- All calendar methods (`getDay()`, `getDate()`, `getMonth()`, `getFullYear()`) execute in the runtime environment's local timezone.
- Supabase stores `created_at` in UTC (`timestamptz`).
- If an Android phone's clock or emulator is configured to UTC or another timezone, sales made at 1:00 AM PHT (which is 5:00 PM UTC the previous day) are grouped into the previous day's bucket.
- Unlike `src/lib/pht.ts` and `src/lib/chartBuckets.ts` (which strictly enforce UTC+08:00), the Dashboard has zero timezone awareness.

---

## 6. Week Boundary Alignment Assessment

- Both `home.tsx` (`orderedWeekdays`) and `getReportingPeriodRange('week')` (`src/lib/expenses.ts`) treat **Monday** as day 0 and **Sunday** as day 6.
- However, their boundary calculation algorithms diverge:
  - **Reports screen:** Computes PHT-based ISO timestamps (`startTimestampISO`, `endTimestampISO`) spanning Monday 00:00:00+08:00 to next Monday 00:00:00+08:00, and filters at the SQL/helper layer.
  - **Dashboard:** Fetches all sales without date bounds, calculates `mondayDate` using local `new Date()`, and does equality checks on `(year, month, date)`.
- If a user views the Dashboard and then taps "Reports" (via `onPeriodPress`), the week numbers can diverge whenever device local time differs from Asia/Manila.

---

## 7. Empty & Error State Assessment

### 7.1 Confirmed Defect: Artificial 14% and 24% Floors
In `src/components/dashboard/SalesOverviewCard.tsx:116-121`:
```typescript
const rawRatio = bar.amount > 0 ? bar.amount / chartCeiling : 0;
const clampedRatio =
  bar.amount > 0 ? Math.min(Math.max(rawRatio, 0.24), 1) : 0.14;
const barPixelHeight = Math.round(clampedRatio * 84);
```

**Failure Mode:**
- When `bar.amount === 0`: `clampedRatio = 0.14`. The bar height is `Math.round(0.14 * 84) = 12px`.
- When `bar.amount > 0`: `clampedRatio` is clamped to a minimum of `0.24`. The bar height is at least `Math.round(0.24 * 84) = 20px`.
- In a week with zero sales, all 7 bars render at 12px with green gradients (`#0D9459` and `#22C55E`). The chart never looks empty.
- A store owner cannot visually distinguish between a zero-sale day and an active low-revenue day.

### 7.2 Lack of Empty State Messaging
- `SalesOverviewCard.tsx` contains no empty state condition.
- If all bars are `₱0.00`, it continues rendering the 4 horizontal grid lines, Y-axis scale (`3k`, `2k`, `1k`, `0`), and 7 green bars.
- There is no `"No sales recorded this week"` or baseline indicator.

---

## 8. Financial Data Integrity Findings

1. **Sum Inconsistency:** When the historical fallback activates, the sum of `weeklyBars` equals total lifetime sales, not this week's sales. The KPI and chart are in direct contradiction.
2. **Partial Data Inaccuracy:** In `home.tsx:534`:
   `const salesSource = allStoreSales.length > 0 ? allStoreSales : recentSales;`
   If `allSalesRes` rejects (network error or timeout) but `salesRes` fulfills, `recentSales` (maximum 5 items) is used as the data source for the week chart. The chart renders 5 transactions across 7 days, giving an incorrect partial picture with no error indicator.
3. **No Void/Cancellation Filtering:** Neither `home.tsx` nor `SalesOverviewCard.tsx` checks for voided transactions.
4. **Centavo Safety:** `Math.round(s.total_amount * 100)` and integer centavo math is used in `home.tsx:562`, which is mathematically sound for individual transaction summing.

---

## 9. Performance & Scalability Findings

1. **Unbounded `fetchStoreSales()` Call:** In `home.tsx:186`, `fetchStoreSales()` is invoked without date bounds. For active stores with thousands of sales, this query pulls up to PostgREST's 1,000-row limit on every dashboard focus, consuming bandwidth and device memory.
2. **Double Querying on Mount:** The dashboard concurrently executes `fetchDashboardSalesData()` and `fetchStoreSales()`. Both query the `sales` table on initial load.
3. **Inefficient O(N * 7) Loop:** In `home.tsx:567-580`, an inner loop of 7 iterations constructs `new Date()` 7 times for each sale in `salesSource`. For 1,000 sales, 7,000 `Date` objects are allocated in JavaScript memory on every re-render.

---

## 10. Issues Matrix

| Finding ID | File & Line | Current Behavior | Expected Behavior | Severity | Recommended Correction | Regression Risks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DASH-10B5-01** | `src/app/home.tsx:583-587` | Falls back to lifetime `historicalWeekdayCentavos` when current week has 0 sales | Return 0 for all days of the current week when no sales occurred | **CRITICAL** | Eliminate historical fallback; return pure current week buckets | None; restores financial truth |
| **DASH-10B5-02** | `src/app/home.tsx:588-602` | Reassigns `highlightedIdx` (`isToday`) to the highest sales weekday if today has 0 sales | `isToday` must strictly match the current calendar day (PHT) | **CRITICAL** | Always set `isToday` strictly to current PHT day-of-week | Callout bubble will point to ₱0 if today has 0 sales |
| **DASH-10B5-03** | `src/components/dashboard/SalesOverviewCard.tsx:118-120` | Zero-sale bars render at `0.14` (12px); active bars clamped to minimum `0.24` (20px) | Zero-sale bars render at flat baseline height (e.g. 2px); active bars scale truthfully | **CRITICAL** | Remove artificial floors; render 2px baseline for ₱0 and proportional height for $> ₱0$ | Visual appearance changes to honestly reflect zero sales |
| **DASH-10B5-04** | `src/app/home.tsx:535-580` | Evaluates dates and weekdays in device-local timezone | Strictly evaluate in Philippine Standard Time (`Asia/Manila` / UTC+08:00) | **HIGH** | Use `getPHTParts` / `computeSalesBuckets` from `src/lib/chartBuckets.ts` | Sales near midnight properly align with PHT calendar |
| **DASH-10B5-05** | `src/app/home.tsx:186, 534` | Fetches unbounded `fetchStoreSales()` and falls back to 5-item `recentSales` on failure | Query sales bounded to current week range (`getReportingPeriodRange('week')`) | **HIGH** | Pass week range ISO strings to `fetchStoreSales(start, end)` | Reduces network payload and query latency |
| **DASH-10B5-06** | `src/components/dashboard/SalesOverviewCard.tsx:106-121` | Displays full grid, Y-axis scales, and 12px bars when entire week is empty | Display clean empty state or muted caption when all 7 bars are ₱0 | **MEDIUM** | Render subtle "No sales recorded this week" caption or 2px baseline bars | Clean layout preservation |
| **DASH-10B5-07** | `src/app/home.tsx:559-581` | Does not check for voided/cancelled transactions | Exclude voided/cancelled sales from aggregation | **LOW** | Filter out voided records before bucketing | None |

---

## 11. Reusability Assessment of `chartBuckets.ts` / `pht.ts`

The pure helper functions created in Batch 10B-4 are **100% reusable** for the Dashboard chart:

1. **`computeSalesBuckets(sales, 'week', range, now)`**:
   - Accepts `sales: Sale[]`.
   - Returns `{ label: string; amount: number }[]` for exactly 7 days (`Mon` through `Sun`) in PHT.
   - Accurately excludes sales outside the week boundary.
   - Centavo-safe.
2. **Mapping to `WeeklySalesBar`**:
   The Dashboard simply maps the 7 buckets to `SalesOverviewCard`'s expected format:
   ```typescript
   const currentPht = getPHTParts(new Date());
   // Map Sunday (0) to 6, Monday-Saturday (1..6) to 0..5
   const todayIdx = currentPht.dowSun === 0 ? 6 : currentPht.dowSun - 1;

   const weeklyBars: WeeklySalesBar[] = buckets.map((b, idx) => ({
     label: b.label,
     amount: b.amount,
     isToday: idx === todayIdx,
   }));
   ```
3. Adopting these helpers will:
   - Eliminate ~60 lines of brittle date-looping code in `home.tsx`.
   - Guarantee exact parity between the Dashboard weekly chart and the Reports screen weekly chart.
   - Ensure consistent PHT timezone handling across the entire application.

---

## 12. Final Verdict

### **NOT SAFE FOR FINANCIAL PRODUCTION AS CURRENTLY DESIGNED**

The Dashboard Sales Overview chart cannot be considered financially accurate in production due to:
- **DASH-10B5-01:** Fabricating weekly sales volume by displaying lifetime historical weekday totals when the current week is empty.
- **DASH-10B5-02:** Misrepresenting another weekday's revenue as "today" via callout tooltip reassignment.
- **DASH-10B5-03:** Masking zero-sale days behind a 12px green bar floor.

---

## 13. Recommended Minimal Implementation Scope for Batch 10B-6

*(Recommendations only — DO NOT IMPLEMENT during this batch)*

1. **In `src/app/home.tsx`**:
   - Scope `fetchStoreSales()` to the current week's PHT boundaries (`getReportingPeriodRange('week')`).
   - Remove the fallback to `recentSales` and `historicalWeekdayCentavos`.
   - Use `computeSalesBuckets(sales, 'week', weekRange, new Date())` from `@/lib/chartBuckets`.
   - Bind `isToday` strictly to the real PHT day index (`getPHTParts(now).dowSun`).
2. **In `src/components/dashboard/SalesOverviewCard.tsx`**:
   - Remove `clampedRatio` artificial floors (`0.14` on 0 and `0.24` on active).
   - Render 2px baseline indicator for ₱0 days.
   - Scale active days truthfully between 6px and 84px based on `chartCeiling`.
   - Suppress or format the tooltip callout appropriately when today has ₱0 sales.
   - Preserve existing card dimensions, fonts, and hover borders.

---

## 14. OUT OF SCOPE OBSERVATIONS

1. **`fetchDashboardSalesData()` in `src/lib/sales.ts` (Lines 1288–1297):**
   `startOfToday` is calculated using device-local time (`now.getFullYear()`, `now.getMonth()`, `now.getDate()`), which affects `todaySalesSummary` on the dashboard KPI header. In a future batch, `startOfToday` in `sales.ts` should use `getReportingPeriodRange('today')` or `getPHTParts()`.
2. **Unpaginated `fetchStoreSales()` PostgREST 1,000-row Limit:**
   As observed in Batch 10B-4 (CHART-10B4-07), unpaginated sales queries hit PostgREST's default 1,000-row limit. Bounding the dashboard query to the current week eliminates this issue for the dashboard.
