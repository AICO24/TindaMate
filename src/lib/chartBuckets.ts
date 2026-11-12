/**
 * TindaMate — Batch 10B-4: Sales Trend Chart Pure Bucketing Helper
 *
 * Provides chronological, period-aware, Philippine Standard Time (UTC+08:00)
 * bucketing for the Reports screen sales trend chart.
 *
 * Pure function: no React imports, no Supabase imports, no side effects.
 */

import {
  getPHTDateKey,
  getPHTParts,
  PHT_MONTH_NAMES,
  PHT_WEEKDAY_NAMES,
} from '@/lib/pht';
import { ReportPeriod } from '@/types/profit';
import { Sale } from '@/types/sale';

export interface ChartBucket {
  label: string;
  amount: number;
}

/**
 * Computes period-aligned chronological sales buckets strictly evaluated in Asia/Manila.
 *
 * @param sales Array of store sales (typically sorted DESC from Supabase)
 * @param period 'today' | 'week' | 'month' | 'all'
 * @param range Period date boundary range ({ start, end } where start is inclusive, end is exclusive)
 * @param now Optional reference date for evaluation (defaults to current Date)
 * @returns Array of labeled buckets with centavo-safe aggregated amounts
 */
export function computeSalesBuckets(
  sales: Sale[],
  period: ReportPeriod,
  range: { start?: Date | string | null; end?: Date | string | null },
  now?: Date
): ChartBucket[] {
  const startTimeMs =
    range.start != null ? new Date(range.start).getTime() : null;
  const endTimeMs =
    range.end != null ? new Date(range.end).getTime() : null;

  // Filter to valid in-range, non-voided sales
  const validSales = sales.filter((sale) => {
    const saleTime = new Date(sale.created_at).getTime();
    if (!Number.isFinite(saleTime)) {
      return false;
    }
    if (
      startTimeMs !== null &&
      Number.isFinite(startTimeMs) &&
      saleTime < startTimeMs
    ) {
      return false;
    }
    if (
      endTimeMs !== null &&
      Number.isFinite(endTimeMs) &&
      saleTime >= endTimeMs
    ) {
      return false;
    }

    // Defensive check if void/cancellation status is ever present
    const raw = sale as unknown as Record<string, unknown>;
    if (
      raw.is_voided === true ||
      raw.status === 'voided' ||
      raw.status === 'cancelled'
    ) {
      return false;
    }

    return true;
  });

  // 1. TODAY: 4 chronological 6-hour PHT blocks (12a, 6a, 12p, 6p)
  if (period === 'today') {
    const labels = ['12a', '6a', '12p', '6p'];
    const bucketAmounts = [0, 0, 0, 0];

    for (const sale of validSales) {
      const { hour } = getPHTParts(sale.created_at);
      const bucketIdx = Math.min(3, Math.max(0, Math.floor(hour / 6)));
      bucketAmounts[bucketIdx] += Number(sale.total_amount) || 0;
    }

    return labels.map((label, idx) => ({
      label,
      amount: Number(bucketAmounts[idx].toFixed(2)),
    }));
  }

  // 2. WEEK: Exactly 7 daily PHT buckets from range.start through range.end
  if (period === 'week') {
    const ref =
      range.start != null ? new Date(range.start) : (now ?? new Date());
    const startParts = getPHTParts(ref);
    const pad = (n: number) => String(n).padStart(2, '0');

    const buckets: { dateKey: string; label: string; amount: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(
        Date.UTC(startParts.year, startParts.month, startParts.day + i)
      );
      const bYear = d.getUTCFullYear();
      const bMonth = d.getUTCMonth();
      const bDay = d.getUTCDate();
      const bDow = d.getUTCDay();

      const dateKey = `${bYear}-${pad(bMonth + 1)}-${pad(bDay)}`;
      const label = PHT_WEEKDAY_NAMES[bDow] ?? 'Mon';
      buckets.push({ dateKey, label, amount: 0 });
    }

    for (const sale of validSales) {
      const saleKey = getPHTDateKey(sale.created_at);
      const target = buckets.find((b) => b.dateKey === saleKey);
      if (target) {
        target.amount += Number(sale.total_amount) || 0;
      }
    }

    return buckets.map((b) => ({
      label: b.label,
      amount: Number(b.amount.toFixed(2)),
    }));
  }

  // 3. MONTH: 4 or 5 calendar weekly intervals (W1: 1-7, W2: 8-14, W3: 15-21, W4: 22-28, W5: 29-end)
  if (period === 'month') {
    const ref =
      range.start != null ? new Date(range.start) : (now ?? new Date());
    const startParts = getPHTParts(ref);
    const daysInMonth = new Date(
      Date.UTC(startParts.year, startParts.month + 1, 0)
    ).getUTCDate();

    // Skip W5 if month has only 28 days (e.g. Feb non-leap) or range.end does not reach day 29
    let reachesDay29 = true;
    if (range.end != null) {
      const endParts = getPHTParts(range.end);
      if (
        endParts.year < startParts.year ||
        (endParts.year === startParts.year &&
          endParts.month < startParts.month)
      ) {
        reachesDay29 = false;
      } else if (
        endParts.year === startParts.year &&
        endParts.month === startParts.month
      ) {
        reachesDay29 = endParts.day >= 29;
      } else {
        reachesDay29 = true;
      }
    }

    const hasW5 = daysInMonth > 28 && reachesDay29;
    const bucketCount = hasW5 ? 5 : 4;
    const labels = hasW5
      ? ['W1', 'W2', 'W3', 'W4', 'W5']
      : ['W1', 'W2', 'W3', 'W4'];
    const bucketAmounts = new Array<number>(bucketCount).fill(0);

    for (const sale of validSales) {
      const { day } = getPHTParts(sale.created_at);
      let bIdx: number;
      if (day <= 7) {
        bIdx = 0;
      } else if (day <= 14) {
        bIdx = 1;
      } else if (day <= 21) {
        bIdx = 2;
      } else if (day <= 28) {
        bIdx = 3;
      } else {
        bIdx = hasW5 ? 4 : 3;
      }
      bucketAmounts[bIdx] += Number(sale.total_amount) || 0;
    }

    return labels.map((label, idx) => ({
      label,
      amount: Number(bucketAmounts[idx].toFixed(2)),
    }));
  }

  // 4. ALL: 1 to 6 monthly chronological buckets ending at current PHT month
  const refDate = now ?? new Date();
  const currPht = getPHTParts(refDate);
  const currYear = currPht.year;
  const currMonth = currPht.month; // 0-11

  // If no sales exist, return 6 zero-amount monthly buckets ending at current month
  if (validSales.length === 0) {
    const emptyBuckets: ChartBucket[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(Date.UTC(currYear, currMonth - m, 1));
      const bMonth = d.getUTCMonth();
      emptyBuckets.push({
        label: PHT_MONTH_NAMES[bMonth],
        amount: 0,
      });
    }
    return emptyBuckets;
  }

  // Find earliest sale timestamp
  let earliestMs = Infinity;
  for (const sale of validSales) {
    const t = new Date(sale.created_at).getTime();
    if (t < earliestMs) {
      earliestMs = t;
    }
  }

  const earliestPht = getPHTParts(earliestMs);
  let monthsDiff =
    (currYear - earliestPht.year) * 12 + (currMonth - earliestPht.month);
  if (monthsDiff < 0) {
    monthsDiff = 0;
  }

  // If earliest sale is within last 6 months (0-5 months ago), bucket from that month to current (1-6 buckets).
  // Otherwise, use last 6 calendar months.
  const numMonths = monthsDiff <= 5 ? monthsDiff + 1 : 6;
  const startOffset = numMonths - 1;

  const monthBuckets: {
    year: number;
    month: number;
    label: string;
    amount: number;
  }[] = [];

  for (let m = startOffset; m >= 0; m--) {
    const d = new Date(Date.UTC(currYear, currMonth - m, 1));
    const bYear = d.getUTCFullYear();
    const bMonth = d.getUTCMonth();
    monthBuckets.push({
      year: bYear,
      month: bMonth,
      label: PHT_MONTH_NAMES[bMonth],
      amount: 0,
    });
  }

  for (const sale of validSales) {
    const { year, month } = getPHTParts(sale.created_at);
    const target = monthBuckets.find(
      (b) => b.year === year && b.month === month
    );
    if (target) {
      target.amount += Number(sale.total_amount) || 0;
    }
  }

  return monthBuckets.map((b) => ({
    label: b.label,
    amount: Number(b.amount.toFixed(2)),
  }));
}
