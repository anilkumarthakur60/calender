import { describe, expect, it } from 'vitest';
import {
  DatePickerEngine,
  buildMonthGrid,
  createCalendarDate,
  addDays,
  createRange,
  isInRange,
  parseDate,
  RangeSelectionStrategy,
  SingleSelectionStrategy,
  MultiSelectionStrategy,
} from '../src/index.js';

describe('CalendarDate arithmetic', () => {
  it('addDays crosses month boundaries', () => {
    const d = addDays(createCalendarDate(2025, 1, 31), 1);
    expect(d).toEqual({ year: 2025, month: 2, day: 1 });
  });
  it('addDays handles leap years', () => {
    const d = addDays(createCalendarDate(2024, 2, 28), 1);
    expect(d).toEqual({ year: 2024, month: 2, day: 29 });
  });
});

describe('MonthGrid', () => {
  it('emits 6 weeks when fixedWeeks=true', () => {
    const grid = buildMonthGrid(createCalendarDate(2025, 5, 15));
    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks[0]).toHaveLength(7);
  });
});

describe('SelectionStrategy', () => {
  it('single: replaces previous selection', () => {
    const s = new SingleSelectionStrategy();
    const a = s.select(s.initial(), createCalendarDate(2025, 1, 1));
    const b = s.select(a, createCalendarDate(2025, 1, 2));
    expect(b.value).toEqual({ year: 2025, month: 1, day: 2 });
  });

  it('range: anchor → completion', () => {
    const s = new RangeSelectionStrategy();
    const a = s.select(s.initial(), createCalendarDate(2025, 1, 5));
    expect(a.anchor).not.toBeNull();
    const b = s.select(a, createCalendarDate(2025, 1, 1));
    expect(b.value).not.toBeNull();
    expect(b.value!.start).toEqual({ year: 2025, month: 1, day: 1 });
    expect(b.value!.end).toEqual({ year: 2025, month: 1, day: 5 });
  });

  it('multi: toggles dates and respects max', () => {
    const s = new MultiSelectionStrategy({ max: 2 });
    let v = s.select(s.initial(), createCalendarDate(2025, 1, 1));
    v = s.select(v, createCalendarDate(2025, 1, 2));
    v = s.select(v, createCalendarDate(2025, 1, 3));
    expect(v.value).toHaveLength(2);
    expect(v.value[0]?.day).toBe(2);
  });
});

describe('DatePickerEngine', () => {
  it('initialises with today focused', () => {
    const e = new DatePickerEngine();
    expect(e.state.focused).toBeDefined();
    expect(e.state.grid.weeks.length).toBeGreaterThan(0);
  });

  it('respects min/max via constraint', () => {
    const e = new DatePickerEngine({
      min: createCalendarDate(2025, 1, 1),
      max: createCalendarDate(2025, 12, 31),
    });
    expect(e.isDisabled(createCalendarDate(2024, 12, 31))).toBe(true);
    expect(e.isDisabled(createCalendarDate(2025, 6, 1))).toBe(false);
  });

  it('emits change on focus()', () => {
    const e = new DatePickerEngine({ initialFocused: createCalendarDate(2025, 1, 1) });
    let count = 0;
    e.on('change', () => {
      count += 1;
    });
    e.focus(createCalendarDate(2025, 1, 5));
    expect(count).toBe(1);
    expect(e.state.focused).toEqual({ year: 2025, month: 1, day: 5 });
  });

  it('keyboard arrow keys move focus by one day', () => {
    const e = new DatePickerEngine({ initialFocused: createCalendarDate(2025, 6, 15) });
    e.handleKey({
      key: 'ArrowRight',
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(e.state.focused.day).toBe(16);
    e.handleKey({
      key: 'ArrowDown',
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    });
    expect(e.state.focused.day).toBe(23);
  });
});

describe('parser', () => {
  it('parses ISO', () => {
    expect(parseDate('2025-04-15')).toEqual({ year: 2025, month: 4, day: 15 });
  });
  it('returns null on bogus input', () => {
    expect(parseDate('not a date')).toBeNull();
  });
});

describe('DateRange', () => {
  it('isInRange inclusive bounds', () => {
    const r = createRange(createCalendarDate(2025, 1, 1), createCalendarDate(2025, 1, 10));
    expect(isInRange(createCalendarDate(2025, 1, 1), r)).toBe(true);
    expect(isInRange(createCalendarDate(2025, 1, 10), r)).toBe(true);
    expect(isInRange(createCalendarDate(2025, 1, 11), r)).toBe(false);
  });
});
