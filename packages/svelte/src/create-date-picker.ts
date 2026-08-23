import {
  DatePickerEngine,
  type DatePickerEngineOptions,
  type EngineState,
} from '@anil-labs/calendar-core';

export interface SvelteStoreLike<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface CreateDatePickerResult {
  /**
   * The underlying engine. Exposed so consumers can issue commands
   * (`engine.select(...)`, `engine.pageNext()`, ...) and reconfigure a live
   * picker via `engine.setOptions(partial)` — selection and focus are
   * preserved where still valid, and subscribers are notified.
   */
  readonly engine: DatePickerEngine;
  /**
   * Svelte-compatible readable store of EngineState. Read it with `$store`
   * auto-subscription in Svelte 3/4/5, or bridge it into a rune with
   * Svelte 5's `fromStore`.
   *
   * Deliberately NOT named `state`: destructuring `const { state } = ...` in a
   * Svelte 5 component that also uses the `$state` rune compiles with only a
   * `store_rune_conflict` warning and rewrites the rune into a store read,
   * producing a runtime TypeError.
   */
  readonly store: SvelteStoreLike<EngineState>;
  /** Manual subscribe outside of components (e.g. effects). */
  readonly subscribe: (listener: (state: EngineState) => void) => () => void;
  /**
   * Reconfigure the live engine. Shorthand for `engine.setOptions(partial)`:
   * options are merged over the ones the picker was created with, selection
   * and focus survive where still valid, and every subscriber receives the
   * new state synchronously.
   */
  readonly setOptions: (partial: Partial<DatePickerEngineOptions>) => void;
  /**
   * Release the engine and every listener registered on it. Svelte has no
   * ambient owner here, so call this from `onDestroy` when you create a picker
   * per component. Idempotent.
   */
  readonly dispose: () => void;
}

/**
 * Framework-agnostic factory that also satisfies Svelte's store contract via
 * `subscribe`. Use `$store` auto-subscription (Svelte 3/4/5) or Svelte 5's
 * `fromStore` bridge to read it reactively — no Svelte runtime dependency.
 */
export const createDatePicker = (options: DatePickerEngineOptions = {}): CreateDatePickerResult => {
  const engine = new DatePickerEngine(options);

  const subscribe = (listener: (state: EngineState) => void): (() => void) => {
    listener(engine.state);
    return engine.on('change', () => listener(engine.state));
  };

  return {
    engine,
    store: { subscribe },
    subscribe,
    setOptions: partial => engine.setOptions(partial),
    dispose: () => engine.destroy(),
  };
};
