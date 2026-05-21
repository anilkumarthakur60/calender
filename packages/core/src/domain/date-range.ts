import {
  type CalendarDate,
  compareDates,
  isAfter,
  isBefore,
  isSameDay,
} from './calendar-date.js';

export interface DateRange {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
}

export const createRange = (a: CalendarDate, b: CalendarDate): DateRange => {
  const [start, end] = compareDates(a, b) <= 0 ? [a, b] : [b, a];
  return Object.freeze({ start, end });
};

export const isInRange = (
  date: CalendarDate,
  range: DateRange,
  inclusive: boolean = true,
): boolean => {
  if (inclusive) {
    return !isBefore(date, range.start) && !isAfter(date, range.end);
  }
  return isAfter(date, range.start) && isBefore(date, range.end);
};

export const isRangeStart = (date: CalendarDate, range: DateRange): boolean =>
  isSameDay(date, range.start);

export const isRangeEnd = (date: CalendarDate, range: DateRange): boolean =>
  isSameDay(date, range.end);
