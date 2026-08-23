import type { Provider } from '@angular/core';
import type { DatePickerEngineOptions } from '@anil-labs/calendar-core';
import { DATE_PICKER_OPTIONS, DatePickerService } from './date-picker.service.js';

/**
 * Provide a configured `DatePickerService` for a component subtree:
 *
 * ```ts
 * @Component({
 *   // ...
 *   providers: [provideDatePicker({ mode: 'range', locale: 'en-GB' })],
 * })
 * ```
 *
 * Also usable in route/application providers. `DatePickerComponent` picks up
 * the provided service automatically; without one it creates its own with
 * whatever `DATE_PICKER_OPTIONS` is visible (or engine defaults).
 */
export const provideDatePicker = (options: DatePickerEngineOptions = {}): Provider[] => [
  { provide: DATE_PICKER_OPTIONS, useValue: options },
  DatePickerService,
];
