import {
  DatePickerEngine,
  type DatePickerEngineOptions,
  type SelectionMode,
  fromIso,
} from '@calender/core';
import { PickerRenderer } from './picker-renderer.js';

const OBSERVED: ReadonlyArray<string> = [
  'mode',
  'min',
  'max',
  'value',
  'locale',
  'disabled-weekdays',
  'theme',
  'density',
];

/**
 * `<calender-picker>` — form-associated custom element. Attributes map to
 * engine options; the element re-builds its engine when attributes change.
 *
 * Properties for richer types (Date objects, arrays) are also supported.
 */
export class CalenderPickerElement extends HTMLElement {
  static formAssociated = true;
  static get observedAttributes(): ReadonlyArray<string> {
    return OBSERVED;
  }

  #internals: ElementInternals | null = null;
  #engine: DatePickerEngine | null = null;
  #renderer: PickerRenderer | null = null;
  #connected = false;

  constructor() {
    super();
    if (typeof this.attachInternals === 'function') {
      try {
        this.#internals = this.attachInternals();
      } catch {
        this.#internals = null;
      }
    }
  }

  connectedCallback(): void {
    this.#connected = true;
    this.#rebuild();
  }

  disconnectedCallback(): void {
    this.#connected = false;
    this.#renderer?.unmount();
    this.#renderer = null;
    this.#engine = null;
  }

  attributeChangedCallback(): void {
    if (this.#connected) this.#rebuild();
  }

  get engine(): DatePickerEngine | null {
    return this.#engine;
  }

  get value(): string | null {
    const state = this.#engine?.state;
    if (!state) return null;
    const sel = state.selection;
    if (sel.mode === 'single') return sel.value ? `${sel.value.year}-${pad(sel.value.month)}-${pad(sel.value.day)}` : null;
    if (sel.mode === 'range' && sel.value) {
      return `${iso(sel.value.start)}/${iso(sel.value.end)}`;
    }
    if (sel.mode === 'multi') {
      return sel.value.map(iso).join(',');
    }
    return null;
  }

  set value(next: string | null) {
    if (next === null) {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', next);
    }
  }

  #rebuild(): void {
    this.#renderer?.unmount();

    const mode = (this.getAttribute('mode') as SelectionMode | null) ?? undefined;
    const minAttr = this.getAttribute('min');
    const maxAttr = this.getAttribute('max');
    const localeAttr = this.getAttribute('locale');
    const dwAttr = this.getAttribute('disabled-weekdays');

    const options: DatePickerEngineOptions = {
      ...(mode ? { mode } : {}),
      ...(minAttr ? { min: fromIso(minAttr) } : {}),
      ...(maxAttr ? { max: fromIso(maxAttr) } : {}),
      ...(localeAttr ? { locale: localeAttr } : {}),
      ...(dwAttr
        ? { disabledWeekdays: dwAttr.split(',').map(s => Number(s.trim())).filter(Number.isFinite) }
        : {}),
    };

    const engine = new DatePickerEngine(options);
    const initial = this.getAttribute('value');
    if (initial) applyInitialValue(engine, initial, mode ?? 'single');

    engine.on('select', () => this.#syncForm());
    engine.on('change', () => this.#syncForm());

    this.#engine = engine;
    this.#renderer = new PickerRenderer(this, engine);
    this.#renderer.mount();
    this.#syncForm();

    const theme = this.getAttribute('theme');
    this.classList.remove('cal-theme-light', 'cal-theme-dark', 'cal-theme-auto');
    if (theme) this.classList.add(`cal-theme-${theme}`);

    const density = this.getAttribute('density');
    this.classList.remove('cal-density-dense', 'cal-density-comfortable');
    if (density) this.classList.add(`cal-density-${density}`);
  }

  #syncForm(): void {
    if (!this.#internals) return;
    const v = this.value;
    this.#internals.setFormValue(v ?? '');
    this.dispatchEvent(new CustomEvent('cal-change', { detail: { value: v, state: this.#engine?.state } }));
  }
}

const pad = (n: number): string => String(n).padStart(2, '0');
const iso = (d: { year: number; month: number; day: number }): string =>
  `${d.year}-${pad(d.month)}-${pad(d.day)}`;

const applyInitialValue = (
  engine: DatePickerEngine,
  initial: string,
  mode: SelectionMode,
): void => {
  try {
    if (mode === 'single') {
      engine.select(fromIso(initial));
    } else if (mode === 'range') {
      const [start, end] = initial.split('/');
      if (start) engine.select(fromIso(start));
      if (end) engine.select(fromIso(end));
    } else if (mode === 'multi') {
      for (const part of initial.split(',')) {
        if (part) engine.select(fromIso(part.trim()));
      }
    }
  } catch {
    /* ignore malformed initial */
  }
};
