import {
  Injectable,
  signal,
  type Signal,
  type WritableSignal,
  DestroyRef,
  inject,
} from '@angular/core';
import { DatePickerEngine, type DatePickerEngineOptions, type EngineState } from '@anil-labs/core';

/**
 * Injectable factory wrapper. Use `provideDatePicker(options)` (see index.ts)
 * to scope a fresh engine to a component, or inject this service to share one.
 */
@Injectable()
export class DatePickerService {
  readonly engine: DatePickerEngine;
  readonly state: Signal<EngineState>;
  readonly #state: WritableSignal<EngineState>;

  constructor(options: DatePickerEngineOptions = {}) {
    this.engine = new DatePickerEngine(options);
    this.#state = signal(this.engine.state);
    this.state = this.#state.asReadonly();
    const unsub = this.engine.on('change', () => this.#state.set(this.engine.state));
    inject(DestroyRef).onDestroy(() => unsub());
  }
}
