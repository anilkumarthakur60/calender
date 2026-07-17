import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  type CalendarDate,
  type DatePickerEngineOptions,
  isInRange,
  isSameDay,
} from '@anil-labs/core';
import { DatePickerService } from './date-picker.service.js';

@Component({
  selector: 'cal-date-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: DatePickerService,
      useFactory: () => new DatePickerService({}),
    },
  ],
  template: `
    <div
      class="cal-picker"
      role="group"
      aria-label="Date picker"
      [attr.dir]="direction()"
      [attr.data-view]="state().view"
      [attr.data-mode]="state().mode"
      (keydown)="onKey($event)"
    >
      <div class="cal-picker__header">
        <button
          type="button"
          class="cal-picker__nav"
          aria-label="Previous"
          (click)="picker.engine.pagePrev()"
        >
          ‹
        </button>
        <button type="button" class="cal-picker__title" (click)="picker.engine.drillUp()">
          {{ monthYearLabel() }}
        </button>
        <button
          type="button"
          class="cal-picker__nav"
          aria-label="Next"
          (click)="picker.engine.pageNext()"
        >
          ›
        </button>
      </div>
      <div class="cal-picker__grid" role="grid">
        <div
          *ngFor="let w of state().grid.weekdayHeaders"
          class="cal-picker__weekday"
          role="columnheader"
        >
          {{ picker.engine.formatter.formatWeekday(w, 'short') }}
        </div>
        <ng-container *ngFor="let week of state().grid.weeks">
          <button
            *ngFor="let cell of week"
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
        </ng-container>
      </div>
    </div>
  `,
})
export class DatePickerComponent {
  readonly picker = inject(DatePickerService);
  readonly state = this.picker.state;
  readonly direction = computed(() => this.picker.engine.locale.direction);
  readonly monthYearLabel = computed(() =>
    this.picker.engine.formatter.formatMonthYear(this.state().focused),
  );

  @Input() set options(value: DatePickerEngineOptions | null) {
    if (!value) return;
    // Angular intentionally re-creates the engine when options are replaced
    // via providers in real usage; this setter is for one-shot configuration.
    Object.assign(this.picker.engine, value);
  }

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

  onClick(date: CalendarDate): void {
    if (this.picker.engine.isDisabled(date)) return;
    this.picker.engine.select(date);
    this.select.emit(date);
  }

  onKey(event: KeyboardEvent): void {
    const action = this.picker.engine.handleKey(event);
    if (action) event.preventDefault();
  }
}
