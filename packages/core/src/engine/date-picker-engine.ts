import { createCalendarSystem } from '../calendar/calendar-factory.js';
import type { CalendarSystem } from '../calendar/calendar-system.js';
import type { CalendarDate } from '../domain/calendar-date.js';
import { clamp, isSameDay } from '../domain/calendar-date.js';
import { buildMonthGrid } from '../domain/month-grid.js';
import { CompositeConstraint } from '../constraints/composite-constraint.js';
import { MinMaxConstraint } from '../constraints/min-max-constraint.js';
import { DisabledDatesConstraint } from '../constraints/disabled-dates-constraint.js';
import { DisabledWeekdayConstraint } from '../constraints/weekday-constraint.js';
import type { DateConstraint } from '../constraints/constraint.js';
import { EventBus } from '../events/event-bus.js';
import { DateFormatter } from '../i18n/formatter.js';
import { resolveLocaleConfig, type LocaleConfig } from '../i18n/locale-config.js';
import { drillDown, drillUp, type ViewMode } from '../navigation/view-mode.js';
import { stepBackward, stepForward } from '../navigation/view-navigator.js';
import { createSelectionStrategy } from '../selection/selection-factory.js';
import type { SelectionStrategy, SelectionValue } from '../selection/selection-strategy.js';
import type {
  DateHighlight,
  DatePickerEngineOptions,
  SelectionGranularity,
} from './engine-options.js';
import type { EngineState, TimeOfDay } from './engine-state.js';
import { HighlightIndex } from './highlights.js';
import type { KeyboardAction } from '../focus/keyboard-action.js';
import { interpretKey, type KeyboardEventLike } from '../focus/keyboard-controller.js';

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

const daysBetween = (calendar: CalendarSystem, a: CalendarDate, b: CalendarDate): number => {
  // Forward iterate from min to max to honour calendar-specific month lengths.
  const cmp = calendar.compare(a, b);
  if (cmp === 0) return 0;
  const [lo, hi] = cmp < 0 ? [a, b] : [b, a];
  let n = 0;
  let cursor = lo;
  // Bound to keep us safe on bogus input; pickers never need huge spans.
  for (let i = 0; i < 5000; i += 1) {
    if (calendar.compare(cursor, hi) === 0) return cmp < 0 ? n : -n;
    cursor = calendar.addDays(cursor, 1);
    n += 1;
  }
  return cmp < 0 ? n : -n;
};

export class DatePickerEngine {
  readonly #bus = new EventBus<DatePickerEvents>();
  readonly #strategy: SelectionStrategy;
  readonly #constraint: DateConstraint;
  readonly #locale: LocaleConfig;
  readonly #formatter: DateFormatter;
  readonly #calendar: CalendarSystem;
  readonly #min: CalendarDate | undefined;
  readonly #max: CalendarDate | undefined;
  readonly #fixedWeeks: boolean;
  readonly #granularity: SelectionGranularity;
  readonly #minRangeDays: number | undefined;
  readonly #maxRangeDays: number | undefined;
  readonly #highlights: HighlightIndex;
  readonly #months: number;
  readonly #weekNumbers: boolean;
  readonly #headerSelectors: boolean;
  readonly #yearRange: readonly [number, number] | undefined;
  readonly #withTime: boolean;
  readonly #timeStep: number;
  readonly #use12HourClock: boolean;
  readonly #showSeconds: boolean;
  readonly #minTime: TimeOfDay | undefined;
  readonly #maxTime: TimeOfDay | undefined;
  #state: EngineState;

  constructor(options: DatePickerEngineOptions = {}) {
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

    const initial = options.initialFocused
      ? clamp(options.initialFocused, options.min, options.max)
      : clamp(this.#calendar.today(this.#locale.timeZone), options.min, options.max);

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
      selection: this.#strategy.initial(),
      isOpen: false,
      hovered: null,
      time: initialTime,
    });
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
    const nextSelection = this.#strategy.select(
      this.#state.selection as never,
      date,
    ) as SelectionValue;
    this.#commit({
      ...this.#state,
      focused: date,
      selection: nextSelection,
      // Clear the hover once a range completes / a single picks; redundant otherwise.
      hovered: null,
    });
    this.#bus.emit('select', { selection: nextSelection, focused: date });
  }

  clearSelection(): void {
    const next = this.#strategy.clear(this.#state.selection as never) as SelectionValue;
    this.#commit({ ...this.#state, selection: next, hovered: null });
    this.#bus.emit('select', { selection: next, focused: this.#state.focused });
  }

  setHovered(date: CalendarDate | null): void {
    if (date === null && this.#state.hovered === null) return;
    if (date !== null && this.#state.hovered !== null && isSameDay(date, this.#state.hovered))
      return;
    this.#commit({ ...this.#state, hovered: date });
    this.#bus.emit('hover', { hovered: date });
  }

  setTime(time: TimeOfDay | null): void {
    const clamped = time !== null ? this.#clampTime(time) : null;
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
    const today = this.#calendar.today(this.#locale.timeZone);
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

  #applyKeyAction(action: KeyboardAction): void {
    const cal = this.#calendar;
    const f = this.#state.focused;
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
        const delta = visual === 'left' ? -1 : visual === 'right' ? 1 : visual === 'up' ? -7 : 7;
        this.focus(cal.addDays(f, delta * action.amount));
        return;
      }
      case 'jump': {
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
      case 'page':
        if (action.direction === 'prev') {
          this.focus(action.large ? cal.addYears(f, -1) : cal.addMonths(f, -1));
        } else {
          this.focus(action.large ? cal.addYears(f, 1) : cal.addMonths(f, 1));
        }
        return;
      case 'select':
        this.selectFocused();
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
    });
    return Object.freeze({
      mode: this.#strategy.mode,
      view: input.view,
      focused: input.focused,
      selection: input.selection,
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
