import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { defineCalenderInput, defineCalenderPicker } from '../src/index.js';

beforeAll(() => {
  defineCalenderPicker();
  defineCalenderInput();
});

afterEach(() => {
  document.body.replaceChildren();
});

const mount = (html: string): HTMLElement => {
  document.body.insertAdjacentHTML('beforeend', html);
  return document.body.firstElementChild as HTMLElement;
};

describe('<calender-picker>', () => {
  it('upgrades to a custom element with the picker shell', () => {
    const el = mount('<calender-picker></calender-picker>');
    expect(el.classList.contains('cal-picker')).toBe(true);
    expect(el.querySelector('.cal-picker__header')).toBeTruthy();
    expect(el.querySelector('.cal-picker__grid')).toBeTruthy();
  });

  it('renders the focused month in the grid', () => {
    const el = mount('<calender-picker value="2025-04-15"></calender-picker>');
    // Some cells exist
    expect(el.querySelectorAll('.cal-picker__cell').length).toBeGreaterThanOrEqual(28);
  });

  it('dispatches cal-select on click', () => {
    const el = mount('<calender-picker value="2025-04-15"></calender-picker>');
    let detail: unknown = null;
    el.addEventListener('cal-select', e => {
      detail = (e as CustomEvent).detail;
    });
    const cell = el.querySelector<HTMLButtonElement>('.cal-picker__cell:not([data-disabled])');
    cell?.click();
    expect(detail).toBeTruthy();
  });

  it('shows the Today preset by default', () => {
    const el = mount('<calender-picker></calender-picker>');
    const preset = el.querySelector('.cal-picker__preset');
    expect(preset?.textContent?.trim()).toBe('Today');
  });

  it('renders the header dropdowns when header-selectors is set', () => {
    const el = mount('<calender-picker header-selectors year-range="2020-2030"></calender-picker>');
    const selects = el.querySelectorAll('.cal-picker__select');
    expect(selects.length).toBe(2);
  });

  it('renders multi-month layout when months > 1', () => {
    const el = mount('<calender-picker months="2"></calender-picker>');
    const grids = el.querySelectorAll('.cal-picker__grid');
    expect(grids.length).toBe(2);
  });
});

describe('<calender-input>', () => {
  it('renders an input + trigger + popover (initially hidden)', () => {
    const el = mount('<calender-input value="2025-04-15"></calender-input>');
    expect(el.querySelector('.cal-field__input')).toBeTruthy();
    expect(el.querySelector('.cal-field__trigger')).toBeTruthy();
    const popover = el.querySelector<HTMLElement>('.cal-field__popover');
    expect(popover?.style.display).toBe('none');
  });

  it('emits a hidden input that carries the form value', () => {
    const el = mount('<calender-input name="dob" value="2025-04-15"></calender-input>');
    const hidden = el.querySelector<HTMLInputElement>('input[type="hidden"]');
    expect(hidden).toBeTruthy();
    expect(hidden?.value).toBe('2025-04-15');
    expect(hidden?.name).toBe('dob');
  });

  it('opens the popover on input focus', () => {
    const el = mount('<calender-input></calender-input>');
    const input = el.querySelector<HTMLInputElement>('.cal-field__input')!;
    input.focus();
    const popover = el.querySelector<HTMLElement>('.cal-field__popover');
    expect(popover?.style.display).not.toBe('none');
  });
});
