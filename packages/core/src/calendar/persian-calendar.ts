import { type CalendarDate, toJsDate } from '../domain/calendar-date.js';
import type { CalendarSystem } from './calendar-system.js';
import { GregorianCalendar } from './gregorian-calendar.js';

/**
 * Persian / Solar Hijri calendar.
 *
 * Year layout:
 *  - Months 1-6 (Farvardin..Shahrivar) — 31 days each
 *  - Months 7-11 (Mehr..Bahman) — 30 days each
 *  - Month 12 (Esfand) — 29 days, 30 in leap years
 *
 * Leap-year rule (Birashk algorithm — accurate for SH 1300..1500):
 *   isLeap(SH) ⇔ ((((SH - 474) % 2820 + 474 + 38) * 682) % 2816) < 682
 *
 * Conversion uses the well-established Julian Day Number bridge between
 * Persian, Gregorian, and Islamic calendars.
 */

const PERSIAN_EPOCH = 1948320.5; // JD of Persian epoch (March 19, 622 AD Julian)
const GREGORIAN_EPOCH = 1721425.5;

const persianMonthDays = (year: number, month: number): number => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isPersianLeap(year) ? 30 : 29;
};

const isPersianLeap = (year: number): boolean => {
  const a = ((year - 474) % 2820) + 474;
  return ((a + 38) * 682) % 2816 < 682;
};

const persianToJd = (year: number, month: number, day: number): number => {
  const epbase = year - (year >= 0 ? 474 : 473);
  const epyear = 474 + (((epbase % 2820) + 2820) % 2820);
  let jd = day;
  if (month <= 7) jd += (month - 1) * 31;
  else jd += (month - 1) * 30 + 6;
  jd += Math.floor((epyear * 682 - 110) / 2816);
  jd += (epyear - 1) * 365;
  jd += Math.floor(epbase / 2820) * 1029983;
  jd += PERSIAN_EPOCH - 1;
  return jd;
};

const jdToPersian = (jd: number): { year: number; month: number; day: number } => {
  jd = Math.floor(jd) + 0.5;
  const depoch = jd - persianToJd(475, 1, 1);
  const cycle = Math.floor(depoch / 1029983);
  const cyear = ((depoch % 1029983) + 1029983) % 1029983;
  let ycycle: number;
  if (cyear === 1029982) ycycle = 2820;
  else {
    const aux1 = Math.floor(cyear / 366);
    const aux2 = cyear % 366;
    ycycle = Math.floor((2134 * aux1 + 2816 * aux2 + 2815) / 1028522) + aux1 + 1;
  }
  let year = ycycle + 2820 * cycle + 474;
  if (year <= 0) year -= 1;
  const yday = jd - persianToJd(year, 1, 1) + 1;
  const month = yday <= 186 ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
  const day = jd - persianToJd(year, month, 1) + 1;
  return { year, month, day };
};

const gregorianToJd = (year: number, month: number, day: number): number => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045.5 +
    GREGORIAN_EPOCH -
    1721425.5
  );
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
    const jd = persianToJd(date.year, date.month, date.day) + days;
    return Object.freeze(jdToPersian(jd));
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
    const jd = persianToJd(date.year, date.month, date.day);
    // JD → Gregorian via the JS Date bridge anchored at AD 1970-01-01 (JD 2440587.5)
    const ad = new Date((jd - 2440587.5) * 86_400_000);
    return Object.freeze({
      year: ad.getUTCFullYear(),
      month: ad.getUTCMonth() + 1,
      day: ad.getUTCDate(),
    });
  }

  fromGregorian(date: CalendarDate): CalendarDate {
    // Pass through JS Date for portability — toJsDate uses local noon, then
    // we re-derive UTC midnight before computing JD.
    const ad = toJsDate(date);
    const jd = gregorianToJd(ad.getFullYear(), ad.getMonth() + 1, ad.getDate());
    return Object.freeze(jdToPersian(jd));
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
