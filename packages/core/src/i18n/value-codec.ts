import type { CalendarSystem } from '../calendar/calendar-system.js';
import type { CalendarDate } from '../domain/calendar-date.js';
import { createRange, type DateRange } from '../domain/date-range.js';
import { GregorianCalendar } from '../calendar/gregorian-calendar.js';
import type { SelectionMode, SelectionValue } from '../selection/selection-strategy.js';
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

  switch (mode) {
    case 'single': {
      const d = parseDate(trimmed, locale);
      return d ? { mode, single: d } : null;
    }
    case 'range': {
      const parts = trimmed.split(/\s*(?:\/|[–—-]{1,2}|\sto\s)\s*/i);
      if (parts.length < 2) return null;
      const a = parseDate(parts[0] as string, locale);
      const b = parseDate(parts[1] as string, locale);
      if (!a || !b) return null;
      return { mode, range: createRange(a, b) };
    }
    case 'multi': {
      const parts = trimmed.split(/\s*[,;]\s*/);
      const dates: CalendarDate[] = [];
      for (const part of parts) {
        const d = parseDate(part, locale);
        if (d) dates.push(d);
      }
      return dates.length > 0 ? { mode, multi: dates } : null;
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

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      const re = new RegExp(`\\s*(?:${escapeRegex(rangeSep)}|\\/|[–—-]{1,2}|\\sto\\s)\\s*`, 'i');
      const parts = trimmed.split(re);
      if (parts.length < 2) return null;
      const a = parseOne(parts[0] as string);
      const b = parseOne(parts[1] as string);
      if (!a || !b) return null;
      return { mode, range: createRange(a, b) };
    }
    case 'multi': {
      const re = new RegExp(`\\s*(?:${escapeRegex(multiSep)}|[,;])\\s*`);
      const parts = trimmed.split(re);
      const dates: CalendarDate[] = [];
      for (const part of parts) {
        const d = parseOne(part);
        if (d) dates.push(d);
      }
      return dates.length > 0 ? { mode, multi: dates } : null;
    }
  }
};
