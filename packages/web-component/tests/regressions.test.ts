import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { defineCalenderInput, defineCalenderPicker } from '../src/index.js';
import type { CalenderInputElement, CalenderPickerElement } from '../src/index.js';

beforeAll(() => {
  defineCalenderPicker();
  defineCalenderInput();
});

afterEach(() => {
  document.body.replaceChildren();
});

const mount = (html: string): HTMLElement => {
  document.body.insertAdjacentHTML('beforeend', html);
  return document.body.lastElementChild as HTMLElement;
};

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const dayCell = (root: HTMLElement, iso: string): HTMLButtonElement =>
  root.querySelector<HTMLButtonElement>(`[data-kind="day"][data-date="${iso}"]`)!;

describe('bug #2 — focus stealing on render', () => {
  it('mounting a picker does not move document focus', async () => {
    mount('<calender-picker value="2025-04-15"></calender-picker>');
    await flushMicrotasks();
    expect(document.activeElement).toBe(document.body);
  });

  it('keyboard navigation still refocuses the roving cell', async () => {
    const el = mount('<calender-picker value="2025-04-15"></calender-picker>');
    const cell = el.querySelector<HTMLButtonElement>('.cal-picker__cell[tabindex="0"]')!;
    cell.focus();
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await flushMicrotasks();
    const active = document.activeElement as HTMLElement;
    expect(el.contains(active)).toBe(true);
    expect(active.dataset['date']).toBe('2025-4-16');
  });
});

describe('bug #5 — cal-change contract', () => {
  it('a selection fires exactly one cal-change with the committed value', () => {
    const el = mount('<calender-picker value="2025-04-15"></calender-picker>');
    const events: CustomEvent[] = [];
    el.addEventListener('cal-change', e => events.push(e as CustomEvent));
    dayCell(el, '2025-4-10').click();
    expect(events).toHaveLength(1);
    expect(events[0]?.detail.value).toBe('2025-04-10');
    dayCell(el, '2025-4-20').click();
    expect(events).toHaveLength(2);
    expect(events[1]?.detail.value).toBe('2025-04-20');
  });
});

describe('bug #6 — attribute changes must not wipe the selection', () => {
  it('cosmetic attributes (theme/density) keep the selection', () => {
    const el = mount('<calender-picker></calender-picker>') as CalenderPickerElement;
    // Select a concrete date first.
    const cell = el.querySelector<HTMLButtonElement>(
      '[data-kind="day"]:not([data-disabled]):not([data-outside])',
    )!;
    cell.click();
    const selected = el.value;
    expect(selected).toBeTruthy();
    el.setAttribute('theme', 'dark');
    el.setAttribute('density', 'dense');
    expect(el.classList.contains('cal-theme-dark')).toBe(true);
    expect(el.classList.contains('cal-density-dense')).toBe(true);
    expect(el.value).toBe(selected);
  });

  it('engine-shaping attributes reconfigure in place and keep the selection', () => {
    const el = mount(
      '<calender-picker value="2025-04-15"></calender-picker>',
    ) as CalenderPickerElement;
    expect(el.value).toBe('2025-04-15');
    el.setAttribute('months', '2');
    expect(el.querySelectorAll('.cal-picker__grid').length).toBe(2);
    expect(el.value).toBe('2025-04-15');
  });
});

describe('bug #7 — malformed date attributes must not brick the element', () => {
  it('renders despite min="garbage"', () => {
    const el = mount('<calender-picker min="garbage"></calender-picker>');
    expect(el.querySelectorAll('.cal-picker__cell').length).toBeGreaterThanOrEqual(28);
  });

  it('ignores only the malformed entries of disabled-dates', () => {
    const el = mount(
      '<calender-picker value="2025-04-15" disabled-dates="junk,2025-04-10"></calender-picker>',
    );
    expect(dayCell(el, '2025-4-10').dataset['disabled']).toBe('true');
    expect(dayCell(el, '2025-4-11').dataset['disabled']).toBeUndefined();
  });
});

describe('bug #10 — events bubble out of the element', () => {
  it('cal-select and cal-change reach a document-level listener', () => {
    const el = mount('<calender-picker value="2025-04-15"></calender-picker>');
    const seen: string[] = [];
    const onSelect = (e: Event): void => {
      seen.push(e.type);
    };
    document.addEventListener('cal-select', onSelect);
    document.addEventListener('cal-change', onSelect);
    dayCell(el, '2025-4-10').click();
    document.removeEventListener('cal-select', onSelect);
    document.removeEventListener('cal-change', onSelect);
    expect(seen).toContain('cal-select');
    expect(seen).toContain('cal-change');
  });
});

describe('bug #12 — ARIA grid rows', () => {
  it('gridcells sit inside role="row" containers, not directly under the grid', () => {
    const el = mount('<calender-picker week-numbers value="2025-04-15"></calender-picker>');
    const grid = el.querySelector('.cal-picker__grid')!;
    const children = Array.from(grid.children);
    expect(children.length).toBeGreaterThanOrEqual(5);
    for (const child of children) expect(child.getAttribute('role')).toBe('row');
    const headRow = children[0]!;
    expect(headRow.querySelectorAll('[role="columnheader"]').length).toBe(8); // Wk + 7 days
    expect(grid.querySelector(':scope > [role="gridcell"]')).toBeNull();
  });

  it('week numbers come from the core grid', () => {
    const el = mount('<calender-picker week-numbers value="2025-01-15"></calender-picker>');
    const nums = Array.from(el.querySelectorAll('.cal-picker__weeknum')).map(n =>
      n.textContent?.trim(),
    );
    expect(nums.length).toBeGreaterThanOrEqual(5);
    for (const n of nums) expect(n).toMatch(/^\d+$/);
    // Row containing Jan 6, 2025 (a Monday) must be ISO week 2.
    expect(nums).toContain('2');
  });
});

describe('bug #3 — popover only closes on selection commits', () => {
  const openInput = (
    html: string,
  ): { el: HTMLElement; input: HTMLInputElement; popover: HTMLElement } => {
    const el = mount(html);
    const input = el.querySelector<HTMLInputElement>('.cal-field__input')!;
    input.focus();
    const popover = el.querySelector<HTMLElement>('.cal-field__popover')!;
    expect(popover.style.display).not.toBe('none');
    return { el, input, popover };
  };

  it('paging with an already-complete value keeps the popover open', () => {
    const { el, popover } = openInput('<calender-input value="2025-04-15"></calender-input>');
    el.querySelector<HTMLButtonElement>('.cal-picker__nav[aria-label="Next"]')!.click();
    expect(popover.style.display).not.toBe('none');
  });

  it('picking a date closes the popover', () => {
    const { el, popover } = openInput('<calender-input value="2025-04-15"></calender-input>');
    dayCell(el, '2025-4-10').click();
    expect(popover.style.display).toBe('none');
  });
});

describe('bug #4 — in-progress typing survives engine changes', () => {
  it('paging does not overwrite partially typed text', () => {
    const el = mount('<calender-input></calender-input>');
    const input = el.querySelector<HTMLInputElement>('.cal-field__input')!;
    input.focus();
    input.value = '2025-0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    el.querySelector<HTMLButtonElement>('.cal-picker__nav[aria-label="Next"]')!.click();
    expect(input.value).toBe('2025-0');
  });
});

describe('bug #8 — reconnect resets popover state', () => {
  it('the popover opens again after remove + re-append', () => {
    const el = mount('<calender-input></calender-input>');
    el.querySelector<HTMLInputElement>('.cal-field__input')!.focus();
    expect(el.querySelector<HTMLElement>('.cal-field__popover')!.style.display).not.toBe('none');

    el.remove();
    document.body.append(el);

    const input = el.querySelector<HTMLInputElement>('.cal-field__input')!;
    input.focus();
    expect(el.querySelector<HTMLElement>('.cal-field__popover')!.style.display).not.toBe('none');
  });
});

describe('bug #11 — value is the storage format; displayValue is the text', () => {
  it('round-trips value and exposes the formatted text separately', () => {
    const el = mount(
      '<calender-input format="us" value-format="iso" value="2025-04-15"></calender-input>',
    ) as CalenderInputElement;
    expect(el.value).toBe('2025-04-15');
    expect(el.displayValue).toBe('04/15/2025');
    // eslint-disable-next-line no-self-assign -- verifying the getter/setter round-trip is lossless
    el.value = el.value;
    expect(el.value).toBe('2025-04-15');
    expect(el.displayValue).toBe('04/15/2025');
  });

  it('input cal-change carries the storage value and bubbles', () => {
    const el = mount('<calender-input value="2025-04-15"></calender-input>');
    // Capture target inside the listener: happy-dom nulls it after dispatch.
    const events: Array<{ fromEl: boolean; value: unknown }> = [];
    const listener = (e: Event): void => {
      events.push({ fromEl: e.target === el, value: (e as CustomEvent).detail.value });
    };
    document.addEventListener('cal-change', listener);
    el.querySelector<HTMLInputElement>('.cal-field__input')!.focus();
    dayCell(el, '2025-4-10').click();
    document.removeEventListener('cal-change', listener);
    const commit = events.find(e => e.fromEl);
    expect(commit?.value).toBe('2025-04-10');
  });
});
