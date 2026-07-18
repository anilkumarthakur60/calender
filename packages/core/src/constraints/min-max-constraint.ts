import { type CalendarDate, isAfter, isBefore } from '../domain';
import type { DateConstraint } from './constraint.js';

export class MinMaxConstraint implements DateConstraint {
  constructor(
    private readonly min: CalendarDate | undefined,
    private readonly max: CalendarDate | undefined,
  ) {}

  evaluate(date: CalendarDate): string | null {
    if (this.min && isBefore(date, this.min)) return 'before-min';
    if (this.max && isAfter(date, this.max)) return 'after-max';
    return null;
  }
}
