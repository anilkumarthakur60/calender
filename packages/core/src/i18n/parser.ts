import type { CalendarSystem } from '../calendar';
import { type CalendarDate, createCalendarDate } from '../domain';

/**
 * Zero code points of the decimal digit systems a localized date input can
 * arrive in. Each system lays its ten digits out contiguously from its zero.
 */
const DIGIT_ZEROS = [
  0x0660, // Arabic-Indic
  0x06f0, // Extended Arabic-Indic (Persian, Urdu)
  0x0966, // Devanagari
  0x09e6, // Bengali
  0x0a66, // Gurmukhi
  0x0ae6, // Gujarati
  0x0b66, // Oriya
  0x0be6, // Tamil
  0x0c66, // Telugu
  0x0ce6, // Kannada
  0x0d66, // Malayalam
  0x0e50, // Thai
  0x0ed0, // Lao
  0x0f20, // Tibetan
  0x1040, // Myanmar
  0x17e0, // Khmer
  0x1810, // Mongolian
  0xff10, // Fullwidth
] as const;

/** Bidi controls that Intl may embed around numerals in RTL locales. */
const BIDI_CONTROLS = new Set([0x061c, 0x200e, 0x200f, 0x2066, 0x2067, 0x2068, 0x2069]);

/**
 * Fold localized numerals down to ASCII and drop bidi controls, so a string
 * produced by `formatWithPattern` in any numbering system can be parsed back.
 * ASCII input passes through untouched.
 */
export const normalizeDigits = (input: string): string => {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp < 0x0660) {
      out += ch;
      continue;
    }
    if (BIDI_CONTROLS.has(cp)) continue;
    let mapped = ch;
    for (const zero of DIGIT_ZEROS) {
      if (cp >= zero && cp <= zero + 9) {
        mapped = String(cp - zero);
        break;
      }
    }
    out += mapped;
  }
  return out;
};

/**
 * Two-digit-year pivot shared by every parser (lenient + pattern-based),
 * TR35-style: 00-69 → 20xx, 70-99 → 19xx.
 */
export const resolveTwoDigitYear = (yy: number): number => (yy < 70 ? 2000 + yy : 1900 + yy);

/**
 * Lenient string parser. Recognises ISO-8601 dates and falls back to
 * Intl-derived format tokens (yyyy/MM/dd, MM/dd/yyyy, dd/MM/yyyy) by inspecting
 * the locale's resolved format.
 *
 * Pass `calendar` when the text is written in a non-Gregorian system:
 * validation then uses that calendar's own rules, so e.g. the Bikram Sambat
 * date `2081-01-32` (BS months run to 32 days) is accepted instead of being
 * rejected as an invalid Gregorian date.
 */
export const parseDate = (
  input: string,
  locale: string = 'en-US',
  calendar?: CalendarSystem,
): CalendarDate | null => {
  const trimmed = normalizeDigits(input).trim();
  if (!trimmed) return null;

  const make = (year: number, month: number, day: number): CalendarDate | null => {
    if (calendar) {
      return calendar.isValidDate(year, month, day) ? Object.freeze({ year, month, day }) : null;
    }
    try {
      return createCalendarDate(year, month, day);
    } catch {
      return null;
    }
  };

  // Anchored: an unanchored prefix match accepted trailing junk, which also
  // short-circuited the multi-value splitter and silently dropped dates.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(trimmed);
  if (iso) return make(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const order = detectDateOrder(locale);
  const parts = trimmed.split(/[/.\-\s]/).filter(Boolean);
  if (parts.length !== 3) return null;

  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  for (let i = 0; i < 3; i += 1) {
    const role = order[i];
    const value = Number(parts[i]);
    if (!Number.isFinite(value)) return null;
    if (role === 'year') year = value < 100 ? resolveTwoDigitYear(value) : value;
    else if (role === 'month') month = value;
    else day = value;
  }

  if (year === undefined || month === undefined || day === undefined) return null;
  return make(year, month, day);
};

type Role = 'year' | 'month' | 'day';

const detectDateOrder = (locale: string): ReadonlyArray<Role> => {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2024, 0, 2));
    const roles: Role[] = [];
    for (const p of parts) {
      if (p.type === 'year') roles.push('year');
      else if (p.type === 'month') roles.push('month');
      else if (p.type === 'day') roles.push('day');
    }
    if (roles.length === 3) return roles;
  } catch {
    /* fall through */
  }
  return ['month', 'day', 'year'];
};
