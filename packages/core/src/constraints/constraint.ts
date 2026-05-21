import type { CalendarDate } from '../domain/calendar-date.js';

/**
 * Predicate-style constraint: returns a reason string when a date is *not*
 * selectable, or `null` when it is. Reason strings are surfaced to a11y
 * announcers and can drive tooltips. Composable via {@link CompositeConstraint}.
 */
export interface DateConstraint {
  evaluate(date: CalendarDate): string | null;
}
