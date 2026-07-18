export { PickerRenderer } from './picker-renderer.js';
export { createPickerElementClass } from './picker-element.js';
export { createInputElementClass } from './input-element.js';
export type { CalenderPickerElement, CalenderPickerElementConstructor } from './picker-element.js';
export type { CalenderInputElement, CalenderInputElementConstructor } from './input-element.js';

import { createPickerElementClass, type CalenderPickerElement } from './picker-element.js';
import { createInputElementClass, type CalenderInputElement } from './input-element.js';

export const defineCalenderPicker = (tagName: string = 'calender-picker'): void => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, createPickerElementClass());
  }
};

export const defineCalenderInput = (tagName: string = 'calender-input'): void => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, createInputElementClass());
  }
};

declare global {
  interface HTMLElementTagNameMap {
    'calender-picker': CalenderPickerElement;
    'calender-input': CalenderInputElement;
  }
}
