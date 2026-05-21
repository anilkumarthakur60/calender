export { PickerRenderer } from './picker-renderer.js';
export { CalenderPickerElement } from './picker-element.js';

import { CalenderPickerElement } from './picker-element.js';

export const defineCalenderPicker = (tagName: string = 'calender-picker'): void => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, CalenderPickerElement);
  }
};

declare global {
  interface HTMLElementTagNameMap {
    'calender-picker': CalenderPickerElement;
  }
}
