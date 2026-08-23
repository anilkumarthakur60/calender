export { DatePickerService, DATE_PICKER_OPTIONS } from './date-picker.service.js';
export { provideDatePicker } from './provide-date-picker.js';
export { DatePickerComponent, type DatePickerValue } from './date-picker.component.js';
// Re-export core's full surface so a consumer needs one import. This must
// stay a VALUE re-export: `export type *` is emitted without the `type`
// modifier by the .d.ts rollup, which made the types promise runtime
// bindings the bundle did not actually carry.
export * from '@anil-labs/calendar-core';
