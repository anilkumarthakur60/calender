import { describe, expect, it } from 'vitest';
import { buildMonthGrid, createCalendarDate, isoWeekOfYear } from '../src/index.js';

describe('isoWeekOfYear', () => {
  // Expectations computed in UTC from the ISO-8601 definition; the function
  // must return these regardless of the host time zone (incl. UTC+13/+14).
  const table: ReadonlyArray<[number, number, number, number]> = [
    [2026, 1, 5, 2], // Monday after week 1 (Jan 1 2026 is a Thursday)
    [2025, 12, 29, 1], // Monday of the week containing Jan 1 2026 → week 1 of 2026
    [2021, 1, 1, 53], // Friday, belongs to 2020's week 53
    [2016, 1, 4, 1], // First Monday of 2016
    [2015, 12, 31, 53],
    [2020, 12, 31, 53],
    [2024, 7, 1, 27],
    [2024, 1, 1, 1],
  ];

  for (const [y, m, d, week] of table) {
    it(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} → week ${week}`, () => {
      expect(isoWeekOfYear(createCalendarDate(y, m, d))).toBe(week);
    });
  }
});

describe('buildMonthGrid weekNumbers option', () => {
  it('exposes one ISO week number per row', () => {
    const grid = buildMonthGrid(createCalendarDate(2025, 1, 15), {
      firstDayOfWeek: 1,
      weekNumbers: true,
    });
    expect(grid.weekNumbers).toBeDefined();
    expect(grid.weekNumbers).toHaveLength(grid.weeks.length);
    // Monday-start January 2025 grid begins on Dec 30 2024 → ISO week 1 of 2025.
    expect(grid.weekNumbers?.[0]).toBe(1);
    expect(grid.weekNumbers?.[1]).toBe(2);
  });

  it('is absent when the option is off', () => {
    const grid = buildMonthGrid(createCalendarDate(2025, 1, 15));
    expect(grid.weekNumbers).toBeUndefined();
  });
});
