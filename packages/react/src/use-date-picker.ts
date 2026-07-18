import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { DatePickerEngine, type DatePickerEngineOptions, type EngineState } from '@anil-labs/core';

export interface UseDatePickerResult {
  readonly engine: DatePickerEngine;
  readonly state: EngineState;
}

/**
 * Construction-only options are ignored by `engine.setOptions`, so they must
 * not participate in the "did the options change?" comparison either.
 */
const reconfigurableOptions = (
  options: DatePickerEngineOptions,
): Partial<DatePickerEngineOptions> => {
  const { initialFocused: _f, initialView: _v, initialSelected: _s, ...rest } = options;
  return rest;
};

/**
 * Value-stable serialization so inline-object props (new identity every
 * render) cannot trigger a reconfigure loop. Non-serializable options fall
 * back to a constant, i.e. changes to them are not auto-detected.
 */
const serializeOptions = (options: Partial<DatePickerEngineOptions>): string => {
  try {
    return JSON.stringify(options);
  } catch {
    return '<non-serializable>';
  }
};

/**
 * React 18 binding. The engine is created exactly once (per component
 * instance) and React subscribes via `useSyncExternalStore` so reads are
 * concurrent-mode-safe and changes outside React still trigger a re-render.
 * Option changes after mount are forwarded to `engine.setOptions` (compared
 * by value, so identity churn alone never reconfigures).
 */
export const useDatePicker = (options: DatePickerEngineOptions = {}): UseDatePickerResult => {
  const optsRef = useRef(options);
  optsRef.current = options;

  // Construct exactly once; later option changes flow through engine.setOptions below.
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

  // Reconfigure the live engine when option VALUES change after mount.
  const serialized = serializeOptions(reconfigurableOptions(options));
  const appliedRef = useRef(serialized);
  useEffect(() => {
    if (appliedRef.current === serialized) return;
    appliedRef.current = serialized;
    engine.setOptions(reconfigurableOptions(optsRef.current));
  }, [engine, serialized]);

  return { engine, state };
};
