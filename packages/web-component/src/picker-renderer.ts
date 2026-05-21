import {
  type CalendarDate,
  type DatePickerEngine,
  type EngineState,
  type MonthGridCell,
  type Unsubscribe,
  isSameDay,
  isInRange,
} from '@calender/core';

/**
 * Pure DOM renderer. Owns no engine state — re-renders whenever the engine
 * commits a new {@link EngineState}. Diffing strategy: replace innerHTML, then
 * restore roving-tabindex focus. Calendar grids are small (≤42 cells) so this
 * is cheap and avoids a virtual-DOM dependency.
 */
export class PickerRenderer {
  readonly #host: HTMLElement;
  readonly #engine: DatePickerEngine;
  readonly #unsubs: Unsubscribe[] = [];

  constructor(host: HTMLElement, engine: DatePickerEngine) {
    this.#host = host;
    this.#engine = engine;
  }

  mount(): void {
    this.#unsubs.push(this.#engine.on('change', () => this.#render()));
    this.#host.classList.add('cal-picker');
    this.#host.setAttribute('role', 'group');
    this.#host.setAttribute('aria-label', 'Date picker');
    this.#host.dir = this.#engine.locale.direction;
    this.#render();
    this.#host.addEventListener('keydown', this.#onKey);
    this.#host.addEventListener('click', this.#onClick);
  }

  unmount(): void {
    this.#host.removeEventListener('keydown', this.#onKey);
    this.#host.removeEventListener('click', this.#onClick);
    for (const u of this.#unsubs) u();
    this.#unsubs.length = 0;
    this.#host.replaceChildren();
  }

  #render(): void {
    const state = this.#engine.state;
    const fmt = this.#engine.formatter;

    this.#host.dataset['view'] = state.view;
    this.#host.dataset['mode'] = state.mode;

    const header = el('div', 'cal-picker__header');
    header.append(
      navButton('prev', '‹', () => this.#engine.pagePrev()),
      titleButton(fmt.formatMonthYear(state.focused), () => this.#engine.drillUp()),
      navButton('next', '›', () => this.#engine.pageNext()),
    );

    const grid = el('div', 'cal-picker__grid');
    grid.setAttribute('role', 'grid');

    for (const w of state.grid.weekdayHeaders) {
      const h = el('div', 'cal-picker__weekday');
      h.textContent = fmt.formatWeekday(w, 'short');
      h.setAttribute('role', 'columnheader');
      grid.append(h);
    }

    for (const week of state.grid.weeks) {
      for (const cell of week) {
        grid.append(this.#renderCell(cell, state));
      }
    }

    this.#host.replaceChildren(header, grid);
  }

  #renderCell(cell: MonthGridCell, state: EngineState): HTMLElement {
    const btn = el('button', 'cal-picker__cell');
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.textContent = this.#engine.formatter.formatDay(cell.date);
    btn.dataset['date'] = `${cell.date.year}-${cell.date.month}-${cell.date.day}`;
    btn.dataset['outside'] = String(!cell.inCurrentMonth);
    btn.dataset['today'] = String(cell.isToday);
    btn.dataset['weekend'] = String(cell.isWeekend);

    const disabled = this.#engine.isDisabled(cell.date);
    if (disabled) {
      btn.dataset['disabled'] = 'true';
      btn.setAttribute('aria-disabled', 'true');
    }

    const selected = this.#engine.isSelected(cell.date);
    if (selected) {
      btn.dataset['selected'] = 'true';
      btn.setAttribute('aria-selected', 'true');
    }

    if (state.selection.mode === 'range' && state.selection.value) {
      if (isSameDay(cell.date, state.selection.value.start)) btn.dataset['rangeStart'] = 'true';
      if (isSameDay(cell.date, state.selection.value.end)) btn.dataset['rangeEnd'] = 'true';
      if (
        isInRange(cell.date, state.selection.value, true) &&
        !isSameDay(cell.date, state.selection.value.start) &&
        !isSameDay(cell.date, state.selection.value.end)
      ) {
        btn.dataset['rangeMid'] = 'true';
      }
    }

    const focused = isSameDay(cell.date, state.focused);
    btn.tabIndex = focused ? 0 : -1;
    if (focused) queueMicrotask(() => btn.focus({ preventScroll: true }));
    btn.setAttribute('aria-label', this.#engine.formatter.formatFull(cell.date));

    return btn;
  }

  #onClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const dateEl = target?.closest<HTMLElement>('[data-date]');
    if (!dateEl || !this.#host.contains(dateEl)) return;
    const date = parseDataset(dateEl.dataset['date']);
    if (!date) return;
    this.#engine.select(date);
    this.#host.dispatchEvent(new CustomEvent('cal-select', { detail: { date } }));
  };

  #onKey = (event: KeyboardEvent): void => {
    const action = this.#engine.handleKey(event);
    if (action) event.preventDefault();
  };
}

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
};

const navButton = (
  kind: 'prev' | 'next',
  label: string,
  onClick: () => void,
): HTMLButtonElement => {
  const b = el('button', 'cal-picker__nav');
  b.type = 'button';
  b.textContent = label;
  b.setAttribute('aria-label', kind === 'prev' ? 'Previous' : 'Next');
  b.addEventListener('click', onClick);
  return b;
};

const titleButton = (label: string, onClick: () => void): HTMLButtonElement => {
  const b = el('button', 'cal-picker__title');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
};

const parseDataset = (value: string | undefined): CalendarDate | null => {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => !Number.isInteger(n))) return null;
  return { year: parts[0] as number, month: parts[1] as number, day: parts[2] as number };
};
