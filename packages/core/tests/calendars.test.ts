import { describe, expect, it } from 'vitest';
import {
  BuddhistCalendar,
  PersianCalendar,
  createCalendarDate,
  createCalendarSystem,
} from '../src/index.js';

describe('BuddhistCalendar', () => {
  const buddhist = new BuddhistCalendar();

  it('reports BE = AD + 543', () => {
    // AD 2025-04-15 → BE 2568-04-15
    expect(buddhist.fromGregorian(createCalendarDate(2025, 4, 15))).toEqual({
      year: 2568,
      month: 4,
      day: 15,
    });
  });

  it('round-trips through Gregorian', () => {
    const be = createCalendarDate(2568, 4, 15);
    expect(buddhist.fromGregorian(buddhist.toGregorian(be))).toEqual(be);
  });

  it('uses Gregorian month lengths', () => {
    expect(buddhist.daysInMonth(2568, 2)).toBe(28); // AD 2025 is not a leap year
    expect(buddhist.daysInMonth(2567, 2)).toBe(29); // AD 2024 is a leap year
  });
});

describe('PersianCalendar', () => {
  const persian = new PersianCalendar();

  it('Nowruz maps to the exact Gregorian day ICU reports', () => {
    // Exact, not +/-1: a one-day tolerance here previously hid a leap-rule bug
    // that shifted an entire year at a time.
    expect(persian.toGregorian(createCalendarDate(1404, 1, 1))).toEqual({
      year: 2025,
      month: 3,
      day: 21,
    });
    expect(persian.toGregorian(createCalendarDate(1403, 1, 1))).toEqual({
      year: 2024,
      month: 3,
      day: 20,
    });
  });

  it("agrees with Intl's persian calendar day-for-day across a decade", () => {
    const icu = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    });
    let mismatches = 0;
    for (let t = Date.UTC(2020, 0, 1); t <= Date.UTC(2030, 0, 1); t += 86_400_000) {
      const d = new Date(t);
      const mine = persian.fromGregorian(
        createCalendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()),
      );
      const parts = Object.fromEntries(icu.formatToParts(d).map(x => [x.type, x.value]));
      if (
        mine.year !== Number(parts['year']) ||
        mine.month !== Number(parts['month']) ||
        mine.day !== Number(parts['day'])
      ) {
        mismatches += 1;
      }
    }
    expect(mismatches).toBe(0);
  });

  it('leap years match the 33-year cycle (1403 leap, 1404 not)', () => {
    expect(persian.isValidDate(1403, 12, 30)).toBe(true);
    expect(persian.isValidDate(1404, 12, 30)).toBe(false);
  });

  it('round-trips through Gregorian', () => {
    const sh = createCalendarDate(1404, 5, 15);
    const back = persian.fromGregorian(persian.toGregorian(sh));
    expect(back).toEqual(sh);
  });

  it('month lengths: 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29|30', () => {
    expect(persian.daysInMonth(1404, 1)).toBe(31);
    expect(persian.daysInMonth(1404, 6)).toBe(31);
    expect(persian.daysInMonth(1404, 7)).toBe(30);
    expect(persian.daysInMonth(1404, 11)).toBe(30);
    // Esfand has 29 days in a non-leap year
    expect([29, 30]).toContain(persian.daysInMonth(1404, 12));
  });
});

describe('createCalendarSystem factory', () => {
  it('returns the right instance for each id', () => {
    expect(createCalendarSystem('gregorian').id).toBe('gregorian');
    expect(createCalendarSystem('bikram-sambat').id).toBe('bikram-sambat');
    expect(createCalendarSystem('buddhist').id).toBe('buddhist');
    expect(createCalendarSystem('persian').id).toBe('persian');
  });
});
