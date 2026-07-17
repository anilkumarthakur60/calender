import { onBeforeUnmount, shallowRef, triggerRef, type ShallowRef } from 'vue';
import { DatePickerEngine, type DatePickerEngineOptions, type EngineState } from '@anil-labs/core';

export interface UseDatePickerResult {
  readonly engine: DatePickerEngine;
  readonly state: ShallowRef<EngineState>;
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
    triggerRef(state);
  });
  onBeforeUnmount(() => unsub());
  return { engine, state };
};
