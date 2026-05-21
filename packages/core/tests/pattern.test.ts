import { describe, expect, it } from 'vitest';
import {
  BikramSambatCalendar,
  createCalendarDate,
  formatSelection,
  formatWithPattern,
  parseSelection,
  parseWithPattern,
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
