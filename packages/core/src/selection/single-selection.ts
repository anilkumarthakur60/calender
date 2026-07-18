import { type CalendarDate, isSameDay } from '../domain';
import type { SelectionStrategy, SelectionValue } from './selection-strategy.js';

type S = Extract<SelectionValue, { mode: 'single' }>;

export class SingleSelectionStrategy implements SelectionStrategy<S> {
  readonly mode = 'single' as const;

  initial(): S {
    return { mode: 'single', value: null };
  }

  select(_state: S, date: CalendarDate): S {
    return { mode: 'single', value: date };
  }

  clear(_state: S): S {
    return { mode: 'single', value: null };
  }

  isSelected(state: S, date: CalendarDate): boolean {
    return state.value !== null && isSameDay(state.value, date);
  }

  isComplete(state: S): boolean {
    return state.value !== null;
  }
}
