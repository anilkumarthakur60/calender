import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
import { createCalendarDate } from '@anil-labs/core';
import { createDatePicker } from '../src/create-date-picker.js';

describe('createDatePicker (solid)', () => {
  it('mirrors engine.select into the state signal inside a root', () => {
    createRoot(dispose => {
      const { engine, state } = createDatePicker({
        initialFocused: createCalendarDate(2025, 4, 15),
      });
      expect(state().focused).toEqual({ year: 2025, month: 4, day: 15 });
      engine.select(createCalendarDate(2025, 4, 20));
      expect(state().selection).toEqual({
        mode: 'single',
        value: { year: 2025, month: 4, day: 20 },
      });
      dispose();
    });
  });

  it('stops signal updates after the root is disposed', () => {
    let picker!: ReturnType<typeof createDatePicker>;
    createRoot(dispose => {
      picker = createDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) });
      dispose();
    });
    picker.engine.select(createCalendarDate(2025, 4, 20));
    // Engine state moved on, but the signal froze at disposal time.
    expect(picker.engine.state.selection.value).toEqual({ year: 2025, month: 4, day: 20 });
    expect(picker.state().selection.value).toBeNull();
  });

  it('works outside a reactive root with manual dispose', () => {
    const picker = createDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) });
    picker.engine.select(createCalendarDate(2025, 4, 18));
    expect(picker.state().selection.value).toEqual({ year: 2025, month: 4, day: 18 });

    picker.dispose();
    picker.engine.select(createCalendarDate(2025, 4, 25));
    expect(picker.state().selection.value).toEqual({ year: 2025, month: 4, day: 18 });
  });

  it('dispose is idempotent and safe alongside root cleanup', () => {
    createRoot(dispose => {
      const picker = createDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) });
      picker.dispose();
      picker.dispose();
      dispose(); // runs onCleanup(dispose) again — must not throw
      expect(() => picker.engine.select(createCalendarDate(2025, 4, 20))).not.toThrow();
      expect(picker.state().selection.value).toBeNull();
    });
  });
});
