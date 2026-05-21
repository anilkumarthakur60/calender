import {
  DatePickerEngine,
  type DatePickerEngineOptions,
  type EngineState,
} from '@calender/core';

export interface SvelteStoreLike<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface CreateDatePickerResult {
  readonly engine: DatePickerEngine;
  /** Svelte-compatible readable store of EngineState (works with `$state` reads). */
  readonly state: SvelteStoreLike<EngineState>;
  /** Manual subscribe outside of components (e.g. effects). */
  readonly subscribe: (listener: (state: EngineState) => void) => () => void;
}

/**
 * Framework-agnostic factory that also satisfies Svelte's store contract via
 * `subscribe`. Works with Svelte 3/4 `$store` and Svelte 5 `$state` bridges
 * without depending on Svelte at runtime.
 */
export const createDatePicker = (
  options: DatePickerEngineOptions = {},
): CreateDatePickerResult => {
  const engine = new DatePickerEngine(options);

  const subscribe = (listener: (state: EngineState) => void): (() => void) => {
    listener(engine.state);
    return engine.on('change', () => listener(engine.state));
  };

  return {
    engine,
    state: { subscribe },
    subscribe,
  };
};
