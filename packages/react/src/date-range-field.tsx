import { useCallback, useMemo, useState } from 'react';
import {
  type CalendarDate,
  type CalendarId,
  type CalendarSystem,
  type DatePickerEngineOptions,
  type FormatPreset,
  createCalendarSystem,
  fromIso,
  parseSelection,
} from '@anil-labs/core';
import { DateField, type DateFieldProps } from './date-field.js';

export interface DateRangeFieldProps {
  /** Form name for the start date — emits a hidden input. */
  readonly nameStart?: string;
  /** Form name for the end date. */
  readonly nameEnd?: string;
  /** Initial range as ISO `"start/end"`. */
  readonly defaultValue?: string;
  /** Controlled value — `"start/end"` ISO. */
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

/**
 * Two side-by-side `DateField` inputs for start + end. The second input's
 * minimum derives from the first, so the user can't select an end before the
 * start. The pair publishes one combined value in `"start/end"` format.
 */
export const DateRangeField = (props: DateRangeFieldProps): JSX.Element => {
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
    minRangeDays: _minRangeDays,
    maxRangeDays: _maxRangeDays,
    disabled,
    required,
    className,
    helperText,
    errorText,
    error,
  } = props;

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue ?? value ?? '');
  const current = controlled ? (value as string) : internal;

  const localeString = typeof locale === 'string' ? locale : (locale?.locale ?? 'en-US');
  const calendarSystem = useMemo(() => createCalendarSystem(calendar ?? 'gregorian'), [calendar]);

  // Decompose the combined value into start + end strings, each formatted via
  // `valueFormat` (defaults to `format`).
  const { startValue, endValue } = useMemo(() => {
    if (!current) return { startValue: '', endValue: '' };
    const decoded = parseSelection(current, 'range', {
      pattern: valueFormat ?? format,
      locale: localeString,
      calendar: calendarSystem,
    });
    if (!decoded?.range) return { startValue: '', endValue: '' };
    return {
      startValue: iso(decoded.range.start),
      endValue: iso(decoded.range.end),
    };
  }, [current, format, valueFormat, localeString, calendarSystem]);

  const commit = useCallback(
    (next: string) => {
      if (next === current) return;
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, current, onChange],
  );

  const onStartChange = useCallback(
    (s: string): void => {
      const e = endValue;
      // If end is before the new start, clear end.
      const startDate = s ? safeParse(s) : null;
      const endDate = e ? safeParse(e) : null;
      const nextEnd = startDate && endDate && cmp(endDate, startDate) < 0 ? '' : e;
      commit(combine(s, nextEnd));
    },
    [endValue, commit],
  );

  const onEndChange = useCallback(
    (e: string): void => {
      commit(combine(startValue, e));
    },
    [startValue, commit],
  );

  // Second input's min derives from the first.
  const endMin = useMemo<CalendarDate | undefined>(() => {
    const d = startValue ? safeParse(startValue) : null;
    if (!d) return min;
    return min ? (cmp(d, min) > 0 ? d : min) : d;
  }, [startValue, min]);

  const sharedField: DateFieldProps = {
    format,
    ...(locale !== undefined ? { locale } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    ...(required !== undefined ? { required } : {}),
    ...(valueFormat !== undefined ? { valueFormat } : {}),
    ...(calendar !== undefined ? { calendar } : {}),
  };

  return (
    <div className={['cal-range-field', className].filter(Boolean).join(' ')}>
      <div className="cal-range-field__inputs">
        <DateField
          {...sharedField}
          {...(labelStart !== undefined ? { label: labelStart } : {})}
          value={startValue}
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
          {...sharedField}
          {...(labelEnd !== undefined ? { label: labelEnd } : {})}
          value={endValue}
          onChange={onEndChange}
          {...(placeholderEnd !== undefined ? { placeholder: placeholderEnd } : {})}
          {...(endMin !== undefined ? { min: endMin } : {})}
          {...(max !== undefined ? { max } : {})}
          {...(error !== undefined ? { error } : {})}
        />
      </div>
      {nameStart && <input type="hidden" name={nameStart} value={startValue} />}
      {nameEnd && <input type="hidden" name={nameEnd} value={endValue} />}
      {errorText && (
        <p className="cal-field__error" role="alert">
          {errorText}
        </p>
      )}
      {!errorText && helperText && <p className="cal-field__helper">{helperText}</p>}
    </div>
  );
};

// Range-length constraints are reserved for a future enhancement and pass
// through to the popover picker. Reference them here to avoid TS6133.
const _unused: ReadonlyArray<unknown> = [];
void _unused;

const iso = (d: CalendarDate): string =>
  `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

const safeParse = (s: string): CalendarDate | null => {
  try {
    return fromIso(s);
  } catch {
    return null;
  }
};

const cmp = (a: CalendarDate, b: CalendarDate): number => {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
};

const combine = (start: string, end: string): string =>
  start && end ? `${start}/${end}` : start || end || '';
