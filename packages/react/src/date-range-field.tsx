import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  type CalendarDate,
  type CalendarId,
  type CalendarSystem,
  type DatePickerEngineOptions,
  type FormatPreset,
  createCalendarSystem,
  createRange,
  formatSelection,
  parseSelection,
} from '@anil-labs/core';
import { DateField, type DateFieldHandle, type DateFieldProps } from './date-field.js';

export interface DateRangeFieldProps {
  /** Form name for the start date — emits a hidden input. */
  readonly nameStart?: string;
  /** Form name for the end date. */
  readonly nameEnd?: string;
  /** Initial range, formatted via `valueFormat` (defaults to `format`). */
  readonly defaultValue?: string;
  /** Controlled combined range value, formatted via `valueFormat` (defaults to `format`). */
  readonly value?: string;
  readonly onChange?: (value: string) => void;

  // --- Inputs ------------------------------------------------------------
  readonly labelStart?: React.ReactNode;
  readonly labelEnd?: React.ReactNode;
  readonly placeholderStart?: string;
  readonly placeholderEnd?: string;

  // --- Format / locale / calendar ----------------------------------------
  readonly format?: string | FormatPreset;
  readonly valueFormat?: string | FormatPreset;
  readonly locale?: DatePickerEngineOptions['locale'];
  readonly calendar?: CalendarId | CalendarSystem;

  // --- Constraints -------------------------------------------------------
  readonly min?: CalendarDate;
  readonly max?: CalendarDate;
  readonly minRangeDays?: number;
  readonly maxRangeDays?: number;

  // --- Form chrome -------------------------------------------------------
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
  readonly helperText?: React.ReactNode;
  readonly errorText?: React.ReactNode;
  readonly error?: boolean;
}

/** Imperative surface exposed through the component ref. */
export interface DateRangeFieldHandle {
  /** Move DOM focus to the start input. */
  focus(): void;
  /** Handle of the start `DateField`. */
  readonly startField: DateFieldHandle | null;
  /** Handle of the end `DateField`. */
  readonly endField: DateFieldHandle | null;
}

interface RangeParts {
  readonly start: string;
  readonly end: string;
}

/**
 * Two side-by-side `DateField` inputs for start + end. The second input's
 * minimum derives from the first (plus `minRangeDays`/`maxRangeDays`), so the
 * user can't select an end before the start. The pair publishes one combined
 * value in the configured `valueFormat ?? format` — the SAME canonical format
 * the child fields speak, round-tripped via the separator-safe core codec.
 */
export const DateRangeField = forwardRef<DateRangeFieldHandle, DateRangeFieldProps>(
  (props, ref): React.JSX.Element => {
    const {
      nameStart,
      nameEnd,
      defaultValue,
      value,
      onChange,
      labelStart,
      labelEnd,
      placeholderStart,
      placeholderEnd,
      format = 'iso',
      valueFormat,
      locale,
      calendar,
      min,
      max,
      minRangeDays,
      maxRangeDays,
      disabled,
      required,
      className,
      helperText,
      errorText,
      error,
    } = props;

    const controlled = value !== undefined;

    const localeString = typeof locale === 'string' ? locale : (locale?.locale ?? 'en-US');
    const calendarSystem = useMemo(() => createCalendarSystem(calendar ?? 'gregorian'), [calendar]);

    // ONE canonical storage format end-to-end: the same pattern the child
    // DateFields publish (their valueFormat ?? format).
    const storagePattern = valueFormat ?? format;
    const fmtOpts = useMemo(
      () => ({ pattern: storagePattern, locale: localeString, calendar: calendarSystem }),
      [storagePattern, localeString, calendarSystem],
    );

    const parseOne = useCallback(
      (s: string): CalendarDate | null =>
        s ? (parseSelection(s, 'single', fmtOpts)?.single ?? null) : null,
      [fmtOpts],
    );

    const formatOne = useCallback(
      (d: CalendarDate): string => formatSelection({ mode: 'single', value: d }, fmtOpts),
      [fmtOpts],
    );

    /** Combined value -> per-field strings (all in the storage format). */
    const decompose = useCallback(
      (combined: string): RangeParts => {
        if (!combined) return { start: '', end: '' };
        const decoded = parseSelection(combined, 'range', fmtOpts);
        if (!decoded?.range) return { start: '', end: '' };
        return { start: formatOne(decoded.range.start), end: formatOne(decoded.range.end) };
      },
      [fmtOpts, formatOne],
    );

    /** Per-field strings -> combined value ('' until both halves parse). */
    const combine = useCallback(
      (parts: RangeParts): string => {
        const s = parseOne(parts.start);
        const e = parseOne(parts.end);
        if (!s || !e) return '';
        return formatSelection({ mode: 'range', value: createRange(s, e), anchor: null }, fmtOpts);
      },
      [parseOne, fmtOpts],
    );

    const [parts, setParts] = useState<RangeParts>(() => decompose(defaultValue ?? value ?? ''));
    const [internal, setInternal] = useState<string>(defaultValue ?? '');
    const current = controlled ? (value as string) : internal;

    // Externally-controlled value changes re-seed the fields — but an echo of
    // the value we just published must not clobber a half-typed range.
    useEffect(() => {
      if (!controlled) return;
      setParts(prev => ((value ?? '') === combine(prev) ? prev : decompose(value ?? '')));
    }, [controlled, value, combine, decompose]);

    const commitParts = useCallback(
      (next: RangeParts) => {
        setParts(next);
        const combined = combine(next);
        if (combined === current) return;
        if (!controlled) setInternal(combined);
        onChange?.(combined);
      },
      [combine, controlled, current, onChange],
    );

    const onStartChange = useCallback(
      (s: string): void => {
        const startDate = parseOne(s);
        const endDate = parseOne(parts.end);
        // If end is before the new start, clear end.
        const nextEnd =
          startDate && endDate && calendarSystem.compare(endDate, startDate) < 0 ? '' : parts.end;
        commitParts({ start: s, end: nextEnd });
      },
      [parseOne, parts.end, calendarSystem, commitParts],
    );

    const onEndChange = useCallback(
      (e: string): void => {
        commitParts({ start: parts.start, end: e });
      },
      [parts.start, commitParts],
    );

    const startDate = useMemo(() => parseOne(parts.start), [parseOne, parts.start]);

    // Second input's bounds derive from the first + the range-length limits.
    const endMin = useMemo<CalendarDate | undefined>(() => {
      if (!startDate) return min;
      const fromStart =
        minRangeDays !== undefined && minRangeDays > 1
          ? calendarSystem.addDays(startDate, minRangeDays - 1)
          : startDate;
      if (!min) return fromStart;
      return calendarSystem.compare(fromStart, min) > 0 ? fromStart : min;
    }, [startDate, min, minRangeDays, calendarSystem]);

    const endMax = useMemo<CalendarDate | undefined>(() => {
      if (!startDate || maxRangeDays === undefined) return max;
      const cap = calendarSystem.addDays(startDate, maxRangeDays - 1);
      if (!max) return cap;
      return calendarSystem.compare(cap, max) < 0 ? cap : max;
    }, [startDate, max, maxRangeDays, calendarSystem]);

    const startRef = useRef<DateFieldHandle>(null);
    const endRef = useRef<DateFieldHandle>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => startRef.current?.focus(),
        get startField() {
          return startRef.current;
        },
        get endField() {
          return endRef.current;
        },
      }),
      [],
    );

    const sharedField: DateFieldProps = {
      format,
      ...(locale !== undefined ? { locale } : {}),
      ...(disabled !== undefined ? { disabled } : {}),
      ...(required !== undefined ? { required } : {}),
      ...(valueFormat !== undefined ? { valueFormat } : {}),
      ...(calendar !== undefined ? { calendar } : {}),
      // Forwarded to the popover picker's engine options.
      ...(minRangeDays !== undefined ? { minRangeDays } : {}),
      ...(maxRangeDays !== undefined ? { maxRangeDays } : {}),
    };

    return (
      <div className={['cal-range-field', className].filter(Boolean).join(' ')}>
        <div className="cal-range-field__inputs">
          <DateField
            ref={startRef}
            {...sharedField}
            {...(labelStart !== undefined ? { label: labelStart } : {})}
            value={parts.start}
            onChange={onStartChange}
            {...(placeholderStart !== undefined ? { placeholder: placeholderStart } : {})}
            {...(min !== undefined ? { min } : {})}
            {...(max !== undefined ? { max } : {})}
            {...(error !== undefined ? { error } : {})}
          />
          <span className="cal-range-field__separator" aria-hidden="true">
            –
          </span>
          <DateField
            ref={endRef}
            {...sharedField}
            {...(labelEnd !== undefined ? { label: labelEnd } : {})}
            value={parts.end}
            onChange={onEndChange}
            {...(placeholderEnd !== undefined ? { placeholder: placeholderEnd } : {})}
            {...(endMin !== undefined ? { min: endMin } : {})}
            {...(endMax !== undefined ? { max: endMax } : {})}
            {...(error !== undefined ? { error } : {})}
          />
        </div>
        {nameStart && <input type="hidden" name={nameStart} value={parts.start} />}
        {nameEnd && <input type="hidden" name={nameEnd} value={parts.end} />}
        {errorText && (
          <p className="cal-field__error" role="alert">
            {errorText}
          </p>
        )}
        {!errorText && helperText && <p className="cal-field__helper">{helperText}</p>}
      </div>
    );
  },
);

DateRangeField.displayName = 'DateRangeField';
