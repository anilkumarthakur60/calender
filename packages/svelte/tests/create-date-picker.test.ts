import { describe, expect, it, vi } from 'vitest';
import { createCalendarDate } from '@anil-labs/core';
import { createDatePicker } from '../src/create-date-picker.js';

describe('createDatePicker (svelte store contract)', () => {
  it('calls subscribers synchronously with the current state', () => {
    const { state } = createDatePicker({
      initialFocused: createCalendarDate(2025, 4, 15),
    });
    const run = vi.fn();
    state.subscribe(run);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]![0].focused).toEqual({ year: 2025, month: 4, day: 15 });
  });

  it('notifies subscribers when engine.select mutates state', () => {
    const { engine, state } = createDatePicker({
      initialFocused: createCalendarDate(2025, 4, 15),
    });
    const run = vi.fn();
    state.subscribe(run);
    engine.select(createCalendarDate(2025, 4, 20));
    expect(run).toHaveBeenCalledTimes(2);
    const latest = run.mock.calls.at(-1)![0];
    expect(latest.selection).toEqual({
      mode: 'single',
      value: { year: 2025, month: 4, day: 20 },
    });
  });

  it('stops updates after unsubscribe', () => {
    const { engine, state } = createDatePicker({
      initialFocused: createCalendarDate(2025, 4, 15),
    });
    const run = vi.fn();
    const unsubscribe = state.subscribe(run);
    unsubscribe();
    engine.select(createCalendarDate(2025, 4, 20));
    expect(run).toHaveBeenCalledTimes(1); // only the initial synchronous call
  });

  it('keeps two subscribers independent', () => {
    const { engine, state } = createDatePicker({
      initialFocused: createCalendarDate(2025, 4, 15),
    });
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = state.subscribe(first);
    state.subscribe(second);
    unsubscribeFirst();
    engine.select(createCalendarDate(2025, 4, 21));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('exposes subscribe directly on the result (store contract on the factory)', () => {
    const picker = createDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) });
    const run = vi.fn();
    const unsubscribe = picker.subscribe(run);
    expect(run).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('setOptions reconfigures the live engine and pushes new state', () => {
    const { engine, state, setOptions } = createDatePicker({
      initialFocused: createCalendarDate(2025, 4, 15),
    });
    engine.select(createCalendarDate(2025, 4, 20));
    const run = vi.fn();
    state.subscribe(run);
    setOptions({ min: createCalendarDate(2025, 4, 1) });
    expect(run).toHaveBeenCalledTimes(2);
    const latest = run.mock.calls.at(-1)![0];
    // Selection survives a reconfigure that still permits it.
    expect(latest.selection.value).toEqual({ year: 2025, month: 4, day: 20 });
  });
});
