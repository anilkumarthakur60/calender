# DatePickerEngineOptions

Everything you can pass to `new DatePickerEngine(options)` or any adapter's
`<DatePicker>` component.

## Core

| Option              | Type                                | Default     | Description                                  |
| ------------------- | ----------------------------------- | ----------- | -------------------------------------------- |
| `mode`              | `'single' \| 'range' \| 'multi'`    | `'single'`  | Selection mode.                              |
| `initialFocused`    | `CalendarDate`                      | today       | Roving-focus start position.                 |
| `initialView`       | `'day' \| 'month' \| 'year' \| 'decade'` | derived | Starting view mode.                          |
| `granularity`       | `'day' \| 'month' \| 'year'`        | `'day'`     | What the user selects (terminal view).       |
| `min` / `max`       | `CalendarDate`                      | —           | Bounds (inclusive).                          |
| `disabledDates`     | `ReadonlyArray<CalendarDate>`       | `[]`        | Specific dates blocked.                      |
| `disabledWeekdays`  | `ReadonlyArray<number>`             | `[]`        | `0` = Sun, `6` = Sat.                        |
| `extraConstraints`  | `ReadonlyArray<DateConstraint>`     | `[]`        | Custom predicate constraints.                |
| `locale`            | `string \| Partial<LocaleConfig>`   | navigator   | BCP-47 tag.                                  |
| `calendar`          | `'gregorian' \| 'bikram-sambat' \| CalendarSystem` | `'gregorian'` | Calendar system. |
| `fixedWeeks`        | `boolean`                           | `true`      | Always emit 6 weeks for stable layout.       |
| `range`             | `RangeSelectionOptions`             | —           | `{ allowSingleDayRange }`.                   |
| `multi`             | `MultiSelectionOptions`             | —           | `{ max }`.                                   |

## Range constraints

| Option           | Type     | Description                                                       |
| ---------------- | -------- | ----------------------------------------------------------------- |
| `minRangeDays`   | `number` | Minimum days a range must span (inclusive).                       |
| `maxRangeDays`   | `number` | Maximum days a range may span (inclusive).                        |

## Visual

| Option            | Type                                 | Description                                |
| ----------------- | ------------------------------------ | ------------------------------------------ |
| `months`          | `number`                             | Render N months side-by-side. Default 1.   |
| `weekNumbers`     | `boolean`                            | Show ISO week-number column.               |
| `headerSelectors` | `boolean`                            | Replace title with month + year `<select>`.|
| `yearRange`       | `readonly [number, number]`          | Year dropdown span. Default focused ± 100. |
| `highlights`      | `ReadonlyArray<DateHighlight>`       | Per-date decorations.                      |

## Time

| Option            | Type                | Default | Description                          |
| ----------------- | ------------------- | ------- | ------------------------------------ |
| `withTime`        | `boolean`           | `false` | Show inline time picker.             |
| `timeStep`        | `number`            | `1`     | Minute step.                         |
| `use12HourClock`  | `boolean`           | `false` | 12-hour with AM/PM.                  |
| `showSeconds`     | `boolean`           | `false` | Show seconds field.                  |
| `initialTime`     | `{hour, minute, second?}` | `00:00:00` | Initial time.                |

## Locale

```ts
interface LocaleConfig {
  locale: string;                                       // BCP-47
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;            // 0=Sun..6=Sat
  direction: 'ltr' | 'rtl';                             // resolved from locale
  timeZone?: string;                                    // for "today" calc
}
```

Pass either a string (`'en-GB'`) or a `Partial<LocaleConfig>` to override pieces.
