import { DatePickerEngine, type SelectionMode, fromIso } from '@anil-labs/core';
import { PickerRenderer } from './picker-renderer.js';
import {
  COSMETIC_ATTRS,
  readEngineOptionsFromAttributes,
  readPresetsFromAttribute,
  STANDARD_OBSERVED_ATTRS,
} from './attributes.js';

const OBSERVED: ReadonlyArray<string> = STANDARD_OBSERVED_ATTRS;

/**
 * Instance surface of `<calender-picker>` — form-associated custom element.
 * Attributes map to engine options; cosmetic attributes (theme, density)
 * only restyle, engine-shaping attributes reconfigure the live engine in
 * place (preserving the selection), and `value` resets the selection.
 *
 * This is a type-only export: the concrete class is created lazily by
 * {@link createPickerElementClass} so that loading this module never touches
 * `HTMLElement` at module scope (safe to `require`/`import` in plain Node).
 */
export interface CalenderPickerElement extends HTMLElement {
  /** The live engine (null while disconnected). */
  readonly engine: DatePickerEngine | null;
  /** Committed selection in storage form (ISO / ISO-slash-range / CSV). */
  value: string | null;
}

export interface CalenderPickerElementConstructor {
  new (): CalenderPickerElement;
  readonly formAssociated: boolean;
  readonly observedAttributes: ReadonlyArray<string>;
}

let PickerElementClass: CalenderPickerElementConstructor | null = null;

/**
 * Create (and memoize) the `<calender-picker>` element class. Deferred to a
 * factory so SSR frameworks can load the bundle in Node — the class body
 * references `HTMLElement`, which only exists once a DOM is present.
 */
export const createPickerElementClass = (): CalenderPickerElementConstructor => {
  if (PickerElementClass) return PickerElementClass;

  class CalenderPickerElementImpl extends HTMLElement {
    static formAssociated = true;
    static get observedAttributes(): ReadonlyArray<string> {
      return OBSERVED;
    }

    #internals: ElementInternals | null = null;
    #engine: DatePickerEngine | null = null;
    #renderer: PickerRenderer | null = null;
    #connected = false;
    #lastDispatched: string | null = null;

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

    attributeChangedCallback(name: string): void {
      if (!this.#connected) return;
      if (COSMETIC_ATTRS.has(name)) {
        this.#applyCosmetics();
        return;
      }
      if (name === 'presets') {
        if (this.#renderer) {
          this.#renderer.presets = readPresetsFromAttribute(this) ?? ['today'];
          this.#renderer.refresh();
        }
        return;
      }
      if (name === 'value' || !this.#engine) {
        // A value change is an intentional selection reset — full rebuild.
        this.#rebuild();
        return;
      }
      // Engine-shaping attribute: reconfigure the live engine in place so
      // the user's selection survives (pruned only where now invalid).
      this.#engine.setOptions(readEngineOptionsFromAttributes(this));
    }

    get engine(): DatePickerEngine | null {
      return this.#engine;
    }

    get value(): string | null {
      const state = this.#engine?.state;
      if (!state) return null;
      const sel = state.selection;
      if (sel.mode === 'single')
        return sel.value ? `${sel.value.year}-${pad(sel.value.month)}-${pad(sel.value.day)}` : null;
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

      const options = readEngineOptionsFromAttributes(this);
      const mode = (this.getAttribute('mode') as SelectionMode | null) ?? 'single';

      const engine = new DatePickerEngine(options);
      const initial = this.getAttribute('value');
      if (initial) applyInitialValue(engine, initial, mode);

      this.#engine = engine;
      // Seed the dedupe baseline so mounting/rebuilding never fires cal-change.
      this.#lastDispatched = this.value;

      engine.on('select', () => this.#syncForm());
      engine.on('change', () => this.#syncForm());

      this.#renderer = new PickerRenderer(this, engine);
      const presets = readPresetsFromAttribute(this);
      if (presets) this.#renderer.presets = presets;
      this.#renderer.mount();
      this.#syncForm();

      this.#applyCosmetics();
    }

    #applyCosmetics(): void {
      const theme = this.getAttribute('theme');
      this.classList.remove('cal-theme-light', 'cal-theme-dark', 'cal-theme-auto');
      if (theme) this.classList.add(`cal-theme-${theme}`);

      const density = this.getAttribute('density');
      this.classList.remove('cal-density-dense', 'cal-density-comfortable');
      if (density) this.classList.add(`cal-density-${density}`);
    }

    #syncForm(): void {
      const v = this.value;
      if (this.#internals) this.#internals.setFormValue(v ?? '');
      // Dispatch cal-change exactly once per actual value change, whether or
      // not ElementInternals is available.
      if (v === this.#lastDispatched) return;
      this.#lastDispatched = v;
      this.dispatchEvent(
        new CustomEvent('cal-change', {
          detail: { value: v, state: this.#engine?.state },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  PickerElementClass = CalenderPickerElementImpl;
  return PickerElementClass;
};

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
