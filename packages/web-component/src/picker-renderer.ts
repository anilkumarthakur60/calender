import {
  type CalendarDate,
  type DatePickerEngine,
  type DatePreset,
  type EngineState,
  type MonthGridCell,
  type PeriodCell,
  type PresetSpec,
  type Unsubscribe,
  buildMonthGrid,
  buildPeriodGrid,
  createRange,
  isInRange,
  isSameDay,
  isoWeekOfYear,
  resolvePresets,
} from '@calender/core';

export class PickerRenderer {
  readonly #host: HTMLElement;
  readonly #engine: DatePickerEngine;
  readonly #unsubs: Unsubscribe[] = [];
  hideFooter = false;
  presets: ReadonlyArray<PresetSpec> = ['today'];

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
    this.#host.addEventListener('mouseover', this.#onHover);
    this.#host.addEventListener('mouseleave', this.#onHoverLeave);
    this.#host.addEventListener('wheel', this.#onWheel, { passive: false });
  }

  unmount(): void {
    this.#host.removeEventListener('keydown', this.#onKey);
    this.#host.removeEventListener('click', this.#onClick);
    this.#host.removeEventListener('mouseover', this.#onHover);
    this.#host.removeEventListener('mouseleave', this.#onHoverLeave);
    this.#host.removeEventListener('wheel', this.#onWheel);
    for (const u of this.#unsubs) u();
    this.#unsubs.length = 0;
    this.#host.replaceChildren();
  }

  // Throttled wheel handler — page month on each gesture, then ignore for 150ms.
  #wheelLockUntil = 0;
  #onWheel = (event: WheelEvent): void => {
    const target = event.target as HTMLElement | null;
    // Only act when the wheel happens on the grid (not the title/header/time row).
    if (!target?.closest('.cal-picker__grid')) return;
    const now = Date.now();
    if (now < this.#wheelLockUntil) {
      event.preventDefault();
      return;
    }
    if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
    event.preventDefault();
    this.#wheelLockUntil = now + 150;
    if (event.deltaY > 0 || event.deltaX > 0) this.#engine.pageNext();
    else this.#engine.pagePrev();
  };

  #render(): void {
    const state = this.#engine.state;
    this.#host.dataset['view'] = state.view;
    this.#host.dataset['mode'] = state.mode;

    const header = this.#renderHeader(state);
    const body = state.view === 'day' ? this.#renderMonths(state) : this.#renderPeriodGrid(state);
    const children: Node[] = [header, body];
    if (this.#engine.withTime) children.push(this.#renderTime(state));
    if (!this.hideFooter) children.push(this.#renderFooter());
    this.#host.replaceChildren(...children);
  }

  #renderHeader(state: EngineState): HTMLElement {
    const header = el('div', 'cal-picker__header');
    if (this.#engine.headerSelectors && state.view === 'day') {
      header.append(
        navButton('prev', '‹', () => this.#engine.pagePrev()),
        this.#renderHeaderSelectors(state),
        navButton('next', '›', () => this.#engine.pageNext()),
      );
      return header;
    }
    const title = this.#titleForView(state);
    const terminal = state.view === 'decade';
    header.append(
      navButton('prev', '‹', () => this.#engine.pagePrev()),
      titleButton(title, () => this.#engine.drillUp(), terminal),
      navButton('next', '›', () => this.#engine.pageNext()),
    );
    return header;
  }

  #renderHeaderSelectors(state: EngineState): HTMLElement {
    const wrap = el('div', 'cal-picker__selectors');
    const cal = this.#engine.calendar;
    const locale = this.#engine.locale.locale;

    const monthSelect = el('select', 'cal-picker__select');
    monthSelect.setAttribute('aria-label', 'Month');
    for (let m = 1; m <= cal.monthsInYear; m += 1) {
      const opt = el('option');
      opt.value = String(m);
      opt.textContent = cal.monthName(m, 'long', locale);
      if (m === state.focused.month) opt.selected = true;
      monthSelect.append(opt);
    }
    monthSelect.addEventListener('change', () => {
      this.#engine.setMonth(Number(monthSelect.value));
    });

    const yearSelect = el('select', 'cal-picker__select');
    yearSelect.setAttribute('aria-label', 'Year');
    const [start, end] = this.#engine.yearRange();
    for (let y = start; y <= end; y += 1) {
      const opt = el('option');
      opt.value = String(y);
      opt.textContent = cal.formatDay(y, locale);
      if (y === state.focused.year) opt.selected = true;
      yearSelect.append(opt);
    }
    yearSelect.addEventListener('change', () => {
      this.#engine.setYear(Number(yearSelect.value));
    });

    wrap.append(monthSelect, yearSelect);
    return wrap;
  }

  #titleForView(state: EngineState): string {
    if (state.view === 'day') {
      if (this.#engine.months <= 1) return this.#engine.formatter.formatMonthYear(state.focused);
      const last = this.#engine.calendar.addMonths(state.focused, this.#engine.months - 1);
      return `${this.#engine.formatter.formatMonthYear(state.focused)} — ${this.#engine.formatter.formatMonthYear(last)}`;
    }
    return buildPeriodGrid(
      state.focused,
      state.view,
      this.#engine.calendar,
      this.#engine.locale.locale,
    ).title;
  }

  #renderMonths(state: EngineState): HTMLElement {
    const wrap = el('div', 'cal-picker__months');
    const months = Math.max(1, this.#engine.months);
    for (let i = 0; i < months; i += 1) {
      const focused = i === 0 ? state.focused : this.#engine.calendar.addMonths(state.focused, i);
      wrap.append(this.#renderDayGrid(focused, state));
    }
    return wrap;
  }

  #renderDayGrid(focusedMonth: CalendarDate, state: EngineState): HTMLElement {
    const fmt = this.#engine.formatter;
    const useWeeks = this.#engine.weekNumbers;
    const grid = el('div', `cal-picker__grid${useWeeks ? ' cal-picker__grid--with-weeks' : ''}`);
    grid.setAttribute('role', 'grid');

    if (useWeeks) {
      const h = el('div', 'cal-picker__weeknum-header');
      h.textContent = 'Wk';
      grid.append(h);
    }
    for (const w of state.grid.weekdayHeaders) {
      const h = el('div', 'cal-picker__weekday');
      h.textContent = fmt.formatWeekday(w, 'short');
      h.setAttribute('role', 'columnheader');
      grid.append(h);
    }

    const sameMonth =
      focusedMonth.year === state.focused.year && focusedMonth.month === state.focused.month;
    const monthGrid = sameMonth
      ? state.grid
      : buildMonthGrid(focusedMonth, {
          firstDayOfWeek: this.#engine.locale.firstDayOfWeek,
          fixedWeeks: true,
          calendar: this.#engine.calendar,
        });

    for (const week of monthGrid.weeks) {
      if (useWeeks && week[0]) {
        const wn = el('div', 'cal-picker__weeknum');
        wn.textContent = String(isoWeekOfYear(week[0].date));
        grid.append(wn);
      }
      for (const cell of week) grid.append(this.#renderDayCell(cell, state, focusedMonth));
    }
    return grid;
  }

  #renderPeriodGrid(state: EngineState): HTMLElement {
    const grid = el('div', 'cal-picker__grid cal-picker__grid--period');
    grid.setAttribute('role', 'grid');
    const period = buildPeriodGrid(
      state.focused,
      state.view as 'month' | 'year' | 'decade',
      this.#engine.calendar,
      this.#engine.locale.locale,
    );
    for (const cell of period.cells) grid.append(this.#renderPeriodCell(cell));
    return grid;
  }

  #renderDayCell(cell: MonthGridCell, state: EngineState, focusedMonth: CalendarDate): HTMLElement {
    const btn = el('button', 'cal-picker__cell');
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.textContent = this.#engine.formatter.formatDay(cell.date);
    btn.dataset['date'] = serializeDate(cell.date);
    btn.dataset['kind'] = 'day';
    const inThisMonth =
      cell.date.year === focusedMonth.year && cell.date.month === focusedMonth.month;
    if (!inThisMonth) btn.dataset['outside'] = 'true';
    if (cell.isToday) btn.dataset['today'] = 'true';
    if (cell.isWeekend) btn.dataset['weekend'] = 'true';

    if (!this.#engine.isPickable(cell.date)) {
      btn.dataset['disabled'] = 'true';
      btn.setAttribute('aria-disabled', 'true');
    }

    if (this.#engine.isSelected(cell.date)) {
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

    if (
      state.selection.mode === 'range' &&
      state.selection.anchor !== null &&
      state.selection.value === null &&
      state.hovered !== null
    ) {
      const preview = createRange(state.selection.anchor, state.hovered);
      if (isSameDay(cell.date, preview.start)) btn.dataset['rangePreviewStart'] = 'true';
      if (isSameDay(cell.date, preview.end)) btn.dataset['rangePreviewEnd'] = 'true';
      if (
        isInRange(cell.date, preview, true) &&
        !isSameDay(cell.date, preview.start) &&
        !isSameDay(cell.date, preview.end)
      ) {
        btn.dataset['rangePreviewMid'] = 'true';
      }
    }

    const highlight = this.#engine.getHighlight(cell.date);
    if (highlight) {
      btn.dataset['highlight'] = 'true';
      if (highlight.color) btn.style.setProperty('--cal-highlight-color', highlight.color);
    }

    const focused = isSameDay(cell.date, state.focused);
    btn.tabIndex = focused ? 0 : -1;
    if (focused) queueMicrotask(() => btn.focus({ preventScroll: true }));
    let label = this.#engine.formatter.formatFull(cell.date);
    if (highlight?.label) label += ` — ${highlight.label}`;
    btn.setAttribute('aria-label', label);
    return btn;
  }

  #renderPeriodCell(cell: PeriodCell): HTMLElement {
    const btn = el('button', 'cal-picker__cell cal-picker__cell--period');
    btn.type = 'button';
    btn.setAttribute('role', 'gridcell');
    btn.textContent = cell.label;
    btn.dataset['date'] = serializeDate(cell.date);
    btn.dataset['kind'] = 'period';
    if (cell.isFocused) btn.dataset['selected'] = 'true';
    if (cell.isToday) btn.dataset['today'] = 'true';
    if (cell.outside) btn.dataset['outside'] = 'true';
    btn.setAttribute('aria-label', cell.longLabel);
    btn.tabIndex = cell.isFocused ? 0 : -1;
    return btn;
  }

  #renderTime(state: EngineState): HTMLElement {
    const wrap = el('div', 'cal-picker__time');
    const label = el('span', 'cal-picker__time-label');
    label.textContent = 'Time';
    wrap.append(label);

    const t = state.time ?? { hour: 0, minute: 0, second: 0 };
    const hour12 = this.#engine.use12HourClock;
    const showSeconds = this.#engine.showSeconds;
    const step = Math.max(1, this.#engine.timeStep);

    const displayHour = hour12 ? ((t.hour + 11) % 12) + 1 : t.hour;
    const hourField = makeNumField(displayHour, hour12 ? 1 : 0, hour12 ? 12 : 23, 1, v => {
      const h = hour12 ? to24Hour(v, t.hour >= 12) : v;
      this.#engine.setTime({ ...t, hour: h });
    });
    const minField = makeNumField(t.minute, 0, 59, step, v => {
      this.#engine.setTime({ ...t, minute: v });
    });

    wrap.append(hourField, separatorSpan(':'), minField);
    if (showSeconds) {
      const sField = makeNumField(t.second, 0, 59, 1, v => {
        this.#engine.setTime({ ...t, second: v });
      });
      wrap.append(separatorSpan(':'), sField);
    }
    if (hour12) {
      const period = el('button', 'cal-picker__time-period');
      period.type = 'button';
      period.textContent = t.hour >= 12 ? 'PM' : 'AM';
      period.addEventListener('click', () => {
        this.#engine.setTime({ ...t, hour: (t.hour + 12) % 24 });
      });
      wrap.append(period);
    }
    return wrap;
  }

  #renderFooter(): HTMLElement {
    const footer = el('div', 'cal-picker__footer');
    const wrap = el('div', 'cal-picker__presets');
    const presets: ReadonlyArray<DatePreset> = resolvePresets(this.presets);
    for (const preset of presets) {
      const btn = el('button', 'cal-picker__preset');
      btn.type = 'button';
      btn.textContent = preset.label;
      btn.addEventListener('click', () => preset.apply(this.#engine));
      wrap.append(btn);
    }
    footer.append(wrap);
    return footer;
  }

  #onClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const dateEl = target?.closest<HTMLElement>('[data-date]');
    if (!dateEl || !this.#host.contains(dateEl)) return;
    const date = parseDataset(dateEl.dataset['date']);
    if (!date) return;
    const kind = dateEl.dataset['kind'];
    if (kind === 'period') this.#engine.pickInView(date);
    else this.#engine.select(date);
    this.#host.dispatchEvent(new CustomEvent('cal-select', { detail: { date } }));
  };

  #onHover = (event: Event): void => {
    const sel = this.#engine.state.selection;
    if (sel.mode !== 'range' || sel.anchor === null || sel.value !== null) return;
    const target = event.target as HTMLElement | null;
    const dateEl = target?.closest<HTMLElement>('[data-date][data-kind="day"]');
    if (!dateEl) return;
    const date = parseDataset(dateEl.dataset['date']);
    if (!date) return;
    this.#engine.setHovered(date);
  };

  #onHoverLeave = (): void => {
    this.#engine.setHovered(null);
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

const titleButton = (label: string, onClick: () => void, disabled: boolean): HTMLButtonElement => {
  const b = el('button', 'cal-picker__title');
  b.type = 'button';
  b.textContent = label;
  if (disabled) b.disabled = true;
  else b.addEventListener('click', onClick);
  return b;
};

const serializeDate = (d: CalendarDate): string => `${d.year}-${d.month}-${d.day}`;

const parseDataset = (value: string | undefined): CalendarDate | null => {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => !Number.isInteger(n))) return null;
  return { year: parts[0] as number, month: parts[1] as number, day: parts[2] as number };
};

const makeNumField = (
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (v: number) => void,
): HTMLInputElement => {
  const input = el('input', 'cal-picker__time-field');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value).padStart(2, '0');
  input.addEventListener('change', () => {
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(max, Math.max(min, Math.round(n / step) * step));
    onChange(clamped);
  });
  return input;
};

const separatorSpan = (text: string): HTMLSpanElement => {
  const s = el('span', 'cal-picker__time-sep');
  s.textContent = text;
  return s;
};

const to24Hour = (displayHour: number, isPm: boolean): number => {
  const h12 = displayHour % 12;
  return isPm ? h12 + 12 : h12;
};
