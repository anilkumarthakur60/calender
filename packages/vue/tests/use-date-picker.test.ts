import { describe, expect, it } from 'vitest';
import { effectScope } from 'vue';
import { createCalendarDate } from '@anil-labs/core';
import { useDatePicker } from '../src/use-date-picker.js';

describe('useDatePicker', () => {
  it('returns an engine, reactive state and an explicit dispose', () => {
    const scope = effectScope();
    const result = scope.run(() =>
      useDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) }),
    );
    expect(result).toBeDefined();
    const { engine, state, dispose } = result!;
    expect(engine).toBeTruthy();
    expect(state.value.focused).toEqual({ year: 2025, month: 4, day: 15 });
    expect(typeof dispose).toBe('function');
    scope.stop();
  });

  it('cleans up via onScopeDispose (no leak when scope stops)', () => {
    const scope = effectScope();
    const { engine, state } = scope.run(() => useDatePicker())!;
    scope.stop(); // triggers onScopeDispose -> unsubscribe
    engine.select(engine.today());
    // The subscription is detached, so the ref no longer tracks engine commits.
    expect(state.value.selection).toEqual(expect.objectContaining({ mode: 'single', value: null }));
  });

  it('does not throw when used outside any effect scope', () => {
    expect(() => {
      const { dispose } = useDatePicker();
      dispose();
    }).not.toThrow();
  });

  it('explicit dispose is idempotent', () => {
    const { dispose } = useDatePicker();
    dispose();
    expect(() => dispose()).not.toThrow();
  });
});
