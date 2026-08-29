import type { CalendarDate } from '../domain';
import type { CalendarSystem } from './calendar-system.js';
import { GregorianCalendar } from './gregorian-calendar.js';

/**
 * Persian / Solar Hijri calendar.
 *
 * Year layout:
 *  - Months 1-6 (Farvardin..Shahrivar)  31 days each
 *  - Months 7-11 (Mehr..Bahman)  30 days each
 *  - Month 12 (Esfand)  29 days, 30 in leap years
 *
 * Leap years follow Borkowski's 33-year-cycle breaks table  the rule ICU and
 * Iran's official calendar use. (The Birashk 2820-year approximation this
 * previously used disagrees with it for roughly one year in every 30.)
 *
 * Conversion runs entirely in integer Julian Day Numbers, so it is free of any
 * local-time or DST influence.
 */

/**
 * Borkowski's 33-year-cycle algorithm (the "jalaali" breaks table), which is
 * what ICU and Iran's official calendar follow. Valid for SH -61..3177.
 */
const BREAKS: ReadonlyArray<number> = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
];

const div = (a: number, b: number): number => Math.floor(a / b);
const mod = (a: number, b: number): number => a - Math.floor(a / b) * b;

interface JalCal {
  readonly leap: number;
  readonly gy: number;
  readonly march: number;
}

/**
 * For Persian year `jy`, return the Gregorian year it starts in, the March day
 * of its Nowruz, and its position in the leap cycle (`leap === 0` ⇒ leap year).
 */
const jalCal = (jy: number): JalCal => {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0] as number;
  let jump = 0;

  if (jy < jp || jy >= (BREAKS[bl - 1] as number)) {
    throw new RangeError(`Persian year out of supported range (-61..3177): ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i] as number;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
};

const isPersianLeap = (year: number): boolean => jalCal(year).leap === 0;

const persianMonthDays = (year: number, month: number): number => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isPersianLeap(year) ? 30 : 29;
};

/**
 * Gregorian ↔ Julian Day Number (Fliegel–Van Flandern, proleptic Gregorian).
 * Integer-only, so no local-time or DST influence, and an exact inverse pair.
 */
const gregorianToJdn = (gy: number, gm: number, gd: number): number => {
  const a = div(14 - gm, 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return gd + div(153 * m + 2, 5) + 365 * y + div(y, 4) - div(y, 100) + div(y, 400) - 32045;
};

const jdnToGregorian = (jdn: number): { year: number; month: number; day: number } => {
  let l = jdn + 68569;
  const n = div(4 * l, 146097);
  l -= div(146097 * n + 3, 4);
  const i = div(4000 * (l + 1), 1461001);
  l = l - div(1461 * i, 4) + 31;
  const j = div(80 * l, 2447);
  const day = l - div(2447 * j, 80);
  l = div(j, 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return { year, month, day };
};

const persianToJdn = (year: number, month: number, day: number): number => {
  const r = jalCal(year);
  return (
    gregorianToJdn(r.gy, 3, r.march) + (month - 1) * 31 - div(month, 7) * (month - 7) + day - 1
  );
};

const jdnToPersian = (jdn: number): { year: number; month: number; day: number } => {
  const gy = jdnToGregorian(jdn).year;
  let year = gy - 621;
  const r = jalCal(year);
  const nowruzJdn = gregorianToJdn(r.gy, 3, r.march);
  let k = jdn - nowruzJdn;

  if (k >= 0) {
    if (k <= 185) {
      return { year, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    year -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { year, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
};

const PERSIAN_MONTH_NAMES_LATIN: ReadonlyArray<string> = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
];

const PERSIAN_MONTH_NAMES_FA: ReadonlyArray<string> = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const toArabicDigits = (input: string | number): string => {
  const s = String(input);
  const map: Record<string, string> = {
    '0': '۰',
    '1': '۱',
    '2': '۲',
    '3': '۳',
    '4': '۴',
    '5': '۵',
    '6': '۶',
    '7': '۷',
    '8': '۸',
    '9': '۹',
  };
  let out = '';
  for (const ch of s) out += map[ch] ?? ch;
  return out;
};

export class PersianCalendar implements CalendarSystem {
  readonly id = 'persian' as const;
  readonly displayName = 'Persian (Solar Hijri)';
  readonly monthsInYear = 12;
  readonly #gregorian = new GregorianCalendar();

  daysInMonth(year: number, month: number): number {
    return persianMonthDays(year, month);
  }

  isValidDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12) return false;
    return day >= 1 && day <= persianMonthDays(year, month);
  }

  addDays(date: CalendarDate, days: number): CalendarDate {
    return Object.freeze(jdnToPersian(persianToJdn(date.year, date.month, date.day) + days));
  }

  addMonths(date: CalendarDate, months: number): CalendarDate {
    if (months === 0) return date;
    const total = date.month - 1 + months;
    const yearDelta = Math.floor(total / 12);
    const newYear = date.year + yearDelta;
    const newMonth = (((total % 12) + 12) % 12) + 1;
    const newDay = Math.min(date.day, persianMonthDays(newYear, newMonth));
    return Object.freeze({ year: newYear, month: newMonth, day: newDay });
  }

  addYears(date: CalendarDate, years: number): CalendarDate {
    return this.addMonths(date, years * 12);
  }

  compare(a: CalendarDate, b: CalendarDate): number {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  }

  weekday(date: CalendarDate): number {
    return this.#gregorian.weekday(this.toGregorian(date));
  }

  today(timeZone?: string): CalendarDate {
    return this.fromGregorian(this.#gregorian.today(timeZone));
  }

  toGregorian(date: CalendarDate): CalendarDate {
    return Object.freeze(jdnToGregorian(persianToJdn(date.year, date.month, date.day)));
  }

  fromGregorian(date: CalendarDate): CalendarDate {
    return Object.freeze(jdnToPersian(gregorianToJdn(date.year, date.month, date.day)));
  }

  monthName(month: number, style: 'long' | 'short' | 'narrow', locale: string): string {
    const isFa = locale.startsWith('fa');
    const names = isFa ? PERSIAN_MONTH_NAMES_FA : PERSIAN_MONTH_NAMES_LATIN;
    const idx = month - 1;
    const full = names[idx] ?? String(month);
    if (style === 'narrow') return full.slice(0, 1);
    if (style === 'short') return full.slice(0, 3);
    return full;
  }

  formatDay(day: number, locale: string): string {
    if (locale.startsWith('fa') || locale.startsWith('ar')) return toArabicDigits(day);
    return String(day);
  }

  toIso(date: CalendarDate): string {
    const m = String(date.month).padStart(2, '0');
    const d = String(date.day).padStart(2, '0');
    return `${date.year}-${m}-${d}`;
  }
}
