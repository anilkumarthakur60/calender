import type { CalendarDate } from '../domain/calendar-date.js';
import { addMonths, addYears, clamp } from '../domain/calendar-date.js';
import type { ViewMode } from './view-mode.js';

export interface NavigationBounds {
  readonly min?: CalendarDate;
  readonly max?: CalendarDate;
}

/**
 * Pure functions that move a "focused" date relative to the current view mode.
 * Day-view → ±1 month per page; month-view → ±1 year per page; etc.
 */
export const stepBackward = (
  date: CalendarDate,
  mode: ViewMode,
  bounds: NavigationBounds = {},
): CalendarDate => {
  switch (mode) {
    case 'day':
      return clamp(addMonths(date, -1), bounds.min, bounds.max);
    case 'month':
      return clamp(addYears(date, -1), bounds.min, bounds.max);
    case 'year':
      return clamp(addYears(date, -10), bounds.min, bounds.max);
    case 'decade':
      return clamp(addYears(date, -100), bounds.min, bounds.max);
  }
};

export const stepForward = (
  date: CalendarDate,
  mode: ViewMode,
  bounds: NavigationBounds = {},
): CalendarDate => {
  switch (mode) {
    case 'day':
      return clamp(addMonths(date, 1), bounds.min, bounds.max);
    case 'month':
      return clamp(addYears(date, 1), bounds.min, bounds.max);
    case 'year':
      return clamp(addYears(date, 10), bounds.min, bounds.max);
    case 'decade':
      return clamp(addYears(date, 100), bounds.min, bounds.max);
  }
};
