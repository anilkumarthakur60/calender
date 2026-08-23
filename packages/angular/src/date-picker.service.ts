import {
  Injectable,
  InjectionToken,
  signal,
  type Signal,
  type WritableSignal,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  DatePickerEngine,
  type DatePickerEngineOptions,
  type EngineState,
} from '@anil-labs/calendar-core';

/**
 * Injection token carrying the engine options for a {@link DatePickerService}.
 * Provide it via `provideDatePicker(options)`; when absent the service falls
 * back to the engine defaults.
 */
export const DATE_PICKER_OPTIONS = new InjectionToken<DatePickerEngineOptions>(
  'anil-labs/date-picker-options',
);

/**
 * Injectable engine wrapper. Use `provideDatePicker(options)` to scope a
 * configured engine to a component subtree, or add `DatePickerService` to a
 * `providers` array to share an engine with default options. Must be
 * instantiated in an injection context (it reads `DATE_PICKER_OPTIONS` and
 * `DestroyRef` via `inject`).
 */
@Injectable()
export class DatePickerService {
  readonly engine: DatePickerEngine;
  readonly state: Signal<EngineState>;
  readonly #state: WritableSignal<EngineState>;

  constructor() {
    const options = inject(DATE_PICKER_OPTIONS, { optional: true }) ?? {};
    this.engine = new DatePickerEngine(options);
    this.#state = signal(this.engine.state);
    this.state = this.#state.asReadonly();
    const unsub = this.engine.on('change', () => this.#state.set(this.engine.state));
    inject(DestroyRef).onDestroy(() => unsub());
  }
}
