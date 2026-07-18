import { createSignal, getOwner, onCleanup, type Accessor } from 'solid-js';
import { DatePickerEngine, type DatePickerEngineOptions, type EngineState } from '@anil-labs/core';

export interface CreateDatePickerResult {
  readonly engine: DatePickerEngine;
  readonly state: Accessor<EngineState>;
  /**
   * Release the engine subscription. Inside a reactive root (component,
   * `createRoot`) this is registered via `onCleanup` and runs automatically —
   * calling it earlier is safe and idempotent. Outside a root there is no
   * owner to clean up for you, so you MUST call `dispose()` yourself once the
   * picker is no longer needed, or the engine listener is never released.
   */
  readonly dispose: () => void;
}

/**
 * Solid binding. Engine state is mirrored into a fine-grained signal; every
 * commit pushes a new frozen object so identity-based reactivity is honoured.
 *
 * Lifecycle: when called under an owner (a component or `createRoot`), the
 * engine subscription is cleaned up with the owner. When called outside any
 * reactive root, `onCleanup` would be a silent no-op — so it is skipped and
 * the returned `dispose()` is the only way to release the subscription.
 */
export const createDatePicker = (options: DatePickerEngineOptions = {}): CreateDatePickerResult => {
  const engine = new DatePickerEngine(options);
  const [state, setState] = createSignal(engine.state);
  const unsub = engine.on('change', () => setState(engine.state));
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    unsub();
  };
  if (getOwner()) onCleanup(dispose);
  return { engine, state, dispose };
};
