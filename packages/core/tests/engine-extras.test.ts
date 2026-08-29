import { describe, expect, it } from 'vitest';
import {
  BUILTIN_PRESETS,
  DatePickerEngine,
  EventBus,
  MultiSelectionStrategy,
  createCalendarDate,
  resolveLocaleConfig,
  todayCalendarDate,
  type CalendarDate,
} from '../src/index.js';

const key = (k: string, mods: Partial<Record<'shift' | 'ctrl', boolean>> = {}) => ({
  key: k,
  shiftKey: mods.shift ?? false,
  ctrlKey: mods.ctrl ?? false,
  altKey: false,
  metaKey: false,
});

describe('MultiSelectionStrategy  FIFO max trimming', () => {
  it('drops the oldest-SELECTED date, not the chronologically earliest', () => {
    const s = new MultiSelectionStrategy({ max: 2 });
    let v = s.select(s.initial(), createCalendarDate(2025, 1, 3)); // selected first
    v = s.select(v, createCalendarDate(2025, 1, 1));
    v = s.select(v, createCalendarDate(2025, 1, 2));
    // FIFO drops Jan 3 (oldest selection); exposed value stays date-sorted.
    expect(v.value.map(d => d.day)).toEqual([1, 2]);
  });

  it('exposed value remains sorted by date', () => {
    const s = new MultiSelectionStrategy();
    let v = s.select(s.initial(), createCalendarDate(2025, 1, 9));
    v = s.select(v, createCalendarDate(2025, 1, 2));
    expect(v.value.map(d => d.day)).toEqual([2, 9]);
  });
});

describe('view-aware keyboard handling', () => {
  const make = (view: 'day' | 'month' | 'year' | 'decade') => {
    const e = new DatePickerEngine({ initialFocused: createCalendarDate(2025, 6, 15) });
    e.setView(view);
    return e;
  };

  it('month view: arrows move ±1 / ±4 months', () => {
    const e = make('month');
    e.handleKey(key('ArrowRight'));
    expect(e.state.focused.month).toBe(7);
    e.handleKey(key('ArrowUp'));
    expect(e.state.focused.month).toBe(3);
    e.handleKey(key('ArrowDown'));
    expect(e.state.focused.month).toBe(7);
    e.handleKey(key('ArrowLeft'));
    expect(e.state.focused.month).toBe(6);
  });

  it('month view: PageUp/PageDown step one year (ten with shift)', () => {
    const e = make('month');
    e.handleKey(key('PageUp'));
    expect(e.state.focused.year).toBe(2024);
    e.handleKey(key('PageDown', { shift: true }));
    expect(e.state.focused.year).toBe(2034);
  });

  it('month view: Home/End go to row start/end, Ctrl+Home/End to Jan/Dec', () => {
    const e = make('month'); // June → row 1 (May..Aug)
    e.handleKey(key('Home'));
    expect(e.state.focused.month).toBe(5);
    e.handleKey(key('End'));
    expect(e.state.focused.month).toBe(8);
    e.handleKey(key('Home', { ctrl: true }));
    expect(e.state.focused.month).toBe(1);
    e.handleKey(key('End', { ctrl: true }));
    expect(e.state.focused.month).toBe(12);
  });

  it('month view: Enter drills down to day view (like clicking)', () => {
    const e = make('month');
    e.handleKey(key('Enter'));
    expect(e.state.view).toBe('day');
    expect(e.state.selection.mode === 'single' && e.state.selection.value).toBeNull();
  });

  it('year view: arrows move ±1 / ±4 years, PageUp steps a decade', () => {
    const e = make('year');
    e.handleKey(key('ArrowRight'));
    expect(e.state.focused.year).toBe(2026);
    e.handleKey(key('ArrowDown'));
    expect(e.state.focused.year).toBe(2030);
    e.handleKey(key('PageUp'));
    expect(e.state.focused.year).toBe(2020);
  });

  it('year view: Home/End use the 4-column grid rows; Ctrl jumps decade edges', () => {
    const e = make('year'); // 2025 sits in row 1 of the 2019..2030 grid
    e.handleKey(key('Home'));
    expect(e.state.focused.year).toBe(2023);
    e.handleKey(key('End'));
    expect(e.state.focused.year).toBe(2026);
    e.handleKey(key('Home', { ctrl: true }));
    expect(e.state.focused.year).toBe(2020);
    e.handleKey(key('End', { ctrl: true }));
    expect(e.state.focused.year).toBe(2029);
  });

  it('decade view: arrows move ±10 / ±40 years, PageUp steps a century', () => {
    const e = make('decade');
    e.handleKey(key('ArrowRight'));
    expect(e.state.focused.year).toBe(2035);
    e.handleKey(key('ArrowDown'));
    expect(e.state.focused.year).toBe(2075);
    e.handleKey(key('PageUp'));
    expect(e.state.focused.year).toBe(1975);
  });

  it('day view behaviour is unchanged', () => {
    const e = make('day');
    e.handleKey(key('ArrowRight'));
    expect(e.state.focused.day).toBe(16);
    e.handleKey(key('ArrowDown'));
    expect(e.state.focused.day).toBe(23);
    e.handleKey(key('PageUp'));
    expect(e.state.focused.month).toBe(5);
    e.handleKey(key('PageUp', { shift: true }));
    expect(e.state.focused.year).toBe(2024);
  });
});

describe('keyboard selection emits select (like click)', () => {
  it('Enter in day view fires the select event with the focused date', () => {
    const e = new DatePickerEngine({ initialFocused: createCalendarDate(2025, 6, 15) });
    const events: CalendarDate[] = [];
    e.on('select', p => events.push(p.focused));
    e.handleKey(key('Enter'));
    expect(events).toEqual([{ year: 2025, month: 6, day: 15 }]);
    expect(e.state.selection.mode === 'single' && e.state.selection.value).toEqual({
      year: 2025,
      month: 6,
      day: 15,
    });
  });
});

describe('deep-frozen selection state', () => {
  it('multi: selection.value cannot be push()ed', () => {
    const e = new DatePickerEngine({ mode: 'multi' });
    e.select(createCalendarDate(2025, 3, 3));
    const value = e.state.selection.value as CalendarDate[];
    expect(() => value.push(createCalendarDate(2025, 3, 4))).toThrow(TypeError);
  });

  it('range: committed range object is frozen', () => {
    const e = new DatePickerEngine({ mode: 'range' });
    e.select(createCalendarDate(2025, 3, 3));
    e.select(createCalendarDate(2025, 3, 6));
    const sel = e.state.selection;
    expect(sel.mode).toBe('range');
    if (sel.mode === 'range' && sel.value) {
      expect(Object.isFrozen(sel.value)).toBe(true);
      expect(Object.isFrozen(sel.value.start)).toBe(true);
    }
  });
});

describe('EventBus  duplicate registrations', () => {
  it('same function registered twice fires twice; unsubscribe removes one', () => {
    const bus = new EventBus<{ ping: number }>();
    let calls = 0;
    const fn = (): void => {
      calls += 1;
    };
    const off1 = bus.on('ping', fn);
    bus.on('ping', fn);
    bus.emit('ping', 1);
    expect(calls).toBe(2);
    off1();
    bus.emit('ping', 1);
    expect(calls).toBe(3);
  });
});

describe('presets  atomic range application', () => {
  it('clamps the range into min/max', () => {
    const today = todayCalendarDate();
    const e = new DatePickerEngine({
      mode: 'range',
      min: new DatePickerEngine().calendar.addDays(today, -2),
    });
    BUILTIN_PRESETS['last7days']?.apply(e);
    const sel = e.state.selection;
    expect(sel.mode).toBe('range');
    if (sel.mode === 'range') {
      expect(sel.value?.start).toEqual(e.calendar.addDays(today, -2));
      expect(sel.value?.end).toEqual(today);
    }
  });

  it('applies nothing (no dangling anchor) when the range is fully unpickable', () => {
    const today = todayCalendarDate();
    const e = new DatePickerEngine({
      mode: 'range',
      min: new DatePickerEngine().calendar.addDays(today, 5),
    });
    BUILTIN_PRESETS['last7days']?.apply(e);
    const sel = e.state.selection;
    if (sel.mode === 'range') {
      expect(sel.value).toBeNull();
      expect(sel.anchor).toBeNull();
    }
  });

  it("today preset uses the engine's tz-aware today", () => {
    const tz = 'Pacific/Kiritimati'; // UTC+14  first to roll over
    const e = new DatePickerEngine({
      mode: 'range',
      locale: { locale: 'en-US', timeZone: tz },
    });
    BUILTIN_PRESETS['today']?.apply(e);
    const sel = e.state.selection;
    if (sel.mode === 'range') {
      expect(sel.value?.start).toEqual(todayCalendarDate(tz));
    }
  });
});

describe('engine grid uses tz-aware today + configured weekend', () => {
  it('isToday matches the locale time zone', () => {
    const tz = 'Pacific/Kiritimati';
    const today = todayCalendarDate(tz);
    const e = new DatePickerEngine({
      initialFocused: today,
      locale: { locale: 'en-US', timeZone: tz },
    });
    const todayCells = e.state.grid.weeks.flat().filter(c => c.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0]?.date).toEqual(today);
  });

  it('locale weekendDays reach the grid', () => {
    const e = new DatePickerEngine({
      initialFocused: createCalendarDate(2025, 6, 15),
      locale: { locale: 'en-US', weekendDays: [5] }, // Friday-only weekend
    });
    const friday = e.state.grid.weeks.flat().find(c => c.date.day === 20 && c.inCurrentMonth);
    const sunday = e.state.grid.weeks.flat().find(c => c.date.day === 15 && c.inCurrentMonth);
    expect(friday?.isWeekend).toBe(true); // 2025-06-20 is a Friday
    expect(sunday?.isWeekend).toBe(false);
  });

  it('weekNumbers option exposes per-week numbers on the engine grid', () => {
    const e = new DatePickerEngine({
      initialFocused: createCalendarDate(2025, 1, 15),
      weekNumbers: true,
    });
    expect(e.state.grid.weekNumbers).toHaveLength(e.state.grid.weeks.length);
  });
});

describe('timeStep + unbounded maxRangeDays', () => {
  it('setTime rounds to the nearest step and clamps into min/max time', () => {
    const e = new DatePickerEngine({ withTime: true, timeStep: 15 });
    e.setTime({ hour: 10, minute: 7, second: 0 });
    expect(e.state.time).toEqual({ hour: 10, minute: 0, second: 0 });
    e.setTime({ hour: 10, minute: 8, second: 0 });
    expect(e.state.time).toEqual({ hour: 10, minute: 15, second: 0 });
    e.setTime({ hour: 23, minute: 59, second: 0 });
    expect(e.state.time).toEqual({ hour: 23, minute: 45, second: 0 }); // never wraps past midnight
  });

  it('maxRangeDays beyond 5000 works (epoch-day math, no cap)', () => {
    const e = new DatePickerEngine({ mode: 'range', maxRangeDays: 10_000 });
    e.select(createCalendarDate(2000, 1, 1));
    expect(e.isPickable(createCalendarDate(2020, 1, 1))).toBe(true); // 7305 days
    const tight = new DatePickerEngine({ mode: 'range', maxRangeDays: 7000 });
    tight.select(createCalendarDate(2000, 1, 1));
    expect(tight.isPickable(createCalendarDate(2020, 1, 1))).toBe(false);
  });
});

describe('rangeOverDisabled', () => {
  const disabled = [createCalendarDate(2025, 1, 5)];

  it("'allow' (default) commits ranges spanning disabled dates", () => {
    const e = new DatePickerEngine({ mode: 'range', disabledDates: disabled });
    e.select(createCalendarDate(2025, 1, 3));
    e.select(createCalendarDate(2025, 1, 8));
    const sel = e.state.selection;
    if (sel.mode === 'range') expect(sel.value?.end).toEqual({ year: 2025, month: 1, day: 8 });
  });

  it("'reject' makes the completing click a no-op", () => {
    const e = new DatePickerEngine({
      mode: 'range',
      disabledDates: disabled,
      rangeOverDisabled: 'reject',
    });
    e.select(createCalendarDate(2025, 1, 3));
    e.select(createCalendarDate(2025, 1, 8));
    const sel = e.state.selection;
    if (sel.mode === 'range') {
      expect(sel.value).toBeNull();
      expect(sel.anchor).toEqual({ year: 2025, month: 1, day: 3 });
    }
    // A clean span still completes.
    e.select(createCalendarDate(2025, 1, 4));
    const done = e.state.selection;
    if (done.mode === 'range') expect(done.value?.end).toEqual({ year: 2025, month: 1, day: 4 });
  });

  it("'clamp' shrinks to the longest enabled span from the anchor", () => {
    const e = new DatePickerEngine({
      mode: 'range',
      disabledDates: disabled,
      rangeOverDisabled: 'clamp',
    });
    e.select(createCalendarDate(2025, 1, 3));
    e.select(createCalendarDate(2025, 1, 8));
    const sel = e.state.selection;
    if (sel.mode === 'range') {
      expect(sel.value?.start).toEqual({ year: 2025, month: 1, day: 3 });
      expect(sel.value?.end).toEqual({ year: 2025, month: 1, day: 4 });
    }
  });
});

describe('initialSelected', () => {
  it('single: seeds value and focuses it', () => {
    const d = createCalendarDate(2025, 4, 10);
    const e = new DatePickerEngine({ initialSelected: d });
    expect(e.state.selection.mode === 'single' && e.state.selection.value).toEqual(d);
    expect(e.state.focused).toEqual(d);
  });

  it('range: seeds {start, end} and focuses the start', () => {
    const e = new DatePickerEngine({
      mode: 'range',
      initialSelected: {
        start: createCalendarDate(2025, 4, 1),
        end: createCalendarDate(2025, 4, 9),
      },
    });
    const sel = e.state.selection;
    if (sel.mode === 'range') {
      expect(sel.value?.start).toEqual({ year: 2025, month: 4, day: 1 });
      expect(sel.value?.end).toEqual({ year: 2025, month: 4, day: 9 });
    }
    expect(e.state.focused).toEqual({ year: 2025, month: 4, day: 1 });
  });

  it('multi: seeds an array (respecting max FIFO)', () => {
    const e = new DatePickerEngine({
      mode: 'multi',
      multi: { max: 2 },
      initialSelected: [
        createCalendarDate(2025, 4, 1),
        createCalendarDate(2025, 4, 2),
        createCalendarDate(2025, 4, 3),
      ],
    });
    const sel = e.state.selection;
    if (sel.mode === 'multi') expect(sel.value.map(d => d.day)).toEqual([2, 3]);
  });

  it('drops seeds violating constraints', () => {
    const e = new DatePickerEngine({
      initialSelected: createCalendarDate(2020, 1, 1),
      min: createCalendarDate(2025, 1, 1),
    });
    expect(e.state.selection.mode === 'single' && e.state.selection.value).toBeNull();
  });
});

describe('setOptions', () => {
  it('rebuilds constraints, prunes invalid selection, clamps focus, emits change', () => {
    const e = new DatePickerEngine({ initialSelected: createCalendarDate(2025, 6, 15) });
    let changes = 0;
    e.on('change', () => {
      changes += 1;
    });
    e.setOptions({ min: createCalendarDate(2025, 7, 1) });
    expect(changes).toBe(1);
    expect(e.state.selection.mode === 'single' && e.state.selection.value).toBeNull();
    expect(e.state.focused).toEqual({ year: 2025, month: 7, day: 1 });
  });

  it('preserves a selection that remains valid', () => {
    const d = createCalendarDate(2025, 6, 15);
    const e = new DatePickerEngine({ initialSelected: d });
    e.setOptions({ locale: 'de-DE' });
    expect(e.state.selection.mode === 'single' && e.state.selection.value).toEqual(d);
    expect(e.locale.locale).toBe('de-DE');
  });

  it('shrinks a range selection to the new bounds', () => {
    const e = new DatePickerEngine({
      mode: 'range',
      initialSelected: {
        start: createCalendarDate(2025, 6, 1),
        end: createCalendarDate(2025, 6, 20),
      },
    });
    e.setOptions({ min: createCalendarDate(2025, 6, 10) });
    const sel = e.state.selection;
    if (sel.mode === 'range') {
      expect(sel.value?.start).toEqual({ year: 2025, month: 6, day: 10 });
      expect(sel.value?.end).toEqual({ year: 2025, month: 6, day: 20 });
    }
  });

  it('mode change resets the selection', () => {
    const e = new DatePickerEngine({ initialSelected: createCalendarDate(2025, 6, 15) });
    e.setOptions({ mode: 'multi' });
    expect(e.state.selection.mode).toBe('multi');
    expect(e.state.selection.mode === 'multi' && e.state.selection.value).toEqual([]);
  });
});

describe('resolveLocaleConfig  Intl week info', () => {
  it('en-US: Sunday first day, Sat/Sun weekend', () => {
    const c = resolveLocaleConfig('en-US');
    expect(c.firstDayOfWeek).toBe(0);
    expect([...(c.weekendDays ?? [])].sort()).toEqual([0, 6]);
  });

  it('de-DE: Monday first day', () => {
    expect(resolveLocaleConfig('de-DE').firstDayOfWeek).toBe(1);
  });

  it('falls back to the region table when Intl week info is unavailable', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const savedGet = Object.getOwnPropertyDescriptor(proto, 'getWeekInfo');
    const savedInfo = Object.getOwnPropertyDescriptor(proto, 'weekInfo');
    if (savedGet) delete proto['getWeekInfo'];
    if (savedInfo) delete proto['weekInfo'];
    try {
      expect(resolveLocaleConfig('en-US').firstDayOfWeek).toBe(0); // table: US → 0
      expect(resolveLocaleConfig('de-DE').firstDayOfWeek).toBe(1); // default
      expect(resolveLocaleConfig('en-US').weekendDays).toEqual([0, 6]);
    } finally {
      if (savedGet) Object.defineProperty(proto, 'getWeekInfo', savedGet);
      if (savedInfo) Object.defineProperty(proto, 'weekInfo', savedInfo);
    }
  });

  it('explicit overrides always win', () => {
    const c = resolveLocaleConfig({ locale: 'en-US', firstDayOfWeek: 3, weekendDays: [2] });
    expect(c.firstDayOfWeek).toBe(3);
    expect(c.weekendDays).toEqual([2]);
  });
});
