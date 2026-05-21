export { PickerRenderer } from './picker-renderer.js';
export { CalenderPickerElement } from './picker-element.js';
export { CalenderInputElement } from './input-element.js';

import { CalenderPickerElement } from './picker-element.js';
import { CalenderInputElement } from './input-element.js';

export const defineCalenderPicker = (tagName: string = 'calender-picker'): void => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, CalenderPickerElement);
  }
};

export const defineCalenderInput = (tagName: string = 'calender-input'): void => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, CalenderInputElement);
  }
};

declare global {
  interface HTMLElementTagNameMap {
    'calender-picker': CalenderPickerElement;
    'calender-input': CalenderInputElement;
  }
}
