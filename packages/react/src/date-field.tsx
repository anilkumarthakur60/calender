import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { DatePicker } from './date-picker.js';

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

export const DateField = (props: DateFieldProps): JSX.Element => {
  const {
    name,
    value,
    defaultValue,
    onChange,
    mode = 'single',
    format = 'iso',
    valueFormat,
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
    ...engineProps
  } = props;

  const isInvalid = error === true || errorText != null;
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

  const current = controlled ? (value as string) : committed;

  useEffect(() => {
    if (controlled) setText(toDisplay(value as string));
  }, [controlled, value, toDisplay]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const initialFocused = useMemo<CalendarDate | undefined>(() => {
    if (!current) return undefined;
    const decoded = parseSelection(current, mode, fmtOptsStorage);
    return decoded?.single ?? decoded?.range?.start ?? decoded?.multi?.[0];
  }, [current, mode, fmtOptsStorage]);

  const commit = useCallback(
    (next: string) => {
      if (next === current) return;
      if (!controlled) setCommitted(next);
      onChange?.(next);
    },
    [controlled, current, onChange],
  );

  const handlePickerChange = useCallback(
    (state: EngineState) => {
      const displayStr = formatSelection(state.selection, fmtOptsDisplay);
      const storedStr = formatSelection(state.selection, fmtOptsStorage);
      setText(displayStr);
      commit(storedStr);
      if (isComplete(state) && mode !== 'multi') {
        setOpen(false);
        inputRef.current?.focus();
      }
    },
    [commit, mode, fmtOptsDisplay, fmtOptsStorage],
  );

  const handleBlur = useCallback(() => {
    if (text === toDisplay(current)) return;
    if (text.trim() === '') {
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
    const sel = toSelectionValue(decoded, mode);
    setText(formatSelection(sel, fmtOptsDisplay));
    commit(formatSelection(sel, fmtOptsStorage));
  }, [text, current, mode, fmtOptsDisplay, fmtOptsStorage, commit, toDisplay]);

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

  useLayoutEffect(() => {
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

  // Announce the committed value to screen readers.
  useEffect(() => {
    if (current) announce(`Selected ${current}`);
  }, [current]);

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
        <input
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
            const raw = e.target.value;
            if (!maskEnabled) {
              setText(raw);
              return;
            }
            // Don't mask while the user is deleting (length shrank).
            if (raw.length < text.length) {
              setText(raw);
              return;
            }
            const masked = applyMask(raw, format);
            setText(masked.value);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          {...inputProps}
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
            mode={mode}
            {...(initialFocused !== undefined && { initialFocused })}
            {...(locale !== undefined && { locale })}
            {...(calendar !== undefined && { calendar })}
            {...engineProps}
            onChange={handlePickerChange}
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
};

// Turn a DecodedSelection back into a SelectionValue (the shape formatSelection accepts).
const toSelectionValue = (
  decoded: ReturnType<typeof parseSelection> & object,
  mode: SelectionMode,
): Parameters<typeof formatSelection>[0] => {
  if (mode === 'single') return { mode: 'single', value: decoded.single ?? null };
  if (mode === 'range') return { mode: 'range', value: decoded.range ?? null, anchor: null };
  return { mode: 'multi', value: decoded.multi ?? [] };
};

const CalendarIcon = (): JSX.Element => (
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
