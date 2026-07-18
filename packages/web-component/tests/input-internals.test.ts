import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { defineCalenderInput, defineCalenderPicker } from '../src/index.js';

// Bug #9 regression: with ElementInternals available the form value must go
// through setFormValue ONLY — no duplicate hidden input. happy-dom has no
// attachInternals, so fake one before the elements are defined.
const formValues: string[] = [];

beforeAll(() => {
  (HTMLElement.prototype as unknown as { attachInternals: () => unknown }).attachInternals =
    function attachInternals(): unknown {
      return {
        setFormValue: (value: string): void => {
          formValues.push(value);
        },
      };
    };
  defineCalenderPicker();
  defineCalenderInput();
});

afterEach(() => {
  document.body.replaceChildren();
  formValues.length = 0;
});

const mount = (html: string): HTMLElement => {
  document.body.insertAdjacentHTML('beforeend', html);
  return document.body.lastElementChild as HTMLElement;
};

describe('<calender-input> with ElementInternals', () => {
  it('does not create a hidden input when internals exist', () => {
    const el = mount('<calender-input name="dob" value="2025-04-15"></calender-input>');
    expect(el.querySelector('input[type="hidden"]')).toBeNull();
    expect(formValues).toContain('2025-04-15');
  });

  it('selection commits go through setFormValue exactly', () => {
    const el = mount('<calender-input value="2025-04-15"></calender-input>');
    formValues.length = 0;
    el.querySelector<HTMLButtonElement>('[data-kind="day"][data-date="2025-4-10"]')!.click();
    expect(formValues).toContain('2025-04-10');
    expect(el.querySelector('input[type="hidden"]')).toBeNull();
  });
});

describe('<calender-picker> with ElementInternals', () => {
  it('still fires exactly one cal-change per committed change', () => {
    const el = mount('<calender-picker value="2025-04-15"></calender-picker>');
    const events: CustomEvent[] = [];
    el.addEventListener('cal-change', e => events.push(e as CustomEvent));
    el.querySelector<HTMLButtonElement>('[data-kind="day"][data-date="2025-4-10"]')!.click();
    expect(events).toHaveLength(1);
    expect(events[0]?.detail.value).toBe('2025-04-10');
    expect(formValues).toContain('2025-04-10');
  });
});
