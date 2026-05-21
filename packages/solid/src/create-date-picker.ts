import { createSignal, onCleanup, type Accessor } from 'solid-js';
import {
  DatePickerEngine,
  type DatePickerEngineOptions,
  type EngineState,
} from '@calender/core';

export interface CreateDatePickerResult {
  readonly engine: DatePickerEngine;
  readonly state: Accessor<EngineState>;
}

/**
 * Solid binding. Engine state is mirrored into a fine-grained signal; every
 * commit pushes a new frozen object so identity-based reactivity is honoured.
 */
export const createDatePicker = (
  options: DatePickerEngineOptions = {},
): CreateDatePickerResult => {
  const engine = new DatePickerEngine(options);
  const [state, setState] = createSignal(engine.state);
  const unsub = engine.on('change', () => setState(engine.state));
  onCleanup(unsub);
  return { engine, state };
};
