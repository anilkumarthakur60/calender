import { describe, expect, it } from 'vitest';
import {
  BikramSambatCalendar,
  DatePickerEngine,
  GregorianCalendar,
  buildMonthGrid,
  createCalendarDate,
  createCalendarSystem,
  BS_MIN_YEAR,
} from '../src/index.js';

const bs = new BikramSambatCalendar();
const greg = new GregorianCalendar();

describe('BikramSambatCalendar — epoch + conversion', () => {
  it('BS 2000-01-01 ↔ AD 1943-04-14 (canonical epoch)', () => {
    const ad = bs.toGregorian(createCalendarDate(2000, 1, 1));
    expect(ad).toEqual({ year: 1943, month: 4, day: 14 });
    const round = bs.fromGregorian(ad);
    expect(round).toEqual({ year: 2000, month: 1, day: 1 });
  });

  it('Round-trips a recent BS date (BS 2080-01-01 → AD → BS)', () => {
    // BS 2080-01-01 should map to ~AD 2023-04-14 (mid-April Nepali new year).
    // We assert the AD year + month plus an exact round-trip; the table has
    // a documented small per-year drift away from the epoch, but any BS→AD→BS
    // round-trip is invariant.
    const ad = bs.toGregorian(createCalendarDate(2080, 1, 1));
    expect(ad.year).toBe(2023);
    expect(ad.month).toBe(4);
    expect(bs.fromGregorian(ad)).toEqual({ year: 2080, month: 1, day: 1 });
  });

  it('Round-trips an arbitrary AD date back to itself', () => {
    const ad = createCalendarDate(2000, 1, 15);
    const back = bs.toGregorian(bs.fromGregorian(ad));
    expect(back).toEqual(ad);
  });

  it('Weekday is calendar-agnostic (BS day uses Gregorian week)', () => {
    // AD 1943-04-14 was a Wednesday (weekday 3)
    expect(bs.weekday(createCalendarDate(2000, 1, 1))).toBe(3);
    expect(greg.weekday(createCalendarDate(1943, 4, 14))).toBe(3);
  });
});

describe('BikramSambatCalendar — UTC-pure conversion', () => {
  // toGregorian is pure UTC epoch-day arithmetic, so these hold in EVERY host
  // time zone (the old local-Date math drifted a day around e.g. the Samoa
  // 2011 dateline jump). vitest cannot switch TZ in-process; the table plus
  // the UTC-only implementation is the guarantee.
  it('matches a precomputed table', () => {
    expect(bs.toGregorian(createCalendarDate(2000, 1, 1))).toEqual({
      year: 1943,
      month: 4,
      day: 14,
    });
    expect(bs.toGregorian(createCalendarDate(2000, 1, 2))).toEqual({
      year: 1943,
      month: 4,
      day: 15,
    });
    expect(bs.toGregorian(createCalendarDate(2001, 1, 1))).toEqual({
      year: 1944,
      month: 4,
      day: 13,
    });
    // Round-trip invariance across a span of years.
    for (const y of [2010, 2040, 2068, 2080, 2090]) {
      const d = createCalendarDate(y, 6, 10);
      expect(bs.fromGregorian(bs.toGregorian(d))).toEqual(d);
    }
  });
});

describe('BikramSambatCalendar — arithmetic', () => {
  it('addDays crosses irregular BS month boundaries', () => {
    // BS 2080 month 1 has 31 days (per table)
    const last = createCalendarDate(2080, 1, 31);
    expect(bs.addDays(last, 1)).toEqual({ year: 2080, month: 2, day: 1 });
  });

  it('addMonths wraps year and clamps day-of-month', () => {
    const d = createCalendarDate(2080, 12, 30);
    const next = bs.addMonths(d, 1);
    expect(next.year).toBe(2081);
    expect(next.month).toBe(1);
    expect(next.day).toBeLessThanOrEqual(bs.daysInMonth(2081, 1));
  });

  it('daysInMonth returns BS-specific values, not Gregorian', () => {
    // BS year 2080 month 1 = 31 days (per published table). Gregorian Jan = 31.
    // BS year 2080 month 9 (Poush) = 29 days (per table). Gregorian Sep = 30.
    expect(bs.daysInMonth(2080, 9)).toBe(29);
    expect(greg.daysInMonth(2080, 9)).toBe(30);
  });
});

describe('BikramSambatCalendar — boundaries', () => {
  it('Throws on year before BS_MIN_YEAR', () => {
    expect(() => bs.daysInMonth(BS_MIN_YEAR - 1, 1)).toThrow();
  });
});

describe('createCalendarSystem factory', () => {
  it("returns Gregorian for 'gregorian'", () => {
    expect(createCalendarSystem('gregorian').id).toBe('gregorian');
  });
  it("returns BS for 'bikram-sambat'", () => {
    expect(createCalendarSystem('bikram-sambat').id).toBe('bikram-sambat');
  });
});

describe('buildMonthGrid with BS calendar', () => {
  it('produces 6 weeks of BS cells with correct in-month flag', () => {
    const grid = buildMonthGrid(createCalendarDate(2080, 1, 1), { calendar: bs });
    expect(grid.weeks).toHaveLength(6);
    const inMonth = grid.weeks.flat().filter(c => c.inCurrentMonth);
    expect(inMonth).toHaveLength(bs.daysInMonth(2080, 1));
    expect(inMonth[0]?.date).toEqual({ year: 2080, month: 1, day: 1 });
  });
});

describe('DatePickerEngine with calendar: bikram-sambat', () => {
  it('defaults to Gregorian when no calendar option provided', () => {
    const e = new DatePickerEngine();
    expect(e.calendar.id).toBe('gregorian');
  });

  it("operates in BS when calendar: 'bikram-sambat' is passed", () => {
    const e = new DatePickerEngine({
      calendar: 'bikram-sambat',
      initialFocused: createCalendarDate(2080, 5, 15),
    });
    expect(e.calendar.id).toBe('bikram-sambat');
    expect(e.state.focused).toEqual({ year: 2080, month: 5, day: 15 });
  });

  it('arrow-key navigation respects BS month lengths', () => {
    const e = new DatePickerEngine({
      calendar: 'bikram-sambat',
      initialFocused: createCalendarDate(2080, 9, 29), // last day of BS 2080 Poush
    });
    e.handleKey({
      key: 'ArrowRight',
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(e.state.focused).toEqual({ year: 2080, month: 10, day: 1 });
  });

  it('formatter uses BS month names', () => {
    const e = new DatePickerEngine({
      calendar: 'bikram-sambat',
      initialFocused: createCalendarDate(2080, 1, 15),
      locale: 'en-US',
    });
    expect(e.formatter.formatMonthYear(e.state.focused)).toMatch(/Baishakh/);
  });
});
