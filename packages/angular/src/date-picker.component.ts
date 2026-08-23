import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Injector,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  type CalendarDate,
  type DatePickerEngineOptions,
  type DateRange,
  type MonthGridCell,
  type PeriodCell,
  type SelectionValue,
  buildPeriodGrid,
  isInRange,
  isSameDay,
} from '@anil-labs/calendar-core';
import { DatePickerService } from './date-picker.service.js';

/**
 * Value shape exchanged with Angular forms, depending on the engine's
 * selection mode: `single` → `CalendarDate | null`, `range` →
 * `DateRange | null`, `multi` → `readonly CalendarDate[]`.
 */
export type DatePickerValue = CalendarDate | DateRange | readonly CalendarDate[] | null;

const dateKey = (date: CalendarDate): string => `${date.year}-${date.month}-${date.day}`;

@Component({
  selector: 'cal-date-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="cal-picker"
      [class.cal-picker--disabled]="disabled()"
      role="group"
      aria-label="Date picker"
      [attr.aria-disabled]="disabled() || null"
      [attr.dir]="direction()"
      [attr.data-view]="state().view"
      [attr.data-mode]="state().mode"
      (keydown)="onKey($event)"
      (focusout)="onFocusOut($event)"
    >
      <div class="cal-picker__header">
        <button
          type="button"
          class="cal-picker__nav"
          aria-label="Previous"
          [disabled]="disabled()"
          (click)="picker.engine.pagePrev()"
        >
          ‹
        </button>
        <button
          type="button"
          class="cal-picker__title"
          [disabled]="disabled()"
          (click)="picker.engine.drillUp()"
        >
          {{ monthYearLabel() }}
        </button>
        <button
          type="button"
          class="cal-picker__nav"
          aria-label="Next"
          [disabled]="disabled()"
          (click)="picker.engine.pageNext()"
        >
          ›
        </button>
      </div>
      <div class="cal-picker__periods" *ngIf="view() !== 'day'">
        <button
          *ngFor="let cell of periodCells(); trackBy: trackByPeriod"
          type="button"
          class="cal-picker__period"
          [attr.aria-label]="cell.longLabel"
          [attr.data-focused]="cell.isFocused || null"
          [attr.data-today]="cell.isToday || null"
          [attr.data-outside]="cell.outside || null"
          [disabled]="disabled()"
          (click)="onPeriodClick(cell)"
        >
          {{ cell.label }}
        </button>
      </div>
      <div class="cal-picker__grid" role="grid" *ngIf="view() === 'day'">
        <div class="cal-picker__row" role="row">
          <div
            *ngFor="let w of state().grid.weekdayHeaders; trackBy: trackByValue"
            class="cal-picker__weekday"
            role="columnheader"
          >
            {{ picker.engine.formatter.formatWeekday(w, 'short') }}
          </div>
        </div>
        <div
          *ngFor="let week of state().grid.weeks; trackBy: trackByWeek"
          class="cal-picker__row"
          role="row"
        >
          <button
            *ngFor="let cell of week; trackBy: trackByCell"
            type="button"
            role="gridcell"
            class="cal-picker__cell"
            [attr.tabindex]="isFocused(cell.date) ? 0 : -1"
            [attr.aria-selected]="picker.engine.isSelected(cell.date) || null"
            [attr.aria-disabled]="picker.engine.isDisabled(cell.date) || null"
            [attr.aria-label]="picker.engine.formatter.formatFull(cell.date)"
            [attr.data-outside]="!cell.inCurrentMonth || null"
            [attr.data-today]="cell.isToday || null"
            [attr.data-weekend]="cell.isWeekend || null"
            [attr.data-selected]="picker.engine.isSelected(cell.date) || null"
            [attr.data-disabled]="picker.engine.isDisabled(cell.date) || null"
            [attr.data-range-start]="isRangeStart(cell.date) || null"
            [attr.data-range-end]="isRangeEnd(cell.date) || null"
            [attr.data-range-mid]="isRangeMid(cell.date) || null"
            (click)="onClick(cell.date)"
          >
            {{ picker.engine.formatter.formatDay(cell.date) }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DatePickerComponent implements ControlValueAccessor {
  /**
   * Provided service when a parent used `provideDatePicker(...)`; otherwise a
   * component-scoped instance (created in the component's injection context,
   * so it still honours a visible `DATE_PICKER_OPTIONS` and is destroyed with
   * the component).
   */
  readonly picker = inject(DatePickerService, { optional: true }) ?? new DatePickerService();
  readonly state = this.picker.state;
  readonly disabled = signal(false);
  readonly direction = computed(() => {
    // Touch the state signal: without a dependency this never recomputes, so
    // switching to an RTL locale updated the engine but never the DOM.
    this.state();
    return this.picker.engine.locale.direction;
  });
  readonly monthYearLabel = computed(() =>
    this.picker.engine.formatter.formatMonthYear(this.state().focused),
  );
  /** Current view; `day` renders the month grid, anything else a period grid. */
  readonly view = computed(() => this.state().view);
  /**
   * Cells for the month / year / decade views. The title button drills up, so
   * without this the template kept rendering day cells for every view.
   */
  readonly periodCells = computed<ReadonlyArray<PeriodCell>>(() => {
    const s = this.state();
    if (s.view === 'day') return [];
    return buildPeriodGrid(
      s.focused,
      s.view,
      this.picker.engine.calendar,
      this.picker.engine.locale.locale,
    ).cells;
  });

  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  #onChange: ((value: DatePickerValue) => void) | null = null;
  #onTouched: (() => void) | null = null;
  #writingValue = false;

  constructor() {
    const engine = this.picker.engine;
    const unsubSelect = engine.on('select', ({ selection, focused }) => {
      if (this.#writingValue) return;
      this.select.emit(focused);
      this.#onChange?.(selection.value);
    });
    // Re-render replaces cell buttons; if focus was inside the grid, move it
    // to the new roving-tabindex cell once the DOM has been updated.
    const unsubChange = engine.on('change', () => {
      const grid = this.#host.querySelector('.cal-picker__grid');
      const active = typeof document === 'undefined' ? null : document.activeElement;
      if (!grid || !active || !grid.contains(active)) return;
      afterNextRender(
        () => {
          const cell = this.#host.querySelector<HTMLElement>('.cal-picker__cell[tabindex="0"]');
          cell?.focus({ preventScroll: true });
        },
        { injector: this.#injector },
      );
    });
    inject(DestroyRef).onDestroy(() => {
      unsubSelect();
      unsubChange();
    });
  }

  /**
   * Live-reconfigure the engine. Options are merged over the ones the engine
   * was created with; selection and focus are preserved where still valid.
   */
  @Input() set options(value: DatePickerEngineOptions | null) {
    if (!value) return;
    this.picker.engine.setOptions(value);
  }

  /**
   * Emits whenever the engine commits a selection — pointer, keyboard
   * (Enter/Space) and programmatic `engine.select(...)` alike.
   */
  @Output() readonly select = new EventEmitter<CalendarDate>();

  isFocused(date: CalendarDate): boolean {
    return isSameDay(date, this.state().focused);
  }
  isRangeStart(date: CalendarDate): boolean {
    const s = this.state().selection;
    return s.mode === 'range' && s.value !== null && isSameDay(date, s.value.start);
  }
  isRangeEnd(date: CalendarDate): boolean {
    const s = this.state().selection;
    return s.mode === 'range' && s.value !== null && isSameDay(date, s.value.end);
  }
  isRangeMid(date: CalendarDate): boolean {
    const s = this.state().selection;
    if (s.mode !== 'range' || s.value === null) return false;
    return (
      isInRange(date, s.value, true) &&
      !isSameDay(date, s.value.start) &&
      !isSameDay(date, s.value.end)
    );
  }

  trackByValue(_index: number, value: number): number {
    return value;
  }
  trackByCell(_index: number, cell: MonthGridCell): string {
    return dateKey(cell.date);
  }
  trackByWeek(index: number, week: readonly MonthGridCell[]): string {
    return week[0] ? dateKey(week[0].date) : String(index);
  }

  onClick(date: CalendarDate): void {
    if (this.disabled() || this.picker.engine.isDisabled(date)) return;
    this.picker.engine.select(date);
  }

  /** Mark the control touched when focus actually leaves the picker. */
  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.#host.contains(next)) return;
    this.#onTouched?.();
  }

  onPeriodClick(cell: PeriodCell): void {
    if (this.disabled()) return;
    this.picker.engine.pickInView(cell.date);
  }

  trackByPeriod(_index: number, cell: PeriodCell): string {
    return `${cell.date.year}-${cell.date.month}`;
  }

  onKey(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const action = this.picker.engine.handleKey(event);
    if (action) event.preventDefault();
  }

  // --- ControlValueAccessor --------------------------------------------------

  writeValue(value: DatePickerValue): void {
    const engine = this.picker.engine;
    this.#writingValue = true;
    try {
      if (value === null || value === undefined) {
        engine.clearSelection();
        return;
      }
      const mode: SelectionValue['mode'] = engine.state.selection.mode;
      if (mode === 'range') {
        if (!Array.isArray(value) && typeof value === 'object' && 'start' in value) {
          engine.selectRange(value.start, value.end);
        }
      } else if (mode === 'multi') {
        engine.clearSelection();
        const dates = Array.isArray(value) ? value : 'year' in value ? [value] : [];
        for (const date of dates) engine.select(date);
      } else if (!Array.isArray(value) && 'year' in value) {
        engine.select(value);
      }
    } finally {
      this.#writingValue = false;
    }
  }

  registerOnChange(fn: (value: DatePickerValue) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
