import { type CalendarSystem, GregorianCalendar } from '../calendar';
import type { CalendarDate } from '../domain';
import { normalizeDigits, resolveTwoDigitYear } from './parser.js';

/**
 * Token-based date formatting + parsing.
 *
 * Tokens (longest match wins):
 *   yyyy  4-digit year             "2025"
 *   yy    2-digit year             "25"
 *   MMMM  long month name          "April"
 *   MMM   short month name         "Apr"
 *   MM    2-digit month            "04"
 *   M     1-2 digit month          "4"
 *   dd    2-digit day              "07"
 *   d     1-2 digit day            "7"
 *   EEEE  long weekday             "Monday"
 *   EEE   short weekday            "Mon"
 *
 * Anything else (spaces, separators) is taken literally. Text wrapped in
 * single quotes is always literal (TR35-style), so token letters can appear
 * in prose: `MMMM d, yyyy 'at' HH:mm`, `d 'de' MMMM`. Two single quotes
 * (`''`) produce one literal quote.
 *
 * Calendar-system aware: uses the calendar's `monthName` and `formatDay` for
 * year/month/day rendering, so BS month names and Devanagari numerals work.
 */

const TOKENS = [
  'yyyy',
  'yy',
  'MMMM',
  'MMM',
  'MM',
  'M',
  'dd',
  'd',
  'EEEE',
  'EEE',
  'HH',
  'H',
  'hh',
  'h',
  'mm',
  'm',
  'ss',
  's',
  'a',
] as const;
type Token = (typeof TOKENS)[number];

const isToken = (s: string): s is Token => (TOKENS as ReadonlyArray<string>).includes(s);

/** Pre-defined named formats. Resolved against the supplied locale + calendar. */
export type FormatPreset = 'iso' | 'us' | 'eu' | 'short' | 'medium' | 'long';

const PRESET_PATTERNS: Record<FormatPreset, string> = {
  iso: 'yyyy-MM-dd',
  us: 'MM/dd/yyyy',
  eu: 'dd/MM/yyyy',
  short: 'M/d/yyyy',
  medium: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
};

export const resolvePattern = (input: string | FormatPreset | undefined): string => {
  if (!input) return PRESET_PATTERNS.iso;
  if (input in PRESET_PATTERNS) return PRESET_PATTERNS[input as FormatPreset];
  return input;
};

/**
 * Split a pattern into a sequence of tokens and literal segments. Single-quoted
 * runs are literal ('' escapes a quote), so letters inside them never tokenize.
 */
const tokenize = (pattern: string): ReadonlyArray<{ kind: 'token' | 'literal'; value: string }> => {
  const out: { kind: 'token' | 'literal'; value: string }[] = [];
  const pushLiteral = (value: string): void => {
    if (!value) return;
    const last = out[out.length - 1];
    if (last && last.kind === 'literal') last.value += value;
    else out.push({ kind: 'literal', value });
  };
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === "'") {
      // '' outside a quoted run is a single literal quote.
      if (pattern[i + 1] === "'") {
        pushLiteral("'");
        i += 2;
        continue;
      }
      // Quoted literal run: consume until the (unescaped) closing quote.
      let j = i + 1;
      let text = '';
      while (j < pattern.length) {
        if (pattern[j] === "'") {
          if (pattern[j + 1] === "'") {
            text += "'";
            j += 2;
            continue;
          }
          break;
        }
        text += pattern[j];
        j += 1;
      }
      pushLiteral(text);
      i = j + 1; // past the closing quote (or end for an unterminated run)
      continue;
    }
    let matched: string | null = null;
    for (const t of TOKENS) {
      if (pattern.startsWith(t, i)) {
        matched = t;
        break;
      }
    }
    if (matched) {
      out.push({ kind: 'token', value: matched });
      i += matched.length;
      continue;
    }
    // Take literal up to next token-start or quote
    let j = i;
    while (j < pattern.length) {
      if (pattern[j] === "'") break;
      let nextTokenAt = -1;
      for (const t of TOKENS) {
        if (pattern.startsWith(t, j)) {
          nextTokenAt = j;
          break;
        }
      }
      if (nextTokenAt === j) break;
      j += 1;
    }
    pushLiteral(pattern.slice(i, j));
    i = j;
  }
  return out;
};

/** Internal (non-barrel) export so the mask helper shares the exact tokenizer. */
export const tokenizePattern = tokenize;

const WEEKDAY_NAMES_REF = new Date(2024, 0, 7); // Sunday Jan 7, 2024
const weekdayName = (weekdayUS: number, style: 'long' | 'short', locale: string): string => {
  const ref = new Date(WEEKDAY_NAMES_REF.getTime() + weekdayUS * 86_400_000);
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(ref);
};

/**
 * Substitute each ASCII digit in `s` with the calendar's locale-aware digit
 *  used after padding so padded zeros also get localized (e.g. "0025" →
 * "००२५" for Devanagari).
 */
const localizeDigits = (s: string, calendar: CalendarSystem, locale: string): string => {
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      out += calendar.formatDay(code - 48, locale);
    } else {
      out += ch;
    }
  }
  return out;
};

export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const ZERO_TIME: TimeOfDay = { hour: 0, minute: 0, second: 0 };

export const formatWithPattern = (
  date: CalendarDate,
  pattern: string | FormatPreset,
  locale: string = 'en-US',
  calendar: CalendarSystem = new GregorianCalendar(),
  time: TimeOfDay | null = null,
): string => {
  const segments = tokenize(resolvePattern(pattern));
  const t = time ?? ZERO_TIME;
  let out = '';
  for (const seg of segments) {
    if (seg.kind === 'literal') {
      out += seg.value;
      continue;
    }
    out += renderToken(seg.value as Token, date, locale, calendar, t);
  }
  return out;
};

const renderToken = (
  t: Token,
  date: CalendarDate,
  locale: string,
  calendar: CalendarSystem,
  time: TimeOfDay,
): string => {
  const lz = (s: string): string => localizeDigits(s, calendar, locale);
  switch (t) {
    case 'yyyy':
      return lz(String(date.year).padStart(4, '0'));
    case 'yy':
      return lz(String(date.year).slice(-2).padStart(2, '0'));
    case 'MMMM':
      return calendar.monthName(date.month, 'long', locale);
    case 'MMM':
      return calendar.monthName(date.month, 'short', locale);
    case 'MM':
      return lz(String(date.month).padStart(2, '0'));
    case 'M':
      return lz(String(date.month));
    case 'dd':
      return lz(String(date.day).padStart(2, '0'));
    case 'd':
      return lz(String(date.day));
    case 'EEEE':
      return weekdayName(calendar.weekday(date), 'long', locale);
    case 'EEE':
      return weekdayName(calendar.weekday(date), 'short', locale);
    case 'HH':
      return lz(String(time.hour).padStart(2, '0'));
    case 'H':
      return lz(String(time.hour));
    case 'hh': {
      const h = ((time.hour + 11) % 12) + 1;
      return lz(String(h).padStart(2, '0'));
    }
    case 'h': {
      const h = ((time.hour + 11) % 12) + 1;
      return lz(String(h));
    }
    case 'mm':
      return lz(String(time.minute).padStart(2, '0'));
    case 'm':
      return lz(String(time.minute));
    case 'ss':
      return lz(String(time.second).padStart(2, '0'));
    case 's':
      return lz(String(time.second));
    case 'a':
      return time.hour < 12 ? 'AM' : 'PM';
  }
};

/**
 * Parse a string against the given pattern. Returns the CalendarDate if the
 * input matches the pattern; null otherwise. Month-name tokens are matched
 * case-insensitively against the calendar's localized month names.
 */
export interface ParsedDateTime {
  readonly date: CalendarDate;
  readonly time: TimeOfDay | null;
}

export const parseWithPattern = (
  input: string,
  pattern: string | FormatPreset,
  locale: string = 'en-US',
  calendar: CalendarSystem = new GregorianCalendar(),
): CalendarDate | null => {
  const parsed = parseDateTimeWithPattern(input, pattern, locale, calendar);
  return parsed ? parsed.date : null;
};

export const parseDateTimeWithPattern = (
  input: string,
  pattern: string | FormatPreset,
  locale: string = 'en-US',
  calendar: CalendarSystem = new GregorianCalendar(),
): ParsedDateTime | null => {
  const segments = tokenize(resolvePattern(pattern));
  let cursor = 0;
  // Fold localized numerals to ASCII first: every numeric token below matches
  // /^\d/, so Devanagari, Persian and Arabic-Indic output would never parse back.
  const trimmed = normalizeDigits(input.trim());
  const fields: ParseFields = {};

  for (const seg of segments) {
    if (seg.kind === 'literal') {
      if (!trimmed.startsWith(seg.value, cursor)) return null;
      cursor += seg.value.length;
      continue;
    }
    const t = seg.value as Token;
    const consumed = consumeToken(t, trimmed, cursor, locale, calendar, fields);
    if (consumed === null) return null;
    cursor = consumed;
  }
  if (cursor !== trimmed.length) return null;
  if (fields.year === undefined || fields.month === undefined || fields.day === undefined) {
    return null;
  }
  if (!calendar.isValidDate(fields.year, fields.month, fields.day)) return null;

  // Range-validate time fields: '99:99' must not parse as hour 99.
  if (fields.hour !== undefined) {
    const twelveHour = fields.hour12 === true || fields.period !== undefined;
    if (twelveHour ? fields.hour < 1 || fields.hour > 12 : fields.hour < 0 || fields.hour > 23) {
      return null;
    }
  }
  if (fields.minute !== undefined && (fields.minute < 0 || fields.minute > 59)) return null;
  if (fields.second !== undefined && (fields.second < 0 || fields.second > 59)) return null;

  let hour = fields.hour ?? 0;
  if (fields.period !== undefined && fields.hour !== undefined) {
    // 12-hour clock with AM/PM → normalise to 24h
    const h12 = fields.hour % 12;
    hour = fields.period === 'pm' ? h12 + 12 : h12;
  }

  const hasTime =
    fields.hour !== undefined || fields.minute !== undefined || fields.second !== undefined;
  return {
    date: { year: fields.year, month: fields.month, day: fields.day },
    time: hasTime ? { hour, minute: fields.minute ?? 0, second: fields.second ?? 0 } : null,
  };
};

interface ParseFields {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  /** True when the hour came from a 12-hour token (h/hh)  validated 1-12. */
  hour12?: boolean;
  minute?: number;
  second?: number;
  period?: 'am' | 'pm';
}

const consumeToken = (
  t: Token,
  input: string,
  start: number,
  locale: string,
  calendar: CalendarSystem,
  fields: ParseFields,
): number | null => {
  switch (t) {
    case 'yyyy': {
      const m = /^\d{4}/.exec(input.slice(start));
      if (!m) return null;
      fields.year = Number(m[0]);
      return start + 4;
    }
    case 'yy': {
      const m = /^\d{2}/.exec(input.slice(start));
      if (!m) return null;
      fields.year = resolveTwoDigitYear(Number(m[0]));
      return start + 2;
    }
    case 'MMMM':
    case 'MMM': {
      const style = t === 'MMMM' ? 'long' : 'short';
      for (let m = 1; m <= calendar.monthsInYear; m += 1) {
        const name = calendar.monthName(m, style, locale);
        if (input.slice(start, start + name.length).toLowerCase() === name.toLowerCase()) {
          fields.month = m;
          return start + name.length;
        }
      }
      return null;
    }
    case 'MM': {
      const m = /^\d{2}/.exec(input.slice(start));
      if (!m) return null;
      fields.month = Number(m[0]);
      return start + 2;
    }
    case 'M': {
      const m = /^\d{1,2}/.exec(input.slice(start));
      if (!m) return null;
      fields.month = Number(m[0]);
      return start + m[0].length;
    }
    case 'dd': {
      const m = /^\d{2}/.exec(input.slice(start));
      if (!m) return null;
      fields.day = Number(m[0]);
      return start + 2;
    }
    case 'd': {
      const m = /^\d{1,2}/.exec(input.slice(start));
      if (!m) return null;
      fields.day = Number(m[0]);
      return start + m[0].length;
    }
    case 'EEEE':
    case 'EEE': {
      // Weekday is informational; advance over any matching name (any weekday).
      const style = t === 'EEEE' ? 'long' : 'short';
      for (let w = 0; w < 7; w += 1) {
        const name = weekdayName(w, style, locale);
        if (input.slice(start, start + name.length).toLowerCase() === name.toLowerCase()) {
          return start + name.length;
        }
      }
      return null;
    }
    case 'HH':
    case 'hh': {
      const m = /^\d{2}/.exec(input.slice(start));
      if (!m) return null;
      fields.hour = Number(m[0]);
      if (t === 'hh') fields.hour12 = true;
      return start + 2;
    }
    case 'H':
    case 'h': {
      const m = /^\d{1,2}/.exec(input.slice(start));
      if (!m) return null;
      fields.hour = Number(m[0]);
      if (t === 'h') fields.hour12 = true;
      return start + m[0].length;
    }
    case 'mm': {
      const m = /^\d{2}/.exec(input.slice(start));
      if (!m) return null;
      fields.minute = Number(m[0]);
      return start + 2;
    }
    case 'm': {
      const m = /^\d{1,2}/.exec(input.slice(start));
      if (!m) return null;
      fields.minute = Number(m[0]);
      return start + m[0].length;
    }
    case 'ss': {
      const m = /^\d{2}/.exec(input.slice(start));
      if (!m) return null;
      fields.second = Number(m[0]);
      return start + 2;
    }
    case 's': {
      const m = /^\d{1,2}/.exec(input.slice(start));
      if (!m) return null;
      fields.second = Number(m[0]);
      return start + m[0].length;
    }
    case 'a': {
      const head = input.slice(start, start + 2).toUpperCase();
      if (head === 'AM') {
        fields.period = 'am';
        return start + 2;
      }
      if (head === 'PM') {
        fields.period = 'pm';
        return start + 2;
      }
      return null;
    }
  }
};

void isToken;
