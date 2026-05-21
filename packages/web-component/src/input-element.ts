import {
  type CalendarId,
  type CalendarSystem,
  DatePickerEngine,
  type FormatPreset,
  type SelectionMode,
  createCalendarSystem,
  formatSelection,
  parseSelection,
} from '@calender/core';
import { PickerRenderer } from './picker-renderer.js';
import {
  readEngineOptionsFromAttributes,
  readPresetsFromAttribute,
  STANDARD_OBSERVED_ATTRS,
} from './attributes.js';

const OBSERVED: ReadonlyArray<string> = [
  ...STANDARD_OBSERVED_ATTRS,
  'placeholder',
  'disabled',
  'format',
  'value-format',
];

const HINT_BY_PATTERN: Record<string, string> = {
  iso: 'YYYY-MM-DD',
  us: 'MM/DD/YYYY',
  eu: 'DD/MM/YYYY',
  medium: 'MMM D, YYYY',
  long: 'MMMM D, YYYY',
  short: 'M/D/YYYY',
};

/**
 * `<calender-input>` — form-associated input that opens a calendar popover.
 * Type into the input or click to pick. Submits as a normal form field.
 */
export class CalenderInputElement extends HTMLElement {
  static formAssociated = true;
  static get observedAttributes(): ReadonlyArray<string> {
    return OBSERVED;
  }

  #internals: ElementInternals | null = null;
  #engine: DatePickerEngine | null = null;
  #renderer: PickerRenderer | null = null;
  #connected = false;
  #open = false;

  #input!: HTMLInputElement;
  #trigger!: HTMLButtonElement;
  #control!: HTMLDivElement;
  #popover!: HTMLDivElement;
  #pickerHost!: HTMLDivElement;
  #hiddenInput!: HTMLInputElement;

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
    this.#renderShell();
    this.#rebuild();
  }

  disconnectedCallback(): void {
    this.#connected = false;
    this.#teardownGlobalHandlers();
    this.#renderer?.unmount();
    this.#renderer = null;
    this.#engine = null;
  }

  attributeChangedCallback(name: string, _old: string | null, _next: string | null): void {
    if (!this.#connected) return;
    if (name === 'value') {
      this.#input.value = this.getAttribute('value') ?? '';
      this.#commitFromText(this.#input.value);
      return;
    }
    if (name === 'placeholder') {
      this.#applyPlaceholder();
      return;
    }
    if (name === 'disabled') {
      this.#applyDisabled();
      return;
    }
    this.#rebuild();
  }

  get value(): string {
    return this.#input?.value ?? '';
  }
  set value(next: string) {
    if (next === null || next === undefined) {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', String(next));
    }
  }

  // --- internals ----------------------------------------------------------

  #renderShell(): void {
    this.classList.add('cal-field-host');

    this.#control = document.createElement('div');
    this.#control.className = 'cal-field__control';

    this.#input = document.createElement('input');
    this.#input.type = 'text';
    this.#input.className = 'cal-field__input';
    this.#input.autocomplete = 'off';
    this.#input.spellcheck = false;
    this.#input.setAttribute('aria-haspopup', 'dialog');
    this.#input.setAttribute('aria-expanded', 'false');

    this.#trigger = document.createElement('button');
    this.#trigger.type = 'button';
    this.#trigger.className = 'cal-field__trigger';
    this.#trigger.setAttribute('aria-label', 'Open calendar');
    this.#trigger.tabIndex = -1;
    this.#trigger.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" stroke="currentColor" stroke-width="1.25"/>
        <path d="M2 6.5h12" stroke="currentColor" stroke-width="1.25"/>
        <path d="M5 2v2.5M11 2v2.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
      </svg>
    `;

    this.#control.append(this.#input, this.#trigger);

    this.#popover = document.createElement('div');
    this.#popover.className = 'cal-field__popover';
    this.#popover.setAttribute('role', 'dialog');
    this.#popover.dataset['flip'] = 'down';
    this.#popover.style.display = 'none';

    this.#pickerHost = document.createElement('div');
    this.#popover.append(this.#pickerHost);

    this.#hiddenInput = document.createElement('input');
    this.#hiddenInput.type = 'hidden';

    this.classList.add('cal-field');
    this.replaceChildren(this.#control, this.#hiddenInput, this.#popover);

    this.#input.addEventListener('focus', () => this.#openPopover());
    this.#input.addEventListener('click', () => this.#openPopover());
    this.#input.addEventListener('input', () => {
      // Text edit; defer commit until blur (lenient parse).
    });
    this.#input.addEventListener('blur', () => this.#handleBlur());
    this.#trigger.addEventListener('mousedown', e => e.preventDefault());
    this.#trigger.addEventListener('click', () => {
      if (this.#open) this.#closePopover();
      else this.#openPopover();
      this.#input.focus();
    });
    this.#popover.addEventListener('mousedown', e => e.preventDefault());

    this.#applyPlaceholder();
    this.#applyDisabled();
  }

  #applyPlaceholder(): void {
    const explicit = this.getAttribute('placeholder');
    const pattern = this.#displayPattern();
    this.#input.placeholder = explicit ?? HINT_BY_PATTERN[pattern] ?? pattern;
  }

  #displayPattern(): string {
    return this.getAttribute('format') ?? 'iso';
  }

  #storagePattern(): string {
    return this.getAttribute('value-format') ?? this.#displayPattern();
  }

  #activeCalendar(): CalendarSystem {
    return createCalendarSystem(
      (this.getAttribute('calendar') as CalendarId | null) ?? 'gregorian',
    );
  }

  #fmtOpts(pattern: string): {
    pattern: string | FormatPreset;
    locale: string;
    calendar: CalendarSystem;
  } {
    return {
      pattern,
      locale: this.getAttribute('locale') ?? 'en-US',
      calendar: this.#activeCalendar(),
    };
  }

  #applyDisabled(): void {
    const disabled = this.hasAttribute('disabled');
    this.#input.disabled = disabled;
    this.#trigger.disabled = disabled;
    if (disabled) this.#control.dataset['disabled'] = 'true';
    else delete this.#control.dataset['disabled'];
  }

  #rebuild(): void {
    this.#renderer?.unmount();
    this.#pickerHost.replaceChildren();

    const mode = (this.getAttribute('mode') as SelectionMode | null) ?? 'single';
    const initial = this.getAttribute('value') ?? '';
    const options = readEngineOptionsFromAttributes(this);
    // The input parses initial via its own format pipeline; pre-seed focus.
    if (initial) {
      const decoded = parseSelection(initial, mode, this.#fmtOpts(this.#storagePattern()));
      const focused = decoded?.single ?? decoded?.range?.start ?? decoded?.multi?.[0];
      if (focused) (options as { initialFocused?: typeof focused }).initialFocused = focused;
    }

    const engine = new DatePickerEngine(options);
    if (initial) this.#applyInitialSelection(engine, initial, mode);

    engine.on('select', () => this.#onPickerChanged());
    engine.on('change', () => this.#onPickerChanged());

    this.#engine = engine;
    // Display the formatted version in the input; storage stays as `initial`.
    this.#input.value = this.#toDisplay(initial, mode);
    this.#syncForm(initial);

    this.#renderer = new PickerRenderer(this.#pickerHost, engine);
    const presets = readPresetsFromAttribute(this);
    if (presets) this.#renderer.presets = presets;
    this.#renderer.mount();
    this.#pickerHost.firstElementChild?.classList.add('cal-picker');

    this.#applyPlaceholder();
    this.#applyDisabled();

    const theme = this.getAttribute('theme');
    this.classList.remove('cal-theme-light', 'cal-theme-dark', 'cal-theme-auto');
    if (theme) this.classList.add(`cal-theme-${theme}`);

    const density = this.getAttribute('density');
    this.classList.remove('cal-density-dense', 'cal-density-comfortable');
    if (density) this.classList.add(`cal-density-${density}`);
  }

  #applyInitialSelection(engine: DatePickerEngine, text: string, mode: SelectionMode): void {
    const decoded = parseSelection(text, mode, this.#fmtOpts(this.#storagePattern()));
    if (!decoded) return;
    try {
      if (decoded.single) engine.select(decoded.single);
      else if (decoded.range) {
        engine.select(decoded.range.start);
        engine.select(decoded.range.end);
      } else if (decoded.multi) {
        for (const d of decoded.multi) engine.select(d);
      }
    } catch {
      /* invalid date for the active calendar — ignore */
    }
  }

  #toDisplay(stored: string, mode: SelectionMode): string {
    if (!stored) return '';
    const decoded = parseSelection(stored, mode, this.#fmtOpts(this.#storagePattern()));
    if (!decoded) return stored;
    const sel =
      mode === 'single'
        ? ({ mode, value: decoded.single ?? null } as const)
        : mode === 'range'
          ? ({ mode, value: decoded.range ?? null, anchor: null } as const)
          : ({ mode, value: decoded.multi ?? [] } as const);
    return formatSelection(sel, this.#fmtOpts(this.#displayPattern()));
  }

  #onPickerChanged(): void {
    if (!this.#engine) return;
    const sel = this.#engine.state.selection;
    const display = formatSelection(sel, this.#fmtOpts(this.#displayPattern()));
    const stored = formatSelection(sel, this.#fmtOpts(this.#storagePattern()));
    const complete =
      (sel.mode === 'single' && sel.value !== null) || (sel.mode === 'range' && sel.value !== null);
    this.#input.value = display;
    this.#commit(stored);
    if (complete) {
      this.#closePopover();
      this.#input.focus();
    }
  }

  #handleBlur(): void {
    const text = this.#input.value;
    const mode = (this.getAttribute('mode') as SelectionMode) ?? 'single';
    const current = this.getAttribute('value') ?? '';
    if (text === this.#toDisplay(current, mode)) return;
    if (text.trim() === '') {
      this.#input.value = '';
      this.#commit('');
      return;
    }
    const decoded =
      parseSelection(text, mode, this.#fmtOpts(this.#displayPattern())) ??
      parseSelection(text, mode, this.#fmtOpts(this.#storagePattern()));
    if (!decoded) {
      this.#input.value = this.#toDisplay(current, mode);
      return;
    }
    const sel =
      mode === 'single'
        ? ({ mode, value: decoded.single ?? null } as const)
        : mode === 'range'
          ? ({ mode, value: decoded.range ?? null, anchor: null } as const)
          : ({ mode, value: decoded.multi ?? [] } as const);
    this.#input.value = formatSelection(sel, this.#fmtOpts(this.#displayPattern()));
    this.#commit(formatSelection(sel, this.#fmtOpts(this.#storagePattern())));
  }

  #commit(next: string): void {
    if (next === (this.getAttribute('value') ?? '')) return;
    if (next) this.setAttribute('value', next);
    else this.removeAttribute('value');
    this.#syncForm(next);
    this.dispatchEvent(new CustomEvent('cal-change', { detail: { value: next } }));
  }

  #commitFromText(text: string): void {
    if (this.#engine)
      this.#applyInitialSelection(
        this.#engine,
        text,
        (this.getAttribute('mode') as SelectionMode) ?? 'single',
      );
    this.#syncForm(text);
  }

  #syncForm(value: string): void {
    this.#hiddenInput.value = value;
    if (this.#internals) this.#internals.setFormValue(value);
  }

  // --- popover ----------------------------------------------------------

  #openPopover(): void {
    if (this.#open || this.#input.disabled) return;
    this.#open = true;
    this.#popover.style.display = '';
    this.#input.setAttribute('aria-expanded', 'true');
    this.#positionPopover();
    this.#installGlobalHandlers();
  }

  #closePopover(): void {
    if (!this.#open) return;
    this.#open = false;
    this.#popover.style.display = 'none';
    this.#input.setAttribute('aria-expanded', 'false');
    this.#teardownGlobalHandlers();
  }

  #positionPopover(): void {
    requestAnimationFrame(() => {
      const r = this.#control.getBoundingClientRect();
      const popH = this.#popover.offsetHeight || 320;
      const flip = r.bottom + popH + 8 > window.innerHeight && r.top - popH - 8 > 0;
      this.#popover.dataset['flip'] = flip ? 'up' : 'down';
    });
  }

  #onDocumentPointer = (event: PointerEvent): void => {
    if (!this.contains(event.target as Node)) this.#closePopover();
  };

  #onDocumentKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.#closePopover();
      this.#input.focus();
    }
  };

  #installGlobalHandlers(): void {
    document.addEventListener('pointerdown', this.#onDocumentPointer);
    document.addEventListener('keydown', this.#onDocumentKey);
  }
  #teardownGlobalHandlers(): void {
    document.removeEventListener('pointerdown', this.#onDocumentPointer);
    document.removeEventListener('keydown', this.#onDocumentKey);
  }
}
