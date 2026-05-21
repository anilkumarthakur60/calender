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

  it('1404 Farvardin 1 maps to ~March 21, 2025', () => {
    const ad = persian.toGregorian(createCalendarDate(1404, 1, 1));
    expect(ad.year).toBe(2025);
    expect(ad.month).toBe(3);
    // Persian new year is March 20-21 depending on tropical equinox; allow ±1
    expect(Math.abs(ad.day - 21)).toBeLessThanOrEqual(1);
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
