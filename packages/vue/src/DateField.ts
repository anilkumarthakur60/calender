import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
  type PropType,
} from 'vue';
import {
  type CalendarDate,
  type CalendarId,
  type CalendarSystem,
  type DateConstraint,
  type DatePickerEngineOptions,
  type DecodedSelection,
  type EngineState,
  type FocusTrap,
  type FormatPreset,
  type InitialSelected,
  type PresetSpec,
  type SelectionMode,
  CompositeConstraint,
  DisabledWeekdayConstraint,
  MinMaxConstraint,
  activateFocusTrap,
  announce,
  applyMask,
  createCalendarSystem,
  formatSelection,
  isMaskable,
  parseSelection,
} from '@anil-labs/core';
import { DatePicker } from './DatePicker.js';

const HINT_BY_PATTERN: Record<string, string> = {
  iso: 'YYYY-MM-DD',
  us: 'MM/DD/YYYY',
  eu: 'DD/MM/YYYY',
  medium: 'MMM D, YYYY',
  long: 'MMMM D, YYYY',
  short: 'M/D/YYYY',
};

const isComplete = (state: EngineState): boolean => {
  const s = state.selection;
  if (s.mode === 'single') return s.value !== null;
  if (s.mode === 'range') return s.value !== null;
  return false;
};

const toSelectionValue = (
  decoded: NonNullable<ReturnType<typeof parseSelection>>,
  mode: SelectionMode,
): Parameters<typeof formatSelection>[0] => {
  if (mode === 'single') return { mode: 'single', value: decoded.single ?? null };
  if (mode === 'range') return { mode: 'range', value: decoded.range ?? null, anchor: null };
  return { mode: 'multi', value: decoded.multi ?? [] };
};

/**
 * Multi mode: the single-date mask would strip `,`/`;`, making it impossible
 * to type more than one date. Mask each segment between separators instead,
 * preserving the separators themselves.
 */
const maskMultiSegments = (raw: string, pattern: string | FormatPreset): string =>
  raw
    .split(/([,;]\s*)/)
    .map((part, i) => (i % 2 === 1 ? part : applyMask(part, pattern).value))
    .join('');

export const DateField = defineComponent({
  name: 'DateField',
  props: {
    modelValue: { type: String, default: undefined },
    name: { type: String, default: undefined },
    /** Explicit input id. Auto-generated (stable per instance) when omitted. */
    id: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    mode: { type: String as PropType<SelectionMode>, default: 'single' },
    min: { type: Object as PropType<CalendarDate>, default: undefined },
    max: { type: Object as PropType<CalendarDate>, default: undefined },
    locale: {
      type: [String, Object] as PropType<DatePickerEngineOptions['locale']>,
      default: undefined,
    },
    calendar: {
      type: [String, Object] as PropType<CalendarId | CalendarSystem>,
      default: undefined,
    },
    disabledWeekdays: { type: Array as PropType<ReadonlyArray<number>>, default: undefined },
    format: { type: String as PropType<string | FormatPreset>, default: 'iso' },
    valueFormat: { type: String as PropType<string | FormatPreset>, default: undefined },
    required: { type: Boolean, default: false },
    helperText: { type: String, default: undefined },
    errorText: { type: String, default: undefined },
    error: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    mask: { type: Boolean, default: undefined },
    /** Preset specs passed through to the popover picker. */
    presets: { type: Array as PropType<ReadonlyArray<PresetSpec>>, default: undefined },
    /** Hide the popover picker's preset footer. */
    hideFooter: { type: Boolean, default: undefined },
  },
  emits: {
    'update:modelValue': (_value: string) => true,
    change: (_value: string) => true,
  },
  setup(props, { emit, slots }) {
    const open = ref(false);
    const flipUp = ref(false);
    /** True when the last blur-parse produced a date the constraints reject. */
    const parseInvalid = ref(false);
    const wrapperRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    const popoverRef = ref<HTMLElement | null>(null);

    // Stable per-instance id (generated ONCE in setup — never in render).
    const generatedId = useId();
    const fieldId = computed(() => props.id ?? `cal-input-${generatedId}`);

    const localeString = computed(() =>
      typeof props.locale === 'string' ? props.locale : (props.locale?.locale ?? 'en-US'),
    );
    const calendarSystem = computed(() => createCalendarSystem(props.calendar ?? 'gregorian'));
    const displayPattern = computed(() => props.format ?? 'iso');
    const storagePattern = computed(() => props.valueFormat ?? props.format ?? 'iso');

    const fmtOptsDisplay = computed(() => ({
      pattern: displayPattern.value,
      locale: localeString.value,
      calendar: calendarSystem.value,
    }));
    const fmtOptsStorage = computed(() => ({
      pattern: storagePattern.value,
      locale: localeString.value,
      calendar: calendarSystem.value,
    }));

    const toDisplay = (stored: string): string => {
      if (!stored) return '';
      const decoded = parseSelection(stored, props.mode, fmtOptsStorage.value);
      if (!decoded) return stored;
      return formatSelection(toSelectionValue(decoded, props.mode), fmtOptsDisplay.value);
    };

    const text = ref<string>(toDisplay(props.modelValue ?? ''));
    watch(
      () => props.modelValue,
      v => {
        if (typeof v === 'string') text.value = toDisplay(v);
      },
    );

    const decodedCurrent = computed<DecodedSelection | null>(() => {
      const current = props.modelValue ?? '';
      if (!current) return null;
      return parseSelection(current, props.mode, fmtOptsStorage.value);
    });

    const initialFocused = computed<CalendarDate | undefined>(() => {
      const d = decodedCurrent.value;
      return d?.single ?? d?.range?.start ?? d?.multi?.[0];
    });

    // Seed the popover picker with the committed selection so reopening shows
    // the picked date(s) as selected.
    const initialSelected = computed<InitialSelected | undefined>(() => {
      const d = decodedCurrent.value;
      if (!d) return undefined;
      if (props.mode === 'single') return d.single;
      if (props.mode === 'range')
        return d.range ? { start: d.range.start, end: d.range.end } : undefined;
      return d.multi;
    });

    // Constraint mirror of the popover engine, for validating typed input.
    const fieldConstraint = computed(() => {
      const cs: DateConstraint[] = [];
      if (props.min || props.max) cs.push(new MinMaxConstraint(props.min, props.max));
      if (props.disabledWeekdays?.length)
        cs.push(new DisabledWeekdayConstraint(props.disabledWeekdays, calendarSystem.value));
      return new CompositeConstraint(cs);
    });

    const violatesConstraints = (decoded: DecodedSelection): boolean => {
      const dates: ReadonlyArray<CalendarDate> = decoded.single
        ? [decoded.single]
        : decoded.range
          ? [decoded.range.start, decoded.range.end]
          : (decoded.multi ?? []);
      return dates.some(d => fieldConstraint.value.evaluate(d) !== null);
    };

    const commit = (next: string): void => {
      if (next === (props.modelValue ?? '')) return;
      emit('update:modelValue', next);
      emit('change', next);
    };

    // The popover picker reports every engine change (focus moves included);
    // only selection changes matter here. Track completeness for the
    // select-driven close below ('change' always fires before 'select').
    let lastPickerValue = '';
    let pickerComplete = false;

    const handlePickerChange = (state: EngineState): void => {
      pickerComplete = isComplete(state);
      const storedStr = formatSelection(state.selection, fmtOptsStorage.value);
      if (storedStr === lastPickerValue) return;
      lastPickerValue = storedStr;
      parseInvalid.value = false;
      text.value = formatSelection(state.selection, fmtOptsDisplay.value);
      commit(storedStr);
    };

    const handlePickerSelect = (): void => {
      if (props.mode !== 'multi' && pickerComplete) {
        open.value = false;
        void nextTick(() => inputRef.value?.focus());
      }
    };

    const handleInput = (e: Event): void => {
      const el = e.target as HTMLInputElement;
      const raw = el.value;
      parseInvalid.value = false;
      const maskEnabled = props.mask ?? isMaskable(displayPattern.value);
      // Don't mask while the user is deleting (length shrank).
      if (!maskEnabled || raw.length < text.value.length) {
        text.value = raw;
        return;
      }
      const caretPos = el.selectionStart ?? raw.length;
      let maskedValue: string;
      let caret: number;
      if (props.mode === 'multi') {
        maskedValue = maskMultiSegments(raw, displayPattern.value);
        caret = maskMultiSegments(raw.slice(0, caretPos), displayPattern.value).length;
      } else {
        maskedValue = applyMask(raw, displayPattern.value).value;
        // Masking the prefix up to the caret yields the caret's new position.
        caret = applyMask(raw.slice(0, caretPos), displayPattern.value).caret;
      }
      text.value = maskedValue;
      // Restore the caret after the masked value hits the DOM (prevents the
      // caret jumping to the end on mid-string edits).
      void nextTick(() => {
        const input = inputRef.value;
        if (!input || document.activeElement !== input) return;
        if (input.value !== maskedValue) input.value = maskedValue;
        input.setSelectionRange(caret, caret);
      });
    };

    const handleBlur = (): void => {
      const current = props.modelValue ?? '';
      if (text.value === toDisplay(current)) return;
      if (text.value.trim() === '') {
        parseInvalid.value = false;
        commit('');
        return;
      }
      const decoded =
        parseSelection(text.value, props.mode, fmtOptsDisplay.value) ??
        parseSelection(text.value, props.mode, fmtOptsStorage.value);
      if (!decoded) {
        text.value = toDisplay(current); // revert
        return;
      }
      if (violatesConstraints(decoded)) {
        // Keep the text so the user can correct it; flag the field, no commit.
        parseInvalid.value = true;
        return;
      }
      parseInvalid.value = false;
      const sel = toSelectionValue(decoded, props.mode);
      text.value = formatSelection(sel, fmtOptsDisplay.value);
      commit(formatSelection(sel, fmtOptsStorage.value));
    };

    const onDocumentPointer = (event: PointerEvent): void => {
      if (!open.value) return;
      if (!wrapperRef.value?.contains(event.target as Node)) open.value = false;
    };
    const onDocumentKey = (event: KeyboardEvent): void => {
      if (!open.value) return;
      if (event.key === 'Escape') {
        open.value = false;
        inputRef.value?.focus();
      }
    };

    onMounted(() => {
      document.addEventListener('pointerdown', onDocumentPointer);
      document.addEventListener('keydown', onDocumentKey);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('pointerdown', onDocumentPointer);
      document.removeEventListener('keydown', onDocumentKey);
    });

    // Focus trap inside the popover
    let trap: FocusTrap | null = null;
    watch(open, isOpen => {
      if (isOpen) {
        // Snapshot the committed value so untouched-engine changes are ignored.
        lastPickerValue = props.modelValue ?? '';
        pickerComplete = false;
        nextTick(() => {
          if (popoverRef.value) trap = activateFocusTrap(popoverRef.value);
        });
      } else if (trap) {
        trap.deactivate();
        trap = null;
      }
    });
    onBeforeUnmount(() => trap?.deactivate());

    // Announce the committed value to screen readers
    watch(
      () => props.modelValue,
      v => {
        if (typeof v === 'string' && v) announce(`Selected ${toDisplay(v)}`);
      },
    );

    watch(open, isOpen => {
      if (!isOpen) {
        flipUp.value = false;
        return;
      }
      nextTick(() => {
        const r = wrapperRef.value?.getBoundingClientRect();
        const popH = popoverRef.value?.offsetHeight ?? 320;
        if (!r) return;
        flipUp.value = r.bottom + popH + 8 > window.innerHeight && r.top - popH - 8 > 0;
      });
    });

    return () => {
      const current = props.modelValue ?? '';
      const placeholderText =
        props.placeholder ??
        HINT_BY_PATTERN[typeof displayPattern.value === 'string' ? displayPattern.value : 'iso'] ??
        String(displayPattern.value);

      const isInvalid = props.error === true || !!props.errorText || parseInvalid.value;
      const helperId = `${fieldId.value}-helper`;
      const errorId = `${fieldId.value}-error`;
      const describedBy =
        isInvalid && props.errorText ? errorId : props.helperText ? helperId : undefined;

      const pickerProps: Record<string, unknown> = { mode: props.mode };
      if (initialFocused.value !== undefined) pickerProps['initialFocused'] = initialFocused.value;
      if (initialSelected.value !== undefined)
        pickerProps['initialSelected'] = initialSelected.value;
      if (props.min !== undefined) pickerProps['min'] = props.min;
      if (props.max !== undefined) pickerProps['max'] = props.max;
      if (props.locale !== undefined) pickerProps['locale'] = props.locale;
      if (props.calendar !== undefined) pickerProps['calendar'] = props.calendar;
      if (props.disabledWeekdays !== undefined)
        pickerProps['disabledWeekdays'] = props.disabledWeekdays;
      if (props.presets !== undefined) pickerProps['presets'] = props.presets;
      if (props.hideFooter !== undefined) pickerProps['hideFooter'] = props.hideFooter;

      return h(
        'div',
        {
          class: ['cal-field', isInvalid ? 'cal-field--error' : ''].filter(Boolean).join(' '),
          ref: (el: unknown) => (wrapperRef.value = el as HTMLElement | null),
        },
        [
          props.label
            ? h('label', { class: 'cal-field__label', for: fieldId.value }, [
                props.label,
                props.required
                  ? h('span', { class: 'cal-field__required', 'aria-hidden': 'true' }, ' *')
                  : null,
              ])
            : null,
          h(
            'div',
            {
              class: 'cal-field__control',
              ...(props.disabled ? { 'data-disabled': 'true' } : {}),
              ...(isInvalid ? { 'data-error': 'true' } : {}),
            },
            [
              h('input', {
                ref: (el: unknown) => (inputRef.value = el as HTMLInputElement | null),
                id: fieldId.value,
                type: 'text',
                class: 'cal-field__input',
                value: text.value,
                placeholder: placeholderText,
                disabled: props.disabled,
                required: props.required,
                autocomplete: 'off',
                spellcheck: false,
                'aria-haspopup': 'dialog',
                'aria-expanded': open.value,
                'aria-invalid': isInvalid || undefined,
                'data-invalid': isInvalid ? 'true' : undefined,
                'aria-describedby': describedBy,
                onInput: handleInput,
                onFocus: () => (open.value = true),
                onClick: () => (open.value = true),
                onBlur: handleBlur,
              }),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cal-field__trigger',
                  tabindex: -1,
                  'aria-label': 'Open calendar',
                  disabled: props.disabled,
                  onMousedown: (e: MouseEvent) => e.preventDefault(),
                  onClick: () => {
                    open.value = !open.value;
                    nextTick(() => inputRef.value?.focus());
                  },
                },
                [calendarIconSvg()],
              ),
            ],
          ),
          props.name !== undefined
            ? h('input', { type: 'hidden', name: props.name, value: current })
            : null,
          open.value
            ? h(
                'div',
                {
                  ref: (el: unknown) => (popoverRef.value = el as HTMLElement | null),
                  class: 'cal-field__popover',
                  'data-flip': flipUp.value ? 'up' : 'down',
                  role: 'dialog',
                  'aria-modal': 'false',
                  onMousedown: (e: MouseEvent) => e.preventDefault(),
                },
                [
                  h(
                    DatePicker,
                    {
                      ...pickerProps,
                      onChange: handlePickerChange,
                      onSelect: handlePickerSelect,
                    },
                    // Forward the day-cell slot to the popover picker.
                    slots.cell ? { cell: slots.cell } : undefined,
                  ),
                ],
              )
            : null,
          isInvalid && props.errorText
            ? h('p', { id: errorId, class: 'cal-field__error', role: 'alert' }, props.errorText)
            : !isInvalid && props.helperText
              ? h('p', { id: helperId, class: 'cal-field__helper' }, props.helperText)
              : null,
        ],
      );
    };

    function calendarIconSvg() {
      return h(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        [
          h('rect', {
            x: 2,
            y: 3.5,
            width: 12,
            height: 10.5,
            rx: 1.5,
            stroke: 'currentColor',
            'stroke-width': 1.25,
          }),
          h('path', { d: 'M2 6.5h12', stroke: 'currentColor', 'stroke-width': 1.25 }),
          h('path', {
            d: 'M5 2v2.5M11 2v2.5',
            stroke: 'currentColor',
            'stroke-width': 1.25,
            'stroke-linecap': 'round',
          }),
        ],
      );
    }
  },
});
