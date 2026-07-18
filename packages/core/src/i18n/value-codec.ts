import { type CalendarSystem, GregorianCalendar } from '../calendar';
import { type CalendarDate, createRange, type DateRange } from '../domain';
import type { SelectionMode, SelectionValue } from '../selection';
import { parseDate } from './parser.js';
import {
  formatWithPattern,
  parseWithPattern,
  resolvePattern,
  type FormatPreset,
} from './pattern.js';

/**
 * Symmetric encode/decode for the form-input / value attribute of a date
 * picker. ISO-shaped on the wire, locale-aware on the way in (lenient).
 *
 *   single → "YYYY-MM-DD"
 *   range  → "YYYY-MM-DD/YYYY-MM-DD"
 *   multi  → "YYYY-MM-DD,YYYY-MM-DD,..."
 */

const isoOf = (calendar: CalendarSystem, date: CalendarDate): string => calendar.toIso(date);

export const encodeSelectionValue = (
  selection: SelectionValue,
  calendar: CalendarSystem,
): string => {
  switch (selection.mode) {
    case 'single':
      return selection.value ? isoOf(calendar, selection.value) : '';
    case 'range':
      return selection.value
        ? `${isoOf(calendar, selection.value.start)}/${isoOf(calendar, selection.value.end)}`
        : '';
    case 'multi':
      return selection.value.map(d => isoOf(calendar, d)).join(',');
  }
};

export interface DecodedSelection {
  readonly mode: SelectionMode;
  readonly single?: CalendarDate;
  readonly range?: DateRange;
  readonly multi?: ReadonlyArray<CalendarDate>;
}

/**
 * Separator-safe range splitting. `/` and `-` also appear INSIDE dates
 * ("01/01/2025", "2025-01-01"), so a naive split garbles them. Instead, try
 * every occurrence of each candidate separator (in priority order) and accept
 * the first split position where BOTH halves parse.
 */
const splitRangeText = (
  text: string,
  separators: ReadonlyArray<string>,
  parse: (s: string) => CalendarDate | null,
): readonly [CalendarDate, CalendarDate] | null => {
  const lower = text.toLowerCase();
  for (const sep of separators) {
    const needle = sep.toLowerCase();
    let idx = lower.indexOf(needle);
    while (idx !== -1) {
      if (idx > 0 && idx + needle.length < text.length) {
        const a = parse(text.slice(0, idx).trim());
        const b = parse(text.slice(idx + needle.length).trim());
        if (a && b) return [a, b];
      }
      idx = lower.indexOf(needle, idx + 1);
    }
  }
  return null;
};

/**
 * Separator-safe multi splitting. Commas appear inside "Apr 7, 2025", so a
 * separator only counts when EVERY resulting part parses. Falls back to the
 * lenient keep-what-parses behaviour when no candidate splits cleanly.
 */
const splitMultiText = (
  text: string,
  separators: ReadonlyArray<string>,
  parse: (s: string) => CalendarDate | null,
): CalendarDate[] | null => {
  for (const sep of separators) {
    const parts = text.split(sep);
    if (parts.length < 2) continue;
    const dates = parts.map(p => parse(p.trim()));
    if (dates.every((d): d is CalendarDate => d !== null)) return dates;
  }
  const single = parse(text);
  if (single) return [single];
  // Lenient fallback: split on any , or ; and keep what parses.
  const dates: CalendarDate[] = [];
  for (const part of text.split(/\s*[,;]\s*/)) {
    const d = parse(part);
    if (d) dates.push(d);
  }
  return dates.length > 0 ? dates : null;
};

/** Range separator candidates, most explicit first. Bare `-`/`/` last. */
const RANGE_SEPARATORS: ReadonlyArray<string> = [' – ', ' — ', ' - ', ' to ', '–', '—', '/', '-'];

/**
 * Lenient decoder. Accepts ISO (`YYYY-MM-DD`) and locale-formatted strings;
 * returns null for empty input, throws nothing on malformed input — instead
 * leaves the corresponding field undefined and returns whatever it could parse.
 */
export const decodeSelectionValue = (
  text: string,
  mode: SelectionMode,
  locale: string = 'en-US',
): DecodedSelection | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parse = (s: string): CalendarDate | null => parseDate(s, locale);

  switch (mode) {
    case 'single': {
      const d = parse(trimmed);
      return d ? { mode, single: d } : null;
    }
    case 'range': {
      const pair = splitRangeText(trimmed, RANGE_SEPARATORS, parse);
      if (!pair) return null;
      return { mode, range: createRange(pair[0], pair[1]) };
    }
    case 'multi': {
      const dates = splitMultiText(trimmed, [';', ','], parse);
      return dates ? { mode, multi: dates } : null;
    }
  }
};

// --- Pattern-aware selection formatting ---------------------------------

const defaultSeparators = (pattern: string | FormatPreset): { range: string; multi: string } => {
  const isIso = resolvePattern(pattern) === 'yyyy-MM-dd';
  return isIso ? { range: '/', multi: ',' } : { range: ' – ', multi: '; ' };
};

export interface FormatSelectionOptions {
  readonly pattern?: string | FormatPreset;
  readonly locale?: string;
  readonly calendar?: CalendarSystem;
  readonly rangeSeparator?: string;
  readonly multiSeparator?: string;
  /** Optional time-of-day passed to the pattern engine for HH/mm/ss/a tokens. */
  readonly time?: { hour: number; minute: number; second: number } | null;
}

export const formatSelection = (
  selection: SelectionValue,
  options: FormatSelectionOptions = {},
): string => {
  const pattern = options.pattern ?? 'iso';
  const locale = options.locale ?? 'en-US';
  const calendar = options.calendar ?? new GregorianCalendar();
  const defaults = defaultSeparators(pattern);
  const rangeSep = options.rangeSeparator ?? defaults.range;
  const multiSep = options.multiSeparator ?? defaults.multi;
  const time = options.time ?? null;
  const fmt = (d: CalendarDate): string => formatWithPattern(d, pattern, locale, calendar, time);

  switch (selection.mode) {
    case 'single':
      return selection.value ? fmt(selection.value) : '';
    case 'range':
      return selection.value
        ? `${fmt(selection.value.start)}${rangeSep}${fmt(selection.value.end)}`
        : '';
    case 'multi':
      return selection.value.map(fmt).join(multiSep);
  }
};

export const parseSelection = (
  text: string,
  mode: SelectionMode,
  options: FormatSelectionOptions = {},
): DecodedSelection | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const pattern = options.pattern ?? 'iso';
  const locale = options.locale ?? 'en-US';
  const calendar = options.calendar ?? new GregorianCalendar();
  const defaults = defaultSeparators(pattern);
  const rangeSep = options.rangeSeparator ?? defaults.range;
  const multiSep = options.multiSeparator ?? defaults.multi;

  const parseOne = (s: string): CalendarDate | null => {
    const p = parseWithPattern(s, pattern, locale, calendar);
    if (p) return p;
    return parseDate(s, locale);
  };

  switch (mode) {
    case 'single': {
      const d = parseOne(trimmed);
      return d ? { mode, single: d } : null;
    }
    case 'range': {
      // Configured separator first, then the shared candidates.
      const separators = [rangeSep, ...RANGE_SEPARATORS.filter(s => s !== rangeSep)];
      const pair = splitRangeText(trimmed, separators, parseOne);
      if (!pair) return null;
      return { mode, range: createRange(pair[0], pair[1]) };
    }
    case 'multi': {
      const separators = [multiSep, ...[';', ','].filter(s => s !== multiSep)];
      const dates = splitMultiText(trimmed, separators, parseOne);
      return dates ? { mode, multi: dates } : null;
    }
  }
};
