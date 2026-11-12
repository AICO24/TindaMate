/**
 * TindaMate — Batch 10B-4: Philippine Standard Time (PHT) Helper
 *
 * Philippine Standard Time is strictly UTC+08:00 with no Daylight Saving Time (DST).
 * This module provides framework-agnostic, pure utilities for extracting calendar parts
 * and formatting timestamps in Asia/Manila without mutating global Date behavior.
 */

export const PHT_OFFSET_HOURS = 8;
export const PHT_OFFSET_MS = PHT_OFFSET_HOURS * 60 * 60 * 1000;

export const PHT_WEEKDAY_NAMES = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

export const PHT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export interface PHTCalendarParts {
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  dowSun: number; // 0=Sun .. 6=Sat
}

/**
 * Returns the epoch timestamp in milliseconds shifted by +8 hours.
 */
export function toPHTMillis(input: Date | string | number): number {
  const ms =
    typeof input === 'number'
      ? input
      : typeof input === 'string'
      ? new Date(input).getTime()
      : input.getTime();
  return ms + PHT_OFFSET_MS;
}

/**
 * Reads PHT calendar parts using UTC getters on the offset-adjusted Date.
 */
export function getPHTParts(input: Date | string | number): PHTCalendarParts {
  const phtMs = toPHTMillis(input);
  const d = new Date(phtMs);

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    dowSun: d.getUTCDay(),
  };
}

/**
 * Returns the 3-letter weekday abbreviation in PHT for a given timestamp.
 */
export function getPHTWeekdayLabel(input: Date | string | number): string {
  const { dowSun } = getPHTParts(input);
  return PHT_WEEKDAY_NAMES[dowSun] ?? 'Mon';
}

/**
 * Returns the 3-letter month abbreviation in PHT for a given month index (0-11).
 */
export function getPHTMonthLabel(monthIndex: number): string {
  const safeIndex = ((monthIndex % 12) + 12) % 12;
  return PHT_MONTH_NAMES[safeIndex];
}

/**
 * Returns 'YYYY-MM-DD' representing the PHT calendar date.
 */
export function getPHTDateKey(input: Date | string | number): string {
  const { year, month, day } = getPHTParts(input);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}
