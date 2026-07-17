/**
 * Immutable plain-object date value at day-granularity. Timezone-safe by
 * construction: all arithmetic is performed on the {year, month, day} triple,
 * never on a `Date` object. Conversions to/from `Date` always use UTC noon to
 * sidestep DST edges.
 */
export interface CalendarDate {
  readonly year: number;
  /** 1-12 */
  readonly month: number;
  /** 1-31 */
  readonly day: number;
}

const DAYS_IN_MONTH_COMMON: ReadonlyArray<number> = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  const base = DAYS_IN_MONTH_COMMON[month - 1];
  if (base === undefined) throw new RangeError(`Invalid month: ${month}`);
  return base;
};

const assertValid = (year: number, month: number, day: number): void => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`CalendarDate parts must be integers: ${year}-${month}-${day}`);
  }
  if (month < 1 || month > 12) throw new RangeError(`Invalid month: ${month}`);
  const max = daysInMonth(year, month);
  if (day < 1 || day > max) throw new RangeError(`Invalid day for ${year}-${month}: ${day}`);
};

export const createCalendarDate = (year: number, month: number, day: number): CalendarDate => {
  assertValid(year, month, day);
  return Object.freeze({ year, month, day });
};

export const todayCalendarDate = (tz?: string): CalendarDate => {
  const now = new Date();
  if (!tz) return createCalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find(p => p.type === t)?.value);
  return createCalendarDate(get('year'), get('month'), get('day'));
};

export const fromJsDate = (date: Date): CalendarDate =>
  createCalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

export const toJsDate = (date: CalendarDate): Date =>
  new Date(date.year, date.month - 1, date.day, 12, 0, 0, 0);

export const fromIso = (iso: string): CalendarDate => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) throw new RangeError(`Invalid ISO date: ${iso}`);
  return createCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
};

export const toIso = (date: CalendarDate): string => {
  const m = String(date.month).padStart(2, '0');
  const d = String(date.day).padStart(2, '0');
  return `${date.year}-${m}-${d}`;
};

/**
 * Days since the Unix epoch for a Gregorian date, computed purely in UTC so
 * the result never depends on the host time zone (Samoa/Kiribati safe).
 */
export const toEpochDay = (date: CalendarDate): number => {
  // Date.UTC maps years 0-99 to 1900+y; setUTCFullYear avoids that pitfall.
  const d = new Date(0);
  d.setUTCFullYear(date.year, date.month - 1, date.day);
  return d.getTime() / 86_400_000;
};

/** Inverse of {@link toEpochDay}: epoch-day number → Gregorian CalendarDate (UTC). */
export const fromEpochDay = (epochDay: number): CalendarDate => {
  const d = new Date(epochDay * 86_400_000);
  return createCalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
};

export const compareDates = (a: CalendarDate, b: CalendarDate): number => {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
};

export const isSameDay = (a: CalendarDate, b: CalendarDate): boolean => compareDates(a, b) === 0;
export const isSameMonth = (a: CalendarDate, b: CalendarDate): boolean =>
  a.year === b.year && a.month === b.month;
export const isSameYear = (a: CalendarDate, b: CalendarDate): boolean => a.year === b.year;
export const isBefore = (a: CalendarDate, b: CalendarDate): boolean => compareDates(a, b) < 0;
export const isAfter = (a: CalendarDate, b: CalendarDate): boolean => compareDates(a, b) > 0;

export const clamp = (
  date: CalendarDate,
  min: CalendarDate | undefined,
  max: CalendarDate | undefined,
): CalendarDate => {
  if (min && isBefore(date, min)) return min;
  if (max && isAfter(date, max)) return max;
  return date;
};

export const addDays = (date: CalendarDate, days: number): CalendarDate => {
  if (days === 0) return date;
  let y = date.year;
  let m = date.month;
  let d = date.day + days;
  while (d > daysInMonth(y, m)) {
    d -= daysInMonth(y, m);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  while (d < 1) {
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    d += daysInMonth(y, m);
  }
  return createCalendarDate(y, m, d);
};

export const addMonths = (date: CalendarDate, months: number): CalendarDate => {
  if (months === 0) return date;
  const totalMonths = date.month - 1 + months;
  const yearDelta = Math.floor(totalMonths / 12);
  const newYear = date.year + yearDelta;
  const newMonth = (((totalMonths % 12) + 12) % 12) + 1;
  const newDay = Math.min(date.day, daysInMonth(newYear, newMonth));
  return createCalendarDate(newYear, newMonth, newDay);
};

export const addYears = (date: CalendarDate, years: number): CalendarDate =>
  addMonths(date, years * 12);

export const startOfMonth = (date: CalendarDate): CalendarDate =>
  createCalendarDate(date.year, date.month, 1);

export const endOfMonth = (date: CalendarDate): CalendarDate =>
  createCalendarDate(date.year, date.month, daysInMonth(date.year, date.month));

export const startOfYear = (date: CalendarDate): CalendarDate =>
  createCalendarDate(date.year, 1, 1);

export const endOfYear = (date: CalendarDate): CalendarDate =>
  createCalendarDate(date.year, 12, 31);

/** ISO weekday: 1 (Monday) .. 7 (Sunday). */
export const isoWeekday = (date: CalendarDate): number => {
  const js = toJsDate(date).getDay();
  return js === 0 ? 7 : js;
};

/** US weekday: 0 (Sunday) .. 6 (Saturday). */
export const usWeekday = (date: CalendarDate): number => toJsDate(date).getDay();
