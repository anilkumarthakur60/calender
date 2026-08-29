import { createCalendarSystem, type CalendarSystem } from '../calendar';
import {
  type CalendarDate,
  clamp,
  isSameDay,
  toEpochDay,
  createRange,
  buildMonthGrid,
} from '../domain';
import {
  CompositeConstraint,
  MinMaxConstraint,
  DisabledDatesConstraint,
  DisabledWeekdayConstraint,
  type DateConstraint,
} from '../constraints';
import { EventBus } from '../events';
import { DateFormatter, resolveLocaleConfig, type LocaleConfig } from '../i18n';
import { drillDown, drillUp, type ViewMode, stepBackward, stepForward } from '../navigation';
import { createSelectionStrategy, type SelectionStrategy, type SelectionValue } from '../selection';
import type {
  DateHighlight,
  DatePickerEngineOptions,
  InitialSelected,
  SelectionGranularity,
} from './engine-options.js';
import type { EngineState, TimeOfDay } from './engine-state.js';
import { HighlightIndex } from './highlights.js';
import { type KeyboardAction, interpretKey, type KeyboardEventLike } from '../focus';

const timeToSeconds = (t: TimeOfDay): number => t.hour * 3600 + t.minute * 60 + t.second;

const compareTime = (
  t: TimeOfDay,
  min: TimeOfDay | undefined,
  max: TimeOfDay | undefined,
): -1 | 0 | 1 => {
  const s = timeToSeconds(t);
  if (min && s < timeToSeconds(min)) return -1;
  if (max && s > timeToSeconds(max)) return 1;
  return 0;
};

export interface DatePickerEvents {
  change: { state: EngineState; previous: EngineState };
  select: { selection: SelectionValue; focused: CalendarDate };
  focus: { focused: CalendarDate; previous: CalendarDate };
  view: { view: ViewMode; previous: ViewMode };
  hover: { hovered: CalendarDate | null };
  time: { time: TimeOfDay | null };
  open: { focused: CalendarDate };
  close: { reason: 'cancel' | 'commit' | 'outside' };
}

const GRANULARITY_VIEW: Record<SelectionGranularity, ViewMode> = {
  day: 'day',
  month: 'month',
  year: 'year',
};

/**
 * Columns in the month/year/decade period grids (matches the 4-column
 * `cal-picker__grid--period` layout every renderer uses).
 */
const PERIOD_GRID_COLUMNS = 4;

const decadeStart = (year: number): number => Math.floor(year / 10) * 10;
const centuryStart = (year: number): number => Math.floor(year / 100) * 100;

/**
 * Signed day count from `a` to `b` (positive when a < b). O(1) via UTC
 * epoch-day subtraction through the Gregorian projection  no iteration,
 * no span cap.
 */
const daysBetween = (calendar: CalendarSystem, a: CalendarDate, b: CalendarDate): number =>
  toEpochDay(calendar.toGregorian(b)) - toEpochDay(calendar.toGregorian(a));

/**
 * Freeze a selection value AND everything reachable through it (arrays,
 * ranges, dates) so `engine.state.selection.value` can never be mutated live.
 */
const deepFreezeSelection = (selection: SelectionValue): SelectionValue => {
  switch (selection.mode) {
    case 'single':
      if (selection.value) Object.freeze(selection.value);
      break;
    case 'range':
      if (selection.value) {
        Object.freeze(selection.value.start);
        Object.freeze(selection.value.end);
        Object.freeze(selection.value);
      }
      if (selection.anchor) Object.freeze(selection.anchor);
      break;
    case 'multi':
      for (const d of selection.value) Object.freeze(d);
      Object.freeze(selection.value);
      break;
  }
  return Object.freeze(selection);
};

export class DatePickerEngine {
  readonly #bus = new EventBus<DatePickerEvents>();
  #destroyed = false;
  #options: DatePickerEngineOptions;
  #strategy!: SelectionStrategy;
  #constraint!: DateConstraint;
  #locale!: LocaleConfig;
  #formatter!: DateFormatter;
  #calendar!: CalendarSystem;
  #min: CalendarDate | undefined;
  #max: CalendarDate | undefined;
  #fixedWeeks = true;
  #granularity: SelectionGranularity = 'day';
  #minRangeDays: number | undefined;
  #maxRangeDays: number | undefined;
  #rangeOverDisabled: 'allow' | 'reject' | 'clamp' = 'allow';
  #highlights!: HighlightIndex;
  #months = 1;
  #weekNumbers = false;
  #headerSelectors = false;
  #yearRange: readonly [number, number] | undefined;
  #withTime = false;
  #timeStep = 1;
  #use12HourClock = false;
  #showSeconds = false;
  #minTime: TimeOfDay | undefined;
  #maxTime: TimeOfDay | undefined;
  #state!: EngineState;

  constructor(options: DatePickerEngineOptions = {}) {
    this.#options = options;
    this.#configure(options);

    const seeded =
      options.initialSelected !== undefined
        ? this.#seedSelection(options.initialSelected)
        : (this.#strategy.initial() as SelectionValue);

    const initial = options.initialFocused
      ? clamp(options.initialFocused, options.min, options.max)
      : clamp(
          seededFocus(seeded) ?? this.#calendar.today(this.#locale.timeZone),
          options.min,
          options.max,
        );

    const initialView: ViewMode = options.initialView ?? GRANULARITY_VIEW[this.#granularity];

    const initialTime: TimeOfDay | null = this.#withTime
      ? {
          hour: options.initialTime?.hour ?? 0,
          minute: options.initialTime?.minute ?? 0,
          second: options.initialTime?.second ?? 0,
        }
      : null;

    this.#state = this.#buildState({
      focused: initial,
      view: initialView,
      selection: seeded,
      isOpen: false,
      hovered: null,
      time: initialTime,
    });
  }

  /** Resolve every option field. Called at construction and from setOptions(). */
  #configure(options: DatePickerEngineOptions): void {
    this.#calendar = createCalendarSystem(options.calendar ?? 'gregorian');
    this.#locale = resolveLocaleConfig(options.locale ?? {});
    this.#formatter = new DateFormatter(this.#locale, this.#calendar);

    const mode = options.mode ?? 'single';
    const strategyOpts: { range?: typeof options.range; multi?: typeof options.multi } = {};
    if (options.range !== undefined) strategyOpts.range = options.range;
    if (options.multi !== undefined) strategyOpts.multi = options.multi;
    this.#strategy = createSelectionStrategy(mode, strategyOpts);
    this.#min = options.min;
    this.#max = options.max;
    this.#fixedWeeks = options.fixedWeeks ?? true;
    this.#granularity = options.granularity ?? 'day';
    this.#minRangeDays = options.minRangeDays;
    this.#maxRangeDays = options.maxRangeDays;
    this.#rangeOverDisabled = options.rangeOverDisabled ?? 'allow';
    this.#highlights = new HighlightIndex(options.highlights ?? []);
    this.#months = Math.max(1, options.months ?? 1);
    this.#weekNumbers = options.weekNumbers ?? false;
    this.#headerSelectors = options.headerSelectors ?? false;
    this.#yearRange = options.yearRange;
    this.#withTime = options.withTime ?? false;
    this.#timeStep = options.timeStep ?? 1;
    this.#use12HourClock = options.use12HourClock ?? false;
    this.#showSeconds = options.showSeconds ?? false;
    this.#minTime = options.minTime
      ? {
          hour: options.minTime.hour,
          minute: options.minTime.minute,
          second: options.minTime.second ?? 0,
        }
      : undefined;
    this.#maxTime = options.maxTime
      ? {
          hour: options.maxTime.hour,
          minute: options.maxTime.minute,
          second: options.maxTime.second ?? 0,
        }
      : undefined;

    const constraints: DateConstraint[] = [];
    if (options.min || options.max)
      constraints.push(new MinMaxConstraint(options.min, options.max));
    if (options.disabledDates?.length)
      constraints.push(new DisabledDatesConstraint(options.disabledDates));
    if (options.disabledWeekdays?.length)
      constraints.push(new DisabledWeekdayConstraint(options.disabledWeekdays, this.#calendar));
    if (options.extraConstraints?.length) constraints.push(...options.extraConstraints);
    this.#constraint = new CompositeConstraint(constraints);
  }

  /** Build the initial selection value from `initialSelected`, dropping invalid parts. */
  #seedSelection(seed: InitialSelected): SelectionValue {
    switch (this.#strategy.mode) {
      case 'single': {
        const d = Array.isArray(seed)
          ? (seed[0] as CalendarDate | undefined)
          : 'start' in seed
            ? seed.start
            : (seed as CalendarDate);
        return d && !this.isDisabled(d)
          ? { mode: 'single', value: d }
          : (this.#strategy.initial() as SelectionValue);
      }
      case 'range': {
        const [a, b] = Array.isArray(seed)
          ? [seed[0], seed[seed.length - 1]]
          : 'start' in seed
            ? [seed.start, seed.end]
            : [seed as CalendarDate, seed as CalendarDate];
        if (!a || !b) return this.#strategy.initial() as SelectionValue;
        const range = this.#clampRangeToBounds(a, b);
        if (!range || this.isDisabled(range.start) || this.isDisabled(range.end)) {
          return this.#strategy.initial() as SelectionValue;
        }
        return { mode: 'range', value: range, anchor: range.start };
      }
      case 'multi': {
        const list = Array.isArray(seed)
          ? seed
          : 'start' in seed
            ? [seed.start, seed.end]
            : [seed as CalendarDate];
        let s = this.#strategy.initial() as SelectionValue;
        for (const d of list) {
          if (!this.isDisabled(d)) s = this.#strategy.select(s as never, d) as SelectionValue;
        }
        return s;
      }
    }
  }

  /**
   * Order + clamp a candidate range into `[min, max]`. Returns null when the
   * candidate lies entirely outside the bounds (empty intersection).
   */
  #clampRangeToBounds(
    a: CalendarDate,
    b: CalendarDate,
  ): { start: CalendarDate; end: CalendarDate } | null {
    const cal = this.#calendar;
    const [lo, hi] = cal.compare(a, b) <= 0 ? [a, b] : [b, a];
    if (this.#min && cal.compare(hi, this.#min) < 0) return null;
    if (this.#max && cal.compare(lo, this.#max) > 0) return null;
    return createRange(clamp(lo, this.#min, this.#max), clamp(hi, this.#min, this.#max));
  }

  // --- public read API -----------------------------------------------------

  get state(): EngineState {
    return this.#state;
  }

  get locale(): LocaleConfig {
    return this.#locale;
  }

  get formatter(): DateFormatter {
    return this.#formatter;
  }

  get calendar(): CalendarSystem {
    return this.#calendar;
  }

  get granularity(): SelectionGranularity {
    return this.#granularity;
  }

  get months(): number {
    return this.#months;
  }

  get weekNumbers(): boolean {
    return this.#weekNumbers;
  }

  get headerSelectors(): boolean {
    return this.#headerSelectors;
  }

  /** The engine's "today" in the configured calendar + locale time zone. */
  today(): CalendarDate {
    return this.#calendar.today(this.#locale.timeZone);
  }

  /**
   * The [start, end] year span available for the header year dropdown,
   * clamped by `min`/`max` if those are set. Defaults to focused.year ± 100.
   */
  yearRange(): readonly [number, number] {
    if (this.#yearRange) return this.#yearRange;
    const f = this.#state.focused.year;
    const start = this.#min ? Math.max(f - 100, this.#min.year) : f - 100;
    const end = this.#max ? Math.min(f + 100, this.#max.year) : f + 100;
    return [start, end];
  }

  /** Jump to a different year keeping the focused month/day (day clamped). */
  setYear(year: number): void {
    const f = this.#state.focused;
    const day = Math.min(f.day, this.#calendar.daysInMonth(year, f.month));
    this.focus({ year, month: f.month, day });
  }

  /** Jump to a different month keeping the focused year (day clamped). */
  setMonth(month: number): void {
    const f = this.#state.focused;
    const day = Math.min(f.day, this.#calendar.daysInMonth(f.year, month));
    this.focus({ year: f.year, month, day });
  }

  get withTime(): boolean {
    return this.#withTime;
  }

  get timeStep(): number {
    return this.#timeStep;
  }

  get use12HourClock(): boolean {
    return this.#use12HourClock;
  }

  get showSeconds(): boolean {
    return this.#showSeconds;
  }

  on = this.#bus.on.bind(this.#bus);

  /**
   * Release every listener registered on this engine. Adapters must call this
   * when their component unmounts  without it each mount leaks its listeners
   * for the lifetime of the page. Idempotent.
   */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#bus.clear();
  }

  /** True once {@link destroy} has run. */
  get destroyed(): boolean {
    return this.#destroyed;
  }

  isDisabled(date: CalendarDate): boolean {
    return this.#constraint.evaluate(date) !== null;
  }

  reasonFor(date: CalendarDate): string | null {
    return this.#constraint.evaluate(date);
  }

  isSelected(date: CalendarDate): boolean {
    return this.#strategy.isSelected(this.#state.selection as never, date);
  }

  getHighlight(date: CalendarDate): DateHighlight | undefined {
    return this.#highlights.get(date);
  }

  /**
   * True when `date` can be picked in the current selection state. Layered on
   * top of `isDisabled`: in range mode with an anchor set, also enforces
   * `minRangeDays`/`maxRangeDays`.
   */
  isPickable(date: CalendarDate): boolean {
    if (this.isDisabled(date)) return false;
    const sel = this.#state.selection;
    if (sel.mode !== 'range' || sel.anchor === null || sel.value !== null) return true;
    const diff = Math.abs(daysBetween(this.#calendar, sel.anchor, date));
    const min = (this.#minRangeDays ?? 1) - 1; // inclusive count
    const max = this.#maxRangeDays !== undefined ? this.#maxRangeDays - 1 : Infinity;
    return diff >= min && diff <= max;
  }

  // --- commands ------------------------------------------------------------

  /**
   * Reconfigure a live engine. `partial` is merged over the options the engine
   * was constructed with; constraints, locale, calendar, months etc. are all
   * rebuilt. The current selection and focus are preserved where still valid
   * (selection parts that violate the new constraints are dropped; focus is
   * clamped into the new min/max), then the new state is committed and a
   * 'change' event is emitted. `initialFocused`/`initialView`/`initialSelected`
   * are construction-time-only and ignored here.
   */
  setOptions(partial: Partial<DatePickerEngineOptions>): void {
    const previous = this.#state;
    const merged: DatePickerEngineOptions = { ...this.#options, ...partial };
    this.#options = merged;
    this.#configure(merged);

    const focused = clamp(previous.focused, this.#min, this.#max);
    const selection = this.#pruneSelection(previous.selection);
    const time: TimeOfDay | null = this.#withTime
      ? this.#clampTime(this.#roundToStep(previous.time ?? { hour: 0, minute: 0, second: 0 }))
      : null;

    this.#commit({
      focused,
      view: previous.view,
      selection,
      isOpen: previous.isOpen,
      hovered: null,
      time,
    });
  }

  /** Keep the parts of `previous` that survive the (re)configured constraints. */
  #pruneSelection(previous: SelectionValue): SelectionValue {
    if (previous.mode !== this.#strategy.mode) return this.#strategy.initial() as SelectionValue;
    switch (previous.mode) {
      case 'single':
        return previous.value && !this.isDisabled(previous.value)
          ? previous
          : { mode: 'single', value: null };
      case 'range': {
        const anchor =
          previous.anchor && !this.isDisabled(previous.anchor) ? previous.anchor : null;
        if (!previous.value) return { mode: 'range', value: null, anchor };
        const range = this.#clampRangeToBounds(previous.value.start, previous.value.end);
        if (!range || this.isDisabled(range.start) || this.isDisabled(range.end)) {
          return { mode: 'range', value: null, anchor };
        }
        return { mode: 'range', value: range, anchor };
      }
      case 'multi': {
        // Re-run through the fresh strategy so a (new) max cap applies FIFO.
        let s = this.#strategy.initial() as SelectionValue;
        for (const d of previous.value) {
          if (!this.isDisabled(d)) s = this.#strategy.select(s as never, d) as SelectionValue;
        }
        return s;
      }
    }
  }

  open(): void {
    if (this.#state.isOpen) return;
    this.#commit({ ...this.#state, isOpen: true });
    this.#bus.emit('open', { focused: this.#state.focused });
  }

  close(reason: 'cancel' | 'commit' | 'outside' = 'commit'): void {
    if (!this.#state.isOpen) return;
    this.#commit({ ...this.#state, isOpen: false });
    this.#bus.emit('close', { reason });
  }

  toggle(): void {
    if (this.#state.isOpen) this.close('cancel');
    else this.open();
  }

  focus(date: CalendarDate): void {
    const clamped = clamp(date, this.#min, this.#max);
    if (isSameDay(clamped, this.#state.focused)) return;
    const previous = this.#state.focused;
    this.#commit({ ...this.#state, focused: clamped });
    this.#bus.emit('focus', { focused: clamped, previous });
  }

  selectFocused(): void {
    this.select(this.#state.focused);
  }

  select(date: CalendarDate): void {
    if (!this.isPickable(date)) return;
    let effective = date;
    const sel = this.#state.selection;
    if (
      sel.mode === 'range' &&
      sel.anchor !== null &&
      sel.value === null &&
      this.#rangeOverDisabled !== 'allow' &&
      !isSameDay(sel.anchor, date)
    ) {
      const resolved = this.#resolveRangeEnd(sel.anchor, date);
      if (resolved === null) return; // 'reject': span contains a disabled date
      effective = resolved;
    }
    const nextSelection = this.#strategy.select(
      this.#state.selection as never,
      effective,
    ) as SelectionValue;
    this.#commit({
      ...this.#state,
      focused: effective,
      selection: nextSelection,
      // Clear the hover once a range completes / a single picks; redundant otherwise.
      hovered: null,
    });
    // Report what THIS call committed. Reading this.#state here would report
    // whatever a synchronous `change` listener left behind instead.
    this.#bus.emit('select', { selection: nextSelection, focused: effective });
  }

  /**
   * Walk from `anchor` toward `date` checking every day in between.
   * 'reject' → null when any is disabled; 'clamp' → the furthest date such
   * that the whole span from the anchor is enabled.
   */
  #resolveRangeEnd(anchor: CalendarDate, date: CalendarDate): CalendarDate | null {
    const cal = this.#calendar;
    const dir = cal.compare(anchor, date) < 0 ? 1 : -1;
    let last = anchor;
    let cursor = cal.addDays(anchor, dir);
    while (cal.compare(cursor, date) * dir <= 0) {
      if (this.isDisabled(cursor)) {
        return this.#rangeOverDisabled === 'reject' ? null : last;
      }
      last = cursor;
      cursor = cal.addDays(cursor, dir);
    }
    return date;
  }

  /**
   * Atomically apply a complete range (presets, adapters). The range is
   * clamped into `min`/`max`; when the clamped range is empty  or violates
   * `minRangeDays`/`maxRangeDays`  NOTHING is applied (no dangling anchor).
   * Range mode only. Returns true when the range was applied.
   */
  selectRange(start: CalendarDate, end: CalendarDate): boolean {
    if (this.#state.selection.mode !== 'range') return false;
    const clamped = this.#clampRangeToBounds(start, end);
    if (!clamped) return false;

    // Apply the same date constraints the two-click path applies. Without
    // this, every preset could commit a range whose endpoints are disabled.
    if (this.isDisabled(clamped.start)) return false;
    let resolvedEnd = clamped.end;
    if (this.#rangeOverDisabled !== 'allow' && !isSameDay(clamped.start, clamped.end)) {
      const resolved = this.#resolveRangeEnd(clamped.start, clamped.end);
      if (resolved === null) return false; // 'reject': span contains a disabled date
      resolvedEnd = resolved;
    }
    const range = createRange(clamped.start, resolvedEnd);

    const span = daysBetween(this.#calendar, range.start, range.end) + 1; // inclusive
    if (this.#minRangeDays !== undefined && span < this.#minRangeDays) return false;
    if (this.#maxRangeDays !== undefined && span > this.#maxRangeDays) return false;
    const selection: SelectionValue = { mode: 'range', value: range, anchor: range.start };
    this.#commit({ ...this.#state, focused: range.end, selection, hovered: null });
    this.#bus.emit('select', { selection, focused: range.end });
    return true;
  }

  clearSelection(): void {
    const next = this.#strategy.clear(this.#state.selection as never) as SelectionValue;
    const focused = this.#state.focused;
    this.#commit({ ...this.#state, selection: next, hovered: null });
    this.#bus.emit('select', { selection: next, focused });
  }

  setHovered(date: CalendarDate | null): void {
    if (date === null && this.#state.hovered === null) return;
    if (date !== null && this.#state.hovered !== null && isSameDay(date, this.#state.hovered))
      return;
    this.#commit({ ...this.#state, hovered: date });
    this.#bus.emit('hover', { hovered: date });
  }

  setTime(time: TimeOfDay | null): void {
    const stepped = time !== null ? this.#roundToStep(time) : null;
    const clamped = stepped !== null ? this.#clampTime(stepped) : null;
    this.#commit({ ...this.#state, time: clamped });
    this.#bus.emit('time', { time: clamped });
  }

  /** Read-only access to min/max time bounds. */
  get minTime(): TimeOfDay | undefined {
    return this.#minTime;
  }
  get maxTime(): TimeOfDay | undefined {
    return this.#maxTime;
  }

  /** True when `time` falls within `minTime`/`maxTime` (or both are unset). */
  isTimePickable(time: TimeOfDay): boolean {
    return compareTime(time, this.#minTime, this.#maxTime) === 0;
  }

  /** Round the minute to the nearest `timeStep` multiple (never past 23:59). */
  #roundToStep(time: TimeOfDay): TimeOfDay {
    const step = this.#timeStep;
    if (step <= 1) return time;
    const total = time.hour * 60 + time.minute;
    let rounded = Math.round(total / step) * step;
    if (rounded >= 24 * 60) rounded = Math.floor((24 * 60 - 1) / step) * step;
    return { hour: Math.floor(rounded / 60), minute: rounded % 60, second: time.second };
  }

  #clampTime(time: TimeOfDay): TimeOfDay {
    const cmp = compareTime(time, this.#minTime, this.#maxTime);
    if (cmp < 0 && this.#minTime) return this.#minTime;
    if (cmp > 0 && this.#maxTime) return this.#maxTime;
    return time;
  }

  setView(view: ViewMode): void {
    if (view === this.#state.view) return;
    const previous = this.#state.view;
    this.#commit({ ...this.#state, view });
    this.#bus.emit('view', { view, previous });
  }

  drillDown(): void {
    this.setView(drillDown(this.#state.view));
  }

  drillUp(): void {
    this.setView(drillUp(this.#state.view));
  }

  /**
   * Pick a date in the current view. Day view → select. Non-day views drill
   * down by one level UNLESS the configured granularity makes the current view
   * terminal (e.g. granularity='month' + view='month' → select the month).
   */
  pickInView(date: CalendarDate): void {
    const terminalView = GRANULARITY_VIEW[this.#granularity];
    if (this.#state.view === terminalView) {
      this.select(date);
      return;
    }
    if (this.#state.view === 'day') {
      this.select(date);
      return;
    }
    this.focus(date);
    this.drillDown();
  }

  goToToday(): CalendarDate {
    const today = this.today();
    this.focus(today);
    const terminalView = GRANULARITY_VIEW[this.#granularity];
    if (this.#state.view !== terminalView) this.setView(terminalView);
    return today;
  }

  selectToday(): CalendarDate {
    const today = this.goToToday();
    this.select(today);
    return today;
  }

  pagePrev(): void {
    const bounds: { min?: CalendarDate; max?: CalendarDate } = {};
    if (this.#min !== undefined) bounds.min = this.#min;
    if (this.#max !== undefined) bounds.max = this.#max;
    this.focus(stepBackward(this.#state.focused, this.#state.view, bounds, this.#calendar));
  }

  pageNext(): void {
    const bounds: { min?: CalendarDate; max?: CalendarDate } = {};
    if (this.#min !== undefined) bounds.min = this.#min;
    if (this.#max !== undefined) bounds.max = this.#max;
    this.focus(stepForward(this.#state.focused, this.#state.view, bounds, this.#calendar));
  }

  handleKey(event: KeyboardEventLike): KeyboardAction | null {
    const action = interpretKey(event);
    if (!action) return null;
    this.#applyKeyAction(action);
    return action;
  }

  // --- internals -----------------------------------------------------------

  /** Move focus by `units` periods of the given (non-day) view. */
  #addPeriods(view: 'month' | 'year' | 'decade', date: CalendarDate, units: number): CalendarDate {
    const cal = this.#calendar;
    switch (view) {
      case 'month':
        return cal.addMonths(date, units);
      case 'year':
        return cal.addYears(date, units);
      case 'decade':
        return cal.addYears(date, units * 10);
    }
  }

  /** Focus a specific year keeping month/day (day clamped to month length). */
  #focusYear(year: number): void {
    const f = this.#state.focused;
    const day = Math.min(f.day, this.#calendar.daysInMonth(year, f.month));
    this.focus({ year, month: f.month, day });
  }

  /**
   * View-aware key handling per ARIA APG grid semantics. Day view keeps the
   * classic ±1 day / ±7 days moves; period views (month/year/decade) move by
   * one period horizontally and one 4-column grid row vertically. PageUp/Down
   * steps one containing period; Enter picks the focused period (drilling
   * down in non-terminal views) exactly as a click does.
   */
  #applyKeyAction(action: KeyboardAction): void {
    const cal = this.#calendar;
    const f = this.#state.focused;
    const view = this.#state.view;
    switch (action.type) {
      case 'move': {
        const isRTL = this.#locale.direction === 'rtl';
        const visual =
          action.direction === 'left'
            ? isRTL
              ? 'right'
              : 'left'
            : action.direction === 'right'
              ? isRTL
                ? 'left'
                : 'right'
              : action.direction;
        if (view === 'day') {
          const delta = visual === 'left' ? -1 : visual === 'right' ? 1 : visual === 'up' ? -7 : 7;
          this.focus(cal.addDays(f, delta * action.amount));
          return;
        }
        const delta =
          visual === 'left'
            ? -1
            : visual === 'right'
              ? 1
              : visual === 'up'
                ? -PERIOD_GRID_COLUMNS
                : PERIOD_GRID_COLUMNS;
        this.focus(this.#addPeriods(view, f, delta * action.amount));
        return;
      }
      case 'jump': {
        if (view === 'day') {
          const weekdayInRow = cal.weekday(f);
          const firstOfRowOffset = (weekdayInRow - this.#locale.firstDayOfWeek + 7) % 7;
          switch (action.target) {
            case 'rowStart':
              this.focus(cal.addDays(f, -firstOfRowOffset));
              return;
            case 'rowEnd':
              this.focus(cal.addDays(f, 6 - firstOfRowOffset));
              return;
            case 'monthStart':
              this.focus({ year: f.year, month: f.month, day: 1 });
              return;
            case 'monthEnd':
              this.focus({ year: f.year, month: f.month, day: cal.daysInMonth(f.year, f.month) });
              return;
          }
        }
        if (view === 'month') {
          // 12 months laid out 4 per row.
          const row = Math.floor((f.month - 1) / PERIOD_GRID_COLUMNS);
          switch (action.target) {
            case 'rowStart':
              this.setMonth(row * PERIOD_GRID_COLUMNS + 1);
              return;
            case 'rowEnd':
              this.setMonth(Math.min(row * PERIOD_GRID_COLUMNS + 4, cal.monthsInYear));
              return;
            case 'monthStart':
              this.setMonth(1);
              return;
            case 'monthEnd':
              this.setMonth(cal.monthsInYear);
              return;
          }
        }
        // Year/decade views: a 12-cell grid (one buffer cell each side of the
        // decade/century) laid out 4 per row, mirroring the period renderers.
        const periodSpan = view === 'year' ? 1 : 10;
        const bandStart = view === 'year' ? decadeStart(f.year) : centuryStart(f.year);
        const focusedPeriod = view === 'year' ? f.year : decadeStart(f.year);
        const gridIdx = (focusedPeriod - bandStart) / periodSpan + 1;
        const row = Math.floor(gridIdx / PERIOD_GRID_COLUMNS);
        switch (action.target) {
          case 'rowStart':
            this.#focusYear(bandStart + (row * PERIOD_GRID_COLUMNS - 1) * periodSpan);
            return;
          case 'rowEnd':
            this.#focusYear(bandStart + (row * PERIOD_GRID_COLUMNS + 2) * periodSpan);
            return;
          case 'monthStart':
            this.#focusYear(bandStart);
            return;
          case 'monthEnd':
            this.#focusYear(bandStart + 9 * periodSpan);
            return;
        }
      }
      case 'page': {
        const dir = action.direction === 'prev' ? -1 : 1;
        switch (view) {
          case 'day':
            this.focus(action.large ? cal.addYears(f, dir) : cal.addMonths(f, dir));
            return;
          case 'month':
            this.focus(cal.addYears(f, (action.large ? 10 : 1) * dir));
            return;
          case 'year':
            this.focus(cal.addYears(f, (action.large ? 100 : 10) * dir));
            return;
          case 'decade':
            this.focus(cal.addYears(f, 100 * dir));
            return;
        }
      }
      case 'select':
        // Day view selects; period views drill down (or select when the view
        // is terminal for the configured granularity)  same as clicking.
        this.pickInView(this.#state.focused);
        return;
      case 'cancel':
        this.close('cancel');
        return;
      case 'drillDown':
        this.drillDown();
        return;
      case 'drillUp':
        this.drillUp();
        return;
    }
  }

  #buildState(input: Omit<EngineState, 'grid' | 'mode'>): EngineState {
    const grid = buildMonthGrid(input.focused, {
      firstDayOfWeek: this.#locale.firstDayOfWeek,
      fixedWeeks: this.#fixedWeeks,
      calendar: this.#calendar,
      // tz-aware today + configured weekend, so isToday/isWeekend are correct
      // in every host time zone and locale.
      today: this.today(),
      weekendDays: this.#locale.weekendDays ?? [0, 6],
      weekNumbers: this.#weekNumbers,
    });
    return Object.freeze({
      mode: this.#strategy.mode,
      view: input.view,
      focused: input.focused,
      selection: deepFreezeSelection(input.selection),
      grid,
      isOpen: input.isOpen,
      hovered: input.hovered,
      time: input.time,
    });
  }

  #commit(partial: Omit<EngineState, 'grid' | 'mode'>): void {
    const previous = this.#state;
    this.#state = this.#buildState(partial);
    this.#bus.emit('change', { state: this.#state, previous });
  }
}

/** Focus target implied by a seeded selection (single date / range start / first multi). */
const seededFocus = (sel: SelectionValue): CalendarDate | null => {
  switch (sel.mode) {
    case 'single':
      return sel.value;
    case 'range':
      return sel.value ? sel.value.start : sel.anchor;
    case 'multi':
      return sel.value[0] ?? null;
  }
};
