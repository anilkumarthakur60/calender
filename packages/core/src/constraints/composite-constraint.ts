import type { CalendarDate } from '../domain';
import type { DateConstraint } from './constraint.js';

export class CompositeConstraint implements DateConstraint {
  readonly #constraints: ReadonlyArray<DateConstraint>;

  constructor(constraints: Iterable<DateConstraint>) {
    this.#constraints = [...constraints];
  }

  evaluate(date: CalendarDate): string | null {
    for (const c of this.#constraints) {
      const reason = c.evaluate(date);
      if (reason !== null) return reason;
    }
    return null;
  }
}
