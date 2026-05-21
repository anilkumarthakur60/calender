import type { CalendarDate } from '../domain/calendar-date.js';
import type { DateConstraint } from './constraint.js';

export type DateFilterPredicate = (date: CalendarDate) => boolean;

export class FilterConstraint implements DateConstraint {
  constructor(
    private readonly predicate: DateFilterPredicate,
    private readonly reason: string = 'filtered',
  ) {}

  evaluate(date: CalendarDate): string | null {
    return this.predicate(date) ? null : this.reason;
  }
}
