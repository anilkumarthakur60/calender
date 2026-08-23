import { getCurrentScope, onScopeDispose, shallowRef, type ShallowRef } from 'vue';
import {
  DatePickerEngine,
  type DatePickerEngineOptions,
  type EngineState,
} from '@anil-labs/calendar-core';

export interface UseDatePickerResult {
  readonly engine: DatePickerEngine;
  readonly state: ShallowRef<EngineState>;
  /**
   * Detach the engine subscription. Called automatically when the surrounding
   * effect scope (component or `effectScope()`) is disposed; call it manually
   * when the composable is used outside any scope.
   */
  readonly dispose: () => void;
}

/**
 * Vue 3 composable. Engine state is exposed as a `shallowRef` — internally
 * Vue.js sees a new EngineState identity on every commit (engine emits a
 * frozen object), so shallow tracking is sufficient and cheap.
 */
export const useDatePicker = (options: DatePickerEngineOptions = {}): UseDatePickerResult => {
  const engine = new DatePickerEngine(options);
  const state = shallowRef(engine.state) as ShallowRef<EngineState>;
  const unsub = engine.on('change', () => {
    state.value = engine.state;
  });

  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    unsub();
  };

  // Scope-aware cleanup: works inside components AND standalone effectScope()s,
  // and never warns when the composable runs outside a scope entirely.
  if (getCurrentScope()) onScopeDispose(dispose);

  return { engine, state, dispose };
};
