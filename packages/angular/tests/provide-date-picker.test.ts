// Enables Angular's JIT compiler so @Injectable metadata resolves without AOT.
import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { Injector, runInInjectionContext, type ValueProvider } from '@angular/core';
import { createCalendarDate } from '@anil-labs/calendar-core';
import { DATE_PICKER_OPTIONS, DatePickerService } from '../src/date-picker.service.js';
import { provideDatePicker } from '../src/provide-date-picker.js';

const createInjector = (providers: Parameters<typeof Injector.create>[0]['providers']) =>
  Injector.create({ providers }) as Injector & { destroy(): void };

describe('provideDatePicker', () => {
  it('provides the options token and the service', () => {
    const options = { mode: 'range' as const };
    const providers = provideDatePicker(options);
    const tokenProvider = providers[0] as ValueProvider;
    expect(tokenProvider.provide).toBe(DATE_PICKER_OPTIONS);
    expect(tokenProvider.useValue).toBe(options);
    expect(providers[1]).toBe(DatePickerService);
  });

  it('yields a service configured with the given options via DI', () => {
    const injector = createInjector([
      ...provideDatePicker({
        mode: 'range',
        initialFocused: createCalendarDate(2025, 4, 15),
      }),
    ]);
    const picker = injector.get(DatePickerService);
    expect(picker.state().mode).toBe('range');
    expect(picker.state().focused).toEqual({ year: 2025, month: 4, day: 15 });
  });

  it('supports initialSelected seeding through options', () => {
    const injector = createInjector([
      ...provideDatePicker({
        initialFocused: createCalendarDate(2025, 4, 15),
        initialSelected: createCalendarDate(2025, 4, 10),
      }),
    ]);
    const picker = injector.get(DatePickerService);
    expect(picker.state().selection).toEqual({
      mode: 'single',
      value: { year: 2025, month: 4, day: 10 },
    });
  });
});

describe('DatePickerService', () => {
  it('falls back to engine defaults when no options token is visible', () => {
    const injector = createInjector([]);
    const picker = runInInjectionContext(injector, () => new DatePickerService());
    expect(picker.state().mode).toBe('single');
  });

  it('mirrors engine changes into the state signal', () => {
    const injector = createInjector([
      ...provideDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) }),
    ]);
    const picker = injector.get(DatePickerService);
    picker.engine.select(createCalendarDate(2025, 4, 20));
    expect(picker.state().selection.value).toEqual({ year: 2025, month: 4, day: 20 });
  });

  it('applies live reconfiguration through engine.setOptions', () => {
    const injector = createInjector([
      ...provideDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) }),
    ]);
    const picker = injector.get(DatePickerService);
    picker.engine.select(createCalendarDate(2025, 4, 20));
    picker.engine.setOptions({ min: createCalendarDate(2025, 4, 18) });
    // Selection survives (still >= min); focus is preserved but clamped.
    expect(picker.state().selection.value).toEqual({ year: 2025, month: 4, day: 20 });
    expect(picker.engine.isDisabled(createCalendarDate(2025, 4, 10))).toBe(true);
  });

  it('unsubscribes from the engine when its injector is destroyed', () => {
    const injector = createInjector([
      ...provideDatePicker({ initialFocused: createCalendarDate(2025, 4, 15) }),
    ]);
    const picker = injector.get(DatePickerService);
    injector.destroy();
    picker.engine.select(createCalendarDate(2025, 4, 20));
    expect(picker.state().selection.value).toBeNull();
    expect(picker.engine.state.selection.value).toEqual({ year: 2025, month: 4, day: 20 });
  });
});
