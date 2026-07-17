import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { DatePickerEngine, type DatePickerEngineOptions, type EngineState } from '@anil-labs/core';

export interface UseDatePickerResult {
  readonly engine: DatePickerEngine;
  readonly state: EngineState;
}

/**
 * React 18 binding. The engine is created exactly once (per component
 * instance) and React subscribes via `useSyncExternalStore` so reads are
 * concurrent-mode-safe and changes outside React still trigger a re-render.
 */
export const useDatePicker = (options: DatePickerEngineOptions = {}): UseDatePickerResult => {
  const optsRef = useRef(options);
  optsRef.current = options;

  const engine = useMemo(() => new DatePickerEngine(optsRef.current), []);

  const subscribe = useMemo(
    () => (listener: () => void) => engine.on('change', listener),
    [engine],
  );

  const state = useSyncExternalStore(
    subscribe,
    () => engine.state,
    () => engine.state,
  );

  useEffect(
    () => () => {
      /* no-op cleanup; engine has no timers */
    },
    [engine],
  );

  return { engine, state };
};
