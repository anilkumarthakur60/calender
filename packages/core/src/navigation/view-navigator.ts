import { type CalendarSystem, GregorianCalendar } from '../calendar';
import { type CalendarDate, clamp } from '../domain';
import type { ViewMode } from './view-mode.js';

export interface NavigationBounds {
  readonly min?: CalendarDate;
  readonly max?: CalendarDate;
}

/**
 * Pure functions that move a "focused" date relative to the current view mode.
 * Day-view → ±1 month per page; month-view → ±1 year per page; etc.
 * Calendar arithmetic delegates to the supplied {@link CalendarSystem} so BS
 * (and any future calendars) traverse correctly through irregular month lengths.
 */
const step = (
  date: CalendarDate,
  mode: ViewMode,
  direction: 1 | -1,
  bounds: NavigationBounds,
  calendar: CalendarSystem,
): CalendarDate => {
  switch (mode) {
    case 'day':
      return clamp(calendar.addMonths(date, direction), bounds.min, bounds.max);
    case 'month':
      return clamp(calendar.addYears(date, direction), bounds.min, bounds.max);
    case 'year':
      return clamp(calendar.addYears(date, 10 * direction), bounds.min, bounds.max);
    case 'decade':
      return clamp(calendar.addYears(date, 100 * direction), bounds.min, bounds.max);
  }
};

export const stepBackward = (
  date: CalendarDate,
  mode: ViewMode,
  bounds: NavigationBounds = {},
  calendar: CalendarSystem = new GregorianCalendar(),
): CalendarDate => step(date, mode, -1, bounds, calendar);

export const stepForward = (
  date: CalendarDate,
  mode: ViewMode,
  bounds: NavigationBounds = {},
  calendar: CalendarSystem = new GregorianCalendar(),
): CalendarDate => step(date, mode, 1, bounds, calendar);
