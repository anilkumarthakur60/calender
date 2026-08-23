export {
  createDatePicker,
  type CreateDatePickerResult,
  type SvelteStoreLike,
} from './create-date-picker.js';
// Re-export core's full surface so a consumer needs one import. This must
// stay a VALUE re-export: `export type *` is emitted without the `type`
// modifier by the .d.ts rollup, which made the types promise runtime
// bindings the bundle did not actually carry.
export * from '@anil-labs/calendar-core';
