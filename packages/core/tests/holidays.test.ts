import { describe, expect, it } from 'vitest';
import { composeHolidays, npHolidays, ukHolidays, usHolidays } from '../src/index.js';

describe('usHolidays', () => {
  const list = usHolidays(2025);

  it('includes Independence Day on July 4', () => {
    const ind = list.find(h => h.label === 'Independence Day');
    expect(ind?.date).toEqual({ year: 2025, month: 7, day: 4 });
  });

  it('Memorial Day is the last Monday of May', () => {
    // May 2025: last Monday is May 26
    const m = list.find(h => h.label === 'Memorial Day');
    expect(m?.date).toEqual({ year: 2025, month: 5, day: 26 });
  });

  it('Thanksgiving is the 4th Thursday of November', () => {
    // November 2025: 4th Thursday is Nov 27
    const t = list.find(h => h.label === 'Thanksgiving');
    expect(t?.date).toEqual({ year: 2025, month: 11, day: 27 });
  });
});

describe('ukHolidays', () => {
  const list = ukHolidays(2025);

  it('Easter Sunday 2025 is April 20 (Meeus)', () => {
    // Good Friday = Easter - 2 = April 18, 2025
    const gf = list.find(h => h.label === 'Good Friday');
    expect(gf?.date).toEqual({ year: 2025, month: 4, day: 18 });
  });

  it('Boxing Day is December 26', () => {
    expect(list.find(h => h.label === 'Boxing Day')?.date).toEqual({
      year: 2025,
      month: 12,
      day: 26,
    });
  });
});

describe('npHolidays', () => {
  const list = npHolidays(2025);
  it('includes Nepali New Year', () => {
    const ny = list.find(h => h.label?.includes('Nepali New Year'));
    expect(ny?.date).toEqual({ year: 2025, month: 4, day: 14 });
  });
});

describe('composeHolidays', () => {
  it('flattens multiple sources', () => {
    const combined = composeHolidays(usHolidays(2025), ukHolidays(2025));
    expect(combined.length).toBeGreaterThan(usHolidays(2025).length);
  });
});
