import { describe, expect, it } from 'vitest';
import {
  BikramSambatCalendar,
  createCalendarDate,
  formatSelection,
  formatWithPattern,
  parseDate,
  parseDateTimeWithPattern,
  parseSelection,
  parseWithPattern,
  resolveTwoDigitYear,
} from '../src/index.js';

describe('formatWithPattern', () => {
  const d = createCalendarDate(2025, 4, 7);

  it('iso preset', () => {
    expect(formatWithPattern(d, 'iso')).toBe('2025-04-07');
  });
  it('us preset', () => {
    expect(formatWithPattern(d, 'us')).toBe('04/07/2025');
  });
  it('eu preset', () => {
    expect(formatWithPattern(d, 'eu')).toBe('07/04/2025');
  });
  it('custom dd/MM/yyyy', () => {
    expect(formatWithPattern(d, 'dd/MM/yyyy')).toBe('07/04/2025');
  });
  it('long month name', () => {
    expect(formatWithPattern(d, 'MMMM d, yyyy', 'en-US')).toBe('April 7, 2025');
  });
  it('short month name', () => {
    expect(formatWithPattern(d, 'MMM d, yyyy', 'en-US')).toBe('Apr 7, 2025');
  });
  it('literals + tokens', () => {
    expect(formatWithPattern(d, 'yyyy.MM.dd')).toBe('2025.04.07');
  });
});

describe('parseWithPattern', () => {
  it('iso round-trip', () => {
    expect(parseWithPattern('2025-04-07', 'iso')).toEqual({ year: 2025, month: 4, day: 7 });
  });
  it('us round-trip', () => {
    expect(parseWithPattern('04/07/2025', 'us')).toEqual({ year: 2025, month: 4, day: 7 });
  });
  it('eu round-trip', () => {
    expect(parseWithPattern('07/04/2025', 'eu')).toEqual({ year: 2025, month: 4, day: 7 });
  });
  it('returns null on malformed', () => {
    expect(parseWithPattern('not a date', 'iso')).toBeNull();
    expect(parseWithPattern('04-07-2025', 'iso')).toBeNull();
  });
  it('long month name', () => {
    expect(parseWithPattern('April 7, 2025', 'MMMM d, yyyy', 'en-US')).toEqual({
      year: 2025,
      month: 4,
      day: 7,
    });
  });
  it('short month name', () => {
    expect(parseWithPattern('Apr 7, 2025', 'MMM d, yyyy', 'en-US')).toEqual({
      year: 2025,
      month: 4,
      day: 7,
    });
  });
  it('rejects invalid date-for-calendar', () => {
    expect(parseWithPattern('2025-02-30', 'iso')).toBeNull();
  });
});

describe('quoted literals (TR35 single-quote escaping)', () => {
  const d = createCalendarDate(2025, 4, 7);
  const time = { hour: 13, minute: 5, second: 0 };

  it("format: letters in 'at' stay literal", () => {
    expect(formatWithPattern(d, "MMMM d, yyyy 'at' HH:mm", 'en-US', undefined, time)).toBe(
      'April 7, 2025 at 13:05',
    );
  });

  it("parse: 'at' literal round-trips with time", () => {
    const parsed = parseDateTimeWithPattern('April 7, 2025 at 13:05', "MMMM d, yyyy 'at' HH:mm");
    expect(parsed?.date).toEqual({ year: 2025, month: 4, day: 7 });
    expect(parsed?.time).toEqual({ hour: 13, minute: 5, second: 0 });
  });

  it("format: Spanish d 'de' MMMM 'de' yyyy", () => {
    expect(formatWithPattern(d, "d 'de' MMMM 'de' yyyy", 'es-ES')).toBe('7 de abril de 2025');
  });

  it("parse: Spanish d 'de' MMMM 'de' yyyy", () => {
    expect(parseWithPattern('7 de abril de 2025', "d 'de' MMMM 'de' yyyy", 'es-ES')).toEqual({
      year: 2025,
      month: 4,
      day: 7,
    });
  });

  it("'' renders a literal quote in both directions", () => {
    expect(formatWithPattern(d, "yyyy''MM")).toBe("2025'04");
    expect(parseWithPattern("2025'04'07", "yyyy''MM''dd")).toEqual({
      year: 2025,
      month: 4,
      day: 7,
    });
  });
});

describe('time field range validation', () => {
  it("rejects '99:99'", () => {
    expect(parseDateTimeWithPattern('2025-01-01 99:99', 'yyyy-MM-dd HH:mm')).toBeNull();
  });
  it('accepts 23:59, rejects 24:00', () => {
    expect(parseDateTimeWithPattern('2025-01-01 23:59', 'yyyy-MM-dd HH:mm')?.time).toEqual({
      hour: 23,
      minute: 59,
      second: 0,
    });
    expect(parseDateTimeWithPattern('2025-01-01 24:00', 'yyyy-MM-dd HH:mm')).toBeNull();
  });
  it('12-hour tokens require 1-12', () => {
    expect(parseDateTimeWithPattern('2025-01-01 13:00 PM', 'yyyy-MM-dd h:mm a')).toBeNull();
    expect(parseDateTimeWithPattern('2025-01-01 12:30 AM', 'yyyy-MM-dd h:mm a')?.time).toEqual({
      hour: 0,
      minute: 30,
      second: 0,
    });
  });
  it('rejects seconds > 59', () => {
    expect(parseDateTimeWithPattern('2025-01-01 10:00:61', 'yyyy-MM-dd HH:mm:ss')).toBeNull();
  });
});

describe('two-digit-year pivot (shared 70 rule)', () => {
  it('helper: 00-69 → 20xx, 70-99 → 19xx', () => {
    expect(resolveTwoDigitYear(0)).toBe(2000);
    expect(resolveTwoDigitYear(69)).toBe(2069);
    expect(resolveTwoDigitYear(70)).toBe(1970);
    expect(resolveTwoDigitYear(99)).toBe(1999);
  });
  it('lenient parser and pattern parser agree', () => {
    expect(parseDate('12/31/99', 'en-US')?.year).toBe(1999);
    expect(parseWithPattern('12/31/99', 'MM/dd/yy')?.year).toBe(1999);
    expect(parseDate('12/31/69', 'en-US')?.year).toBe(2069);
    expect(parseWithPattern('12/31/69', 'MM/dd/yy')?.year).toBe(2069);
  });
});

describe('formatWithPattern + Bikram Sambat', () => {
  const bs = new BikramSambatCalendar();
  it('BS English month name', () => {
    expect(formatWithPattern({ year: 2080, month: 1, day: 15 }, 'MMMM d, yyyy', 'en-US', bs)).toBe(
      'Baishakh 15, 2080',
    );
  });
  it('BS Nepali Devanagari', () => {
    expect(formatWithPattern({ year: 2080, month: 1, day: 15 }, 'MMMM d, yyyy', 'ne-NP', bs)).toBe(
      'बैशाख १५, २०८०',
    );
  });
});

describe('formatSelection / parseSelection', () => {
  it('single round-trips through a custom format', () => {
    const sel = { mode: 'single' as const, value: createCalendarDate(2025, 4, 15) };
    const txt = formatSelection(sel, { pattern: 'dd/MM/yyyy' });
    expect(txt).toBe('15/04/2025');
    const back = parseSelection(txt, 'single', { pattern: 'dd/MM/yyyy' });
    expect(back?.single).toEqual({ year: 2025, month: 4, day: 15 });
  });

  it('range uses " – " separator for human formats', () => {
    const sel = {
      mode: 'range' as const,
      value: { start: createCalendarDate(2025, 4, 1), end: createCalendarDate(2025, 4, 15) },
      anchor: null,
    };
    const txt = formatSelection(sel, { pattern: 'medium', locale: 'en-US' });
    expect(txt).toBe('Apr 1, 2025 – Apr 15, 2025');
    const back = parseSelection(txt, 'range', { pattern: 'medium', locale: 'en-US' });
    expect(back?.range?.start).toEqual({ year: 2025, month: 4, day: 1 });
    expect(back?.range?.end).toEqual({ year: 2025, month: 4, day: 15 });
  });

  it('range with iso uses "/" separator', () => {
    const sel = {
      mode: 'range' as const,
      value: { start: createCalendarDate(2025, 4, 1), end: createCalendarDate(2025, 4, 15) },
      anchor: null,
    };
    expect(formatSelection(sel, { pattern: 'iso' })).toBe('2025-04-01/2025-04-15');
  });
});
