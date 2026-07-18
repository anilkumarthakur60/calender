import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type CalendarDate,
  type CalendarId,
  type CalendarSystem,
  type DateConstraint,
  type DatePickerEngine,
  type DatePickerEngineOptions,
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
import { DatePicker, type DatePickerHandle, type DayCellContext } from './date-picker.js';

/** `useLayoutEffect` on the client, `useEffect` during SSR (no warning). */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface DateFieldProps {
  // --- Form integration ---------------------------------------------------
  /** Native form input name; emits a hidden <input> so this field submits like any other. */
  readonly name?: string;
  /** Controlled value (formatted via `valueFormat`). */
  readonly value?: string;
  /** Initial value when uncontrolled. */
  readonly defaultValue?: string;
  /** Fires whenever the value changes (after parse-on-blur or pick). */
  readonly onChange?: (value: string) => void;

  // --- Format ------------------------------------------------------------
  /**
   * Display format for the input. Either a preset (`iso`, `us`, `eu`, `medium`,
   * `long`, `short`) or a token pattern (`yyyy-MM-dd`, `dd/MM/yyyy`, …).
   * Defaults to `iso`.
   */
  readonly format?: string | FormatPreset;
  /**
   * Format used for the controlled value + onChange string. Defaults to
   * whatever `format` is. Pass `'iso'` if you want machine-readable storage
   * with a human display format (`format="dd/MM/yyyy" valueFormat="iso"`).
   */
  readonly valueFormat?: string | FormatPreset;

  // --- Engine options ----------------------------------------------------
  readonly mode?: SelectionMode;
  readonly min?: CalendarDate;
  readonly max?: CalendarDate;
  readonly calendar?: CalendarId | CalendarSystem;
  readonly locale?: DatePickerEngineOptions['locale'];
  readonly disabledWeekdays?: ReadonlyArray<number>;
  /** Minimum number of days a range must span. Forwarded to the popover picker. */
  readonly minRangeDays?: number;
  /** Maximum number of days a range may span. Forwarded to the popover picker. */
  readonly maxRangeDays?: number;

  // --- Time picker (forwarded to the popover picker) ---------------------
  /** Show a time row in the popover picker. */
  readonly withTime?: boolean;
  /** Minute increment for the time row. */
  readonly timeStep?: number;
  /** Use a 12-hour (AM/PM) clock instead of 24-hour. */
  readonly use12HourClock?: boolean;
  /** Show a seconds field in the time row. */
  readonly showSeconds?: boolean;
  /** Selection granularity (e.g. `'day'`, `'minute'`). */
  readonly granularity?: DatePickerEngineOptions['granularity'];

  // --- Popover picker chrome ----------------------------------------------
  /** Preset specs passed through to the popover picker. */
  readonly presets?: ReadonlyArray<PresetSpec>;
  /** Hide the popover picker's preset footer. */
  readonly hideFooter?: boolean;
  /** Custom day-cell renderer passed through to the popover picker. */
  readonly renderCell?: (ctx: DayCellContext) => React.ReactNode;

  // --- Input chrome ------------------------------------------------------
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly id?: string;
  readonly className?: string;
  readonly inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  readonly autoFocus?: boolean;

  // --- Form feedback -----------------------------------------------------
  /** Helper text shown below the input. Hidden when an error is active. */
  readonly helperText?: React.ReactNode;
  /** Error message shown below the input. When present, sets `aria-invalid` + applies error styling. */
  readonly errorText?: React.ReactNode;
  /** Force the error state on without an `errorText` message. */
  readonly error?: boolean;
  /** Optional label rendered above the input. */
  readonly label?: React.ReactNode;
  /**
   * Auto-format the input as the user types (insert separators between
   * digits). Defaults to `true` for numeric patterns (iso/us/eu/short), `false`
   * for patterns with month/weekday names.
   */
  readonly mask?: boolean;
}

/** Imperative surface exposed through the component ref. */
export interface DateFieldHandle {
  /** Move DOM focus to the text input. */
  focus(): void;
  /** Engine of the open popover picker, or null while the popover is closed. */
  readonly engine: DatePickerEngine | null;
}

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

export const DateField = forwardRef<DateFieldHandle, DateFieldProps>(
  (props, ref): React.JSX.Element => {
    const {
      name,
      value,
      defaultValue,
      onChange,
      mode = 'single',
      format = 'iso',
      valueFormat,
      min,
      max,
      disabledWeekdays,
      minRangeDays,
      maxRangeDays,
      withTime,
      timeStep,
      use12HourClock,
      showSeconds,
      granularity,
      presets,
      hideFooter,
      renderCell,
      placeholder,
      disabled,
      required,
      id: idProp,
      className,
      inputProps,
      autoFocus,
      locale,
      calendar,
      helperText,
      errorText,
      error,
      label,
      mask,
    } = props;

    const maskEnabled = mask ?? isMaskable(format);

    const controlled = value !== undefined;
    const generatedId = useId();
    const id = idProp ?? `cal-input-${generatedId}`;

    const localeString = typeof locale === 'string' ? locale : (locale?.locale ?? 'en-US');
    const calendarSystem = useMemo(() => createCalendarSystem(calendar ?? 'gregorian'), [calendar]);

    const displayPattern = format;
    const storagePattern = valueFormat ?? format;
    const fmtOptsDisplay = useMemo(
      () => ({ pattern: displayPattern, locale: localeString, calendar: calendarSystem }),
      [displayPattern, localeString, calendarSystem],
    );
    const fmtOptsStorage = useMemo(
      () => ({ pattern: storagePattern, locale: localeString, calendar: calendarSystem }),
      [storagePattern, localeString, calendarSystem],
    );

    // Convert the user-facing storage value <-> display value.
    const toDisplay = useCallback(
      (stored: string): string => {
        if (!stored) return '';
        const decoded = parseSelection(stored, mode, fmtOptsStorage);
        if (!decoded) return stored;
        return formatSelection(toSelectionValue(decoded, mode), fmtOptsDisplay);
      },
      [mode, fmtOptsStorage, fmtOptsDisplay],
    );

    const [committed, setCommitted] = useState<string>(defaultValue ?? value ?? '');
    const [text, setText] = useState<string>(toDisplay(defaultValue ?? value ?? ''));
    const [open, setOpen] = useState(false);
    const [flipUp, setFlipUp] = useState(false);
    /** True when the last blur-parse produced a date the constraints reject. */
    const [parseInvalid, setParseInvalid] = useState(false);

    const current = controlled ? (value as string) : committed;
    const isInvalid = error === true || errorText != null || parseInvalid;

    useEffect(() => {
      if (controlled) setText(toDisplay(value as string));
    }, [controlled, value, toDisplay]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<DatePickerHandle>(null);
    const pendingCaretRef = useRef<number | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        get engine() {
          return pickerRef.current?.engine ?? null;
        },
      }),
      [],
    );

    const decodedCurrent = useMemo(
      () => (current ? parseSelection(current, mode, fmtOptsStorage) : null),
      [current, mode, fmtOptsStorage],
    );

    const initialFocused = useMemo<CalendarDate | undefined>(
      () => decodedCurrent?.single ?? decodedCurrent?.range?.start ?? decodedCurrent?.multi?.[0],
      [decodedCurrent],
    );

    // Seed the popover picker with the committed selection so reopening shows
    // the picked date(s) as selected.
    const initialSelected = useMemo<InitialSelected | undefined>(() => {
      if (!decodedCurrent) return undefined;
      if (mode === 'single') return decodedCurrent.single;
      if (mode === 'range') {
        return decodedCurrent.range
          ? { start: decodedCurrent.range.start, end: decodedCurrent.range.end }
          : undefined;
      }
      return decodedCurrent.multi;
    }, [decodedCurrent, mode]);

    // Constraint mirror of the popover engine, for validating typed input.
    const fieldConstraint = useMemo(() => {
      const cs: DateConstraint[] = [];
      if (min || max) cs.push(new MinMaxConstraint(min, max));
      if (disabledWeekdays?.length)
        cs.push(new DisabledWeekdayConstraint(disabledWeekdays, calendarSystem));
      return new CompositeConstraint(cs);
    }, [min, max, disabledWeekdays, calendarSystem]);

    const violatesConstraints = useCallback(
      (decoded: NonNullable<ReturnType<typeof parseSelection>>): boolean => {
        const dates: ReadonlyArray<CalendarDate> = decoded.single
          ? [decoded.single]
          : decoded.range
            ? [decoded.range.start, decoded.range.end]
            : (decoded.multi ?? []);
        return dates.some(d => fieldConstraint.evaluate(d) !== null);
      },
      [fieldConstraint],
    );

    const commit = useCallback(
      (next: string) => {
        if (next === current) return;
        if (!controlled) setCommitted(next);
        onChange?.(next);
      },
      [controlled, current, onChange],
    );

    // The popover picker reports every engine change (focus moves included);
    // only selection changes matter here. Track completeness for the
    // select-driven close below ('change' always fires before 'select').
    const lastPickerValueRef = useRef<string>('');
    const pickerCompleteRef = useRef(false);

    const handlePickerChange = useCallback(
      (state: EngineState) => {
        pickerCompleteRef.current = isComplete(state);
        const storedStr = formatSelection(state.selection, fmtOptsStorage);
        if (storedStr === lastPickerValueRef.current) return;
        lastPickerValueRef.current = storedStr;
        setParseInvalid(false);
        setText(formatSelection(state.selection, fmtOptsDisplay));
        commit(storedStr);
      },
      [commit, fmtOptsDisplay, fmtOptsStorage],
    );

    const handlePickerSelect = useCallback(() => {
      if (mode !== 'multi' && pickerCompleteRef.current) {
        setOpen(false);
        inputRef.current?.focus();
      }
    }, [mode]);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setParseInvalid(false);
        // Don't mask while the user is deleting (length shrank).
        if (!maskEnabled || raw.length < text.length) {
          setText(raw);
          return;
        }
        const caretPos = e.target.selectionStart ?? raw.length;
        if (mode === 'multi') {
          pendingCaretRef.current = maskMultiSegments(raw.slice(0, caretPos), format).length;
          setText(maskMultiSegments(raw, format));
          return;
        }
        // Masking the prefix up to the caret yields the caret's new position.
        pendingCaretRef.current = applyMask(raw.slice(0, caretPos), format).caret;
        setText(applyMask(raw, format).value);
      },
      [maskEnabled, text.length, mode, format],
    );

    // Restore the caret after the masked value has rendered (prevents the
    // caret jumping to the end on mid-string edits).
    useIsomorphicLayoutEffect(() => {
      const caret = pendingCaretRef.current;
      if (caret === null) return;
      pendingCaretRef.current = null;
      const input = inputRef.current;
      if (input && document.activeElement === input) input.setSelectionRange(caret, caret);
    }, [text]);

    const handleBlur = useCallback(() => {
      if (text === toDisplay(current)) return;
      if (text.trim() === '') {
        setParseInvalid(false);
        commit('');
        return;
      }
      // Try display format first (what the input is shaped as), then storage.
      const decoded =
        parseSelection(text, mode, fmtOptsDisplay) ?? parseSelection(text, mode, fmtOptsStorage);
      if (!decoded) {
        setText(toDisplay(current)); // revert
        return;
      }
      if (violatesConstraints(decoded)) {
        // Keep the text so the user can correct it; flag the field, no commit.
        setParseInvalid(true);
        return;
      }
      setParseInvalid(false);
      const sel = toSelectionValue(decoded, mode);
      setText(formatSelection(sel, fmtOptsDisplay));
      commit(formatSelection(sel, fmtOptsStorage));
    }, [
      text,
      current,
      mode,
      fmtOptsDisplay,
      fmtOptsStorage,
      commit,
      toDisplay,
      violatesConstraints,
    ]);

    // Outside click + Escape
    useEffect(() => {
      if (!open) return;
      const onPointer = (event: PointerEvent): void => {
        if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
      };
      const onKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          setOpen(false);
          inputRef.current?.focus();
        }
      };
      document.addEventListener('pointerdown', onPointer);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('pointerdown', onPointer);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);

    // Reset the picker bookkeeping whenever the popover opens.
    useEffect(() => {
      if (!open) return;
      lastPickerValueRef.current = current;
      pickerCompleteRef.current = false;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot at open
    }, [open]);

    useIsomorphicLayoutEffect(() => {
      if (!open) {
        setFlipUp(false);
        return;
      }
      const input = wrapperRef.current?.getBoundingClientRect();
      const popH = popoverRef.current?.offsetHeight ?? 320;
      if (!input) return;
      setFlipUp(input.bottom + popH + 8 > window.innerHeight && input.top - popH - 8 > 0);
    }, [open]);

    // Focus trap inside the popover.
    useEffect(() => {
      if (!open || !popoverRef.current) return;
      const trap: FocusTrap = activateFocusTrap(popoverRef.current);
      return () => trap.deactivate();
    }, [open]);

    // Announce committed values to screen readers — only after user-initiated
    // changes (never on mount) and using the human-readable display value.
    const announcedRef = useRef<string | null>(null);
    useEffect(() => {
      if (announcedRef.current === null) {
        announcedRef.current = current;
        return;
      }
      if (current === announcedRef.current) return;
      announcedRef.current = current;
      if (current) announce(`Selected ${toDisplay(current)}`);
    }, [current, toDisplay]);

    const placeholderText =
      placeholder ??
      HINT_BY_PATTERN[typeof displayPattern === 'string' ? displayPattern : 'iso'] ??
      String(displayPattern);

    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const describedBy =
      isInvalid && errorText != null ? errorId : helperText != null ? helperId : undefined;

    return (
      <div
        ref={wrapperRef}
        className={['cal-field', isInvalid ? 'cal-field--error' : '', className]
          .filter(Boolean)
          .join(' ')}
      >
        {label != null && (
          <label htmlFor={id} className="cal-field__label">
            {label}
            {required && (
              <span className="cal-field__required" aria-hidden="true">
                {' *'}
              </span>
            )}
          </label>
        )}
        <div
          className="cal-field__control"
          data-disabled={disabled || undefined}
          data-error={isInvalid || undefined}
        >
          {/* inputProps spread FIRST so internal bindings can't be destroyed;
              the composed handlers run the internal logic, then the user's. */}
          <input
            {...inputProps}
            ref={inputRef}
            id={id}
            type="text"
            className="cal-field__input"
            value={text}
            placeholder={placeholderText}
            disabled={disabled}
            required={required}
            autoComplete="off"
            spellCheck={false}
            onChange={e => {
              handleInputChange(e);
              inputProps?.onChange?.(e);
            }}
            onFocus={e => {
              setOpen(true);
              inputProps?.onFocus?.(e);
            }}
            onClick={e => {
              setOpen(true);
              inputProps?.onClick?.(e);
            }}
            onBlur={e => {
              handleBlur();
              inputProps?.onBlur?.(e);
            }}
            autoFocus={autoFocus}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-invalid={isInvalid || undefined}
            data-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
          />
          <button
            type="button"
            className="cal-field__trigger"
            tabIndex={-1}
            aria-label="Open calendar"
            disabled={disabled}
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setOpen(v => !v);
              inputRef.current?.focus();
            }}
          >
            <CalendarIcon />
          </button>
        </div>
        {name !== undefined && <input type="hidden" name={name} value={current} />}
        {open && (
          <div
            ref={popoverRef}
            className="cal-field__popover"
            data-flip={flipUp ? 'up' : 'down'}
            role="dialog"
            aria-modal="false"
            onMouseDown={e => e.preventDefault()}
          >
            <DatePicker
              ref={pickerRef}
              mode={mode}
              {...(initialFocused !== undefined && { initialFocused })}
              {...(initialSelected !== undefined && { initialSelected })}
              {...(locale !== undefined && { locale })}
              {...(calendar !== undefined && { calendar })}
              {...(min !== undefined && { min })}
              {...(max !== undefined && { max })}
              {...(disabledWeekdays !== undefined && { disabledWeekdays })}
              {...(minRangeDays !== undefined && { minRangeDays })}
              {...(maxRangeDays !== undefined && { maxRangeDays })}
              {...(withTime !== undefined && { withTime })}
              {...(timeStep !== undefined && { timeStep })}
              {...(use12HourClock !== undefined && { use12HourClock })}
              {...(showSeconds !== undefined && { showSeconds })}
              {...(granularity !== undefined && { granularity })}
              {...(presets !== undefined && { presets })}
              {...(hideFooter !== undefined && { hideFooter })}
              {...(renderCell !== undefined && { renderCell })}
              onChange={handlePickerChange}
              onSelect={handlePickerSelect}
            />
          </div>
        )}
        {isInvalid && errorText != null && (
          <p id={errorId} className="cal-field__error" role="alert">
            {errorText}
          </p>
        )}
        {!isInvalid && helperText != null && (
          <p id={helperId} className="cal-field__helper">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

DateField.displayName = 'DateField';

// Turn a DecodedSelection back into a SelectionValue (the shape formatSelection accepts).
const toSelectionValue = (
  decoded: ReturnType<typeof parseSelection> & object,
  mode: SelectionMode,
): Parameters<typeof formatSelection>[0] => {
  if (mode === 'single') return { mode: 'single', value: decoded.single ?? null };
  if (mode === 'range') return { mode: 'range', value: decoded.range ?? null, anchor: null };
  return { mode: 'multi', value: decoded.multi ?? [] };
};

const CalendarIcon = (): React.JSX.Element => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect
      x="2"
      y="3.5"
      width="12"
      height="10.5"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5 2v2.5M11 2v2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);
