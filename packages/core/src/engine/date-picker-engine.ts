import type { CalendarDate } from '../domain/calendar-date.js';
import {
  addDays,
  addMonths,
  addYears,
  clamp,
  endOfMonth,
  isSameDay,
  startOfMonth,
  todayCalendarDate,
} from '../domain/calendar-date.js';
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
import type { DatePickerEngineOptions } from './engine-options.js';
import type { EngineState } from './engine-state.js';
import type { KeyboardAction } from '../focus/keyboard-action.js';
import { interpretKey, type KeyboardEventLike } from '../focus/keyboard-controller.js';

export interface DatePickerEvents {
  change: { state: EngineState; previous: EngineState };
  select: { selection: SelectionValue; focused: CalendarDate };
  focus: { focused: CalendarDate; previous: CalendarDate };
  view: { view: ViewMode; previous: ViewMode };
  open: { focused: CalendarDate };
  close: { reason: 'cancel' | 'commit' | 'outside' };
}

/**
 * Facade orchestrating selection strategy, constraints, navigation, locale,
 * and focus. The facade is the only public class; everything else is
 * injectable. Renderers consume the immutable {@link EngineState} snapshot.
 */
export class DatePickerEngine {
  readonly #bus = new EventBus<DatePickerEvents>();
  readonly #strategy: SelectionStrategy;
  readonly #constraint: DateConstraint;
  readonly #locale: LocaleConfig;
  readonly #formatter: DateFormatter;
  readonly #min: CalendarDate | undefined;
  readonly #max: CalendarDate | undefined;
  readonly #fixedWeeks: boolean;
  #state: EngineState;

  constructor(options: DatePickerEngineOptions = {}) {
    this.#locale = resolveLocaleConfig(options.locale ?? {});
    this.#formatter = new DateFormatter(this.#locale);
    const mode = options.mode ?? 'single';
    const strategyOpts: { range?: typeof options.range; multi?: typeof options.multi } = {};
    if (options.range !== undefined) strategyOpts.range = options.range;
    if (options.multi !== undefined) strategyOpts.multi = options.multi;
    this.#strategy = createSelectionStrategy(mode, strategyOpts);
    this.#min = options.min;
    this.#max = options.max;
    this.#fixedWeeks = options.fixedWeeks ?? true;

    const constraints: DateConstraint[] = [];
    if (options.min || options.max)
      constraints.push(new MinMaxConstraint(options.min, options.max));
    if (options.disabledDates?.length)
      constraints.push(new DisabledDatesConstraint(options.disabledDates));
    if (options.disabledWeekdays?.length)
      constraints.push(new DisabledWeekdayConstraint(options.disabledWeekdays));
    if (options.extraConstraints?.length) constraints.push(...options.extraConstraints);
    this.#constraint = new CompositeConstraint(constraints);

    const initial = options.initialFocused
      ? clamp(options.initialFocused, options.min, options.max)
      : clamp(todayCalendarDate(this.#locale.timeZone), options.min, options.max);

    this.#state = this.#buildState({
      focused: initial,
      view: options.initialView ?? 'day',
      selection: this.#strategy.initial(),
      isOpen: false,
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
    if (this.isDisabled(date)) return;
    const nextSelection = this.#strategy.select(
      this.#state.selection as never,
      date,
    ) as SelectionValue;
    this.#commit({ ...this.#state, focused: date, selection: nextSelection });
    this.#bus.emit('select', { selection: nextSelection, focused: date });
    if (this.#strategy.isComplete(nextSelection as never)) {
      // Range mode: emit 'change' only — consumer decides whether to close.
    }
  }

  clearSelection(): void {
    const next = this.#strategy.clear(this.#state.selection as never) as SelectionValue;
    this.#commit({ ...this.#state, selection: next });
    this.#bus.emit('select', { selection: next, focused: this.#state.focused });
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

  pagePrev(): void {
    const bounds: { min?: CalendarDate; max?: CalendarDate } = {};
    if (this.#min !== undefined) bounds.min = this.#min;
    if (this.#max !== undefined) bounds.max = this.#max;
    this.focus(stepBackward(this.#state.focused, this.#state.view, bounds));
  }

  pageNext(): void {
    const bounds: { min?: CalendarDate; max?: CalendarDate } = {};
    if (this.#min !== undefined) bounds.min = this.#min;
    if (this.#max !== undefined) bounds.max = this.#max;
    this.focus(stepForward(this.#state.focused, this.#state.view, bounds));
  }

  handleKey(event: KeyboardEventLike): KeyboardAction | null {
    const action = interpretKey(event);
    if (!action) return null;
    this.#applyKeyAction(action);
    return action;
  }

  // --- internals -----------------------------------------------------------

  #applyKeyAction(action: KeyboardAction): void {
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
        this.focus(addDays(f, delta * action.amount));
        return;
      }
      case 'jump':
        switch (action.target) {
          case 'rowStart':
            this.focus(addDays(f, -((f.day - 1) % 7)));
            return;
          case 'rowEnd':
            this.focus(addDays(f, 6 - ((f.day - 1) % 7)));
            return;
          case 'monthStart':
            this.focus(startOfMonth(f));
            return;
          case 'monthEnd':
            this.focus(endOfMonth(f));
            return;
        }
      case 'page':
        if (action.direction === 'prev') {
          this.focus(action.large ? addYears(f, -1) : addMonths(f, -1));
        } else {
          this.focus(action.large ? addYears(f, 1) : addMonths(f, 1));
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
    });
    return Object.freeze({
      mode: this.#strategy.mode,
      view: input.view,
      focused: input.focused,
      selection: input.selection,
      grid,
      isOpen: input.isOpen,
    });
  }

  #commit(partial: Omit<EngineState, 'grid' | 'mode'>): void {
    const previous = this.#state;
    this.#state = this.#buildState(partial);
    this.#bus.emit('change', { state: this.#state, previous });
  }
}
