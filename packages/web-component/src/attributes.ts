import {
  type CalendarDate,
  type CalendarId,
  type DateHighlight,
  type DatePickerEngineOptions,
  type PresetSpec,
  type SelectionGranularity,
  type SelectionMode,
  fromIso,
} from '@anil-labs/core';

/**
 * Parse an ISO date coming from an attribute. Malformed values are ignored
 * (with a console warning) instead of throwing, so a bad `min`/`max`/
 * `disabled-dates` attribute never bricks the element.
 */
const safeFromIso = (value: string, attr: string): CalendarDate | undefined => {
  try {
    return fromIso(value);
  } catch {
    console.warn(`[calender] ignoring invalid ${attr} attribute value: "${value}"`);
    return undefined;
  }
};

/**
 * Parse a complete {@link DatePickerEngineOptions} from an HTMLElement's
 * attributes. Shared by `<calender-picker>` and `<calender-input>` so both
 * support the same surface.
 */
export const readEngineOptionsFromAttributes = (el: HTMLElement): DatePickerEngineOptions => {
  const get = (name: string): string | null => el.getAttribute(name);
  const has = (name: string): boolean => el.hasAttribute(name);
  const num = (name: string): number | undefined => {
    const v = get(name);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const mode = (get('mode') as SelectionMode | null) ?? undefined;
  const minAttr = get('min');
  const maxAttr = get('max');
  const localeAttr = get('locale');
  const calendarAttr = get('calendar') as CalendarId | null;
  const granularity = get('granularity') as SelectionGranularity | null;

  const dwAttr = get('disabled-weekdays');
  const ddAttr = get('disabled-dates');
  const yearRangeAttr = get('year-range');
  const highlightsAttr = get('highlights');

  const min = minAttr ? safeFromIso(minAttr, 'min') : undefined;
  const max = maxAttr ? safeFromIso(maxAttr, 'max') : undefined;
  const disabledDates = ddAttr
    ? ddAttr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => safeFromIso(s, 'disabled-dates'))
        .filter((d): d is CalendarDate => d !== undefined)
    : undefined;

  const options: DatePickerEngineOptions = {
    ...(mode ? { mode } : {}),
    ...(min ? { min } : {}),
    ...(max ? { max } : {}),
    ...(localeAttr ? { locale: localeAttr } : {}),
    ...(calendarAttr ? { calendar: calendarAttr } : {}),
    ...(granularity ? { granularity } : {}),
    ...(num('months') !== undefined ? { months: num('months')! } : {}),
    ...(has('week-numbers') ? { weekNumbers: true } : {}),
    ...(num('min-range-days') !== undefined ? { minRangeDays: num('min-range-days')! } : {}),
    ...(num('max-range-days') !== undefined ? { maxRangeDays: num('max-range-days')! } : {}),
    ...(has('with-time') ? { withTime: true } : {}),
    ...(num('time-step') !== undefined ? { timeStep: num('time-step')! } : {}),
    ...(get('clock') === '12' ? { use12HourClock: true } : {}),
    ...(has('seconds') ? { showSeconds: true } : {}),
    ...(has('header-selectors') ? { headerSelectors: true } : {}),
    ...(yearRangeAttr ? parseYearRange(yearRangeAttr) : {}),
    ...(dwAttr
      ? {
          disabledWeekdays: dwAttr
            .split(',')
            .map(s => Number(s.trim()))
            .filter(Number.isFinite),
        }
      : {}),
    ...(disabledDates && disabledDates.length > 0 ? { disabledDates } : {}),
    ...(highlightsAttr ? parseHighlights(highlightsAttr) : {}),
  };

  return options;
};

const parseYearRange = (v: string): Partial<Pick<DatePickerEngineOptions, 'yearRange'>> => {
  const parts = v.split('-').map(s => Number(s.trim()));
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return { yearRange: [parts[0]!, parts[1]!] as [number, number] };
  }
  return {};
};

const parseHighlights = (v: string): Partial<Pick<DatePickerEngineOptions, 'highlights'>> => {
  // Format: "YYYY-MM-DD|color|label, YYYY-MM-DD|color|label"
  const items: DateHighlight[] = [];
  for (const raw of v.split(',')) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const [iso, color, label] = trimmed.split('|').map(s => s.trim());
    if (!iso) continue;
    try {
      const date = fromIso(iso);
      const item: DateHighlight = {
        date,
        ...(color ? { color } : {}),
        ...(label ? { label } : {}),
      };
      items.push(item);
    } catch {
      /* skip malformed entry */
    }
  }
  return items.length > 0 ? { highlights: items } : {};
};

/** Read the `presets="today,last7days,clear"` attribute. */
export const readPresetsFromAttribute = (
  el: HTMLElement,
): ReadonlyArray<PresetSpec> | undefined => {
  const v = el.getAttribute('presets');
  if (!v) return undefined;
  const parts = v
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? (parts as PresetSpec[]) : undefined;
};

/**
 * Attributes that are purely presentational — changing them must never
 * rebuild or reconfigure the engine (and therefore never wipe a selection).
 */
export const COSMETIC_ATTRS: ReadonlySet<string> = new Set(['theme', 'density']);

/** Standard attribute list that both elements observe. */
export const STANDARD_OBSERVED_ATTRS: ReadonlyArray<string> = [
  'mode',
  'min',
  'max',
  'value',
  'locale',
  'disabled-weekdays',
  'disabled-dates',
  'theme',
  'density',
  'calendar',
  'granularity',
  'months',
  'week-numbers',
  'min-range-days',
  'max-range-days',
  'with-time',
  'time-step',
  'clock',
  'seconds',
  'presets',
  'header-selectors',
  'year-range',
  'highlights',
];
