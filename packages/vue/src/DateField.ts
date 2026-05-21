import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue';
import {
  type CalendarDate,
  type CalendarId,
  type CalendarSystem,
  type DatePickerEngineOptions,
  type EngineState,
  type FocusTrap,
  type FormatPreset,
  type SelectionMode,
  activateFocusTrap,
  announce,
  applyMask,
  createCalendarSystem,
  formatSelection,
  isMaskable,
  parseSelection,
} from '@calender/core';
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

export const DateField = defineComponent({
  name: 'DateField',
  props: {
    modelValue: { type: String, default: undefined },
    name: { type: String, default: undefined },
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
  },
  emits: {
    'update:modelValue': (_value: string) => true,
    change: (_value: string) => true,
  },
  setup(props, { emit }) {
    const open = ref(false);
    const flipUp = ref(false);
    const wrapperRef = ref<HTMLElement | null>(null);
    const inputRef = ref<HTMLInputElement | null>(null);
    const popoverRef = ref<HTMLElement | null>(null);

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

    const initialFocused = computed<CalendarDate | undefined>(() => {
      const current = props.modelValue ?? '';
      if (!current) return undefined;
      const decoded = parseSelection(current, props.mode, fmtOptsStorage.value);
      return decoded?.single ?? decoded?.range?.start ?? decoded?.multi?.[0];
    });

    const commit = (next: string): void => {
      if (next === (props.modelValue ?? '')) return;
      emit('update:modelValue', next);
      emit('change', next);
    };

    const handlePickerChange = (state: EngineState): void => {
      const displayStr = formatSelection(state.selection, fmtOptsDisplay.value);
      const storedStr = formatSelection(state.selection, fmtOptsStorage.value);
      text.value = displayStr;
      commit(storedStr);
      if (isComplete(state) && props.mode !== 'multi') {
        open.value = false;
        nextTick(() => inputRef.value?.focus());
      }
    };

    const handleBlur = (): void => {
      const current = props.modelValue ?? '';
      if (text.value === toDisplay(current)) return;
      if (text.value.trim() === '') {
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
        if (typeof v === 'string' && v) announce(`Selected ${v}`);
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

      const isInvalid = props.error === true || !!props.errorText;
      const fieldId = `cal-input-${Math.random().toString(36).slice(2, 9)}`;
      const helperId = `${fieldId}-helper`;
      const errorId = `${fieldId}-error`;
      const describedBy =
        isInvalid && props.errorText ? errorId : props.helperText ? helperId : undefined;

      const pickerProps: Record<string, unknown> = { mode: props.mode };
      if (initialFocused.value !== undefined) pickerProps['initialFocused'] = initialFocused.value;
      if (props.min !== undefined) pickerProps['min'] = props.min;
      if (props.max !== undefined) pickerProps['max'] = props.max;
      if (props.locale !== undefined) pickerProps['locale'] = props.locale;
      if (props.calendar !== undefined) pickerProps['calendar'] = props.calendar;
      if (props.disabledWeekdays !== undefined)
        pickerProps['disabledWeekdays'] = props.disabledWeekdays;

      return h(
        'div',
        {
          class: ['cal-field', isInvalid ? 'cal-field--error' : ''].filter(Boolean).join(' '),
          ref: (el: unknown) => (wrapperRef.value = el as HTMLElement | null),
        },
        [
          props.label
            ? h('label', { class: 'cal-field__label', for: fieldId }, [
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
                id: fieldId,
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
                'aria-describedby': describedBy,
                onInput: (e: Event) => {
                  const raw = (e.target as HTMLInputElement).value;
                  const maskEnabled = props.mask ?? isMaskable(displayPattern.value);
                  if (!maskEnabled || raw.length < text.value.length) {
                    text.value = raw;
                    return;
                  }
                  text.value = applyMask(raw, displayPattern.value).value;
                },
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
                [h(DatePicker, { ...pickerProps, onChange: handlePickerChange })],
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
