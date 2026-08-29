# Presets

```ts
import { BUILTIN_PRESETS, resolvePreset, resolvePresets } from '@anil-labs/calendar-core';
```

## DatePreset

```ts
interface DatePreset {
  readonly id: string;
  readonly label: string;
  readonly apply: (engine: DatePickerEngine) => void;
}

type PresetSpec = string | DatePreset; // string IDs reference BUILTIN_PRESETS
```

## Built-ins

| ID           | Label        | Action                                     |
| ------------ | ------------ | ------------------------------------------ |
| `today`      | Today        | Select today (or range [today, today]).    |
| `yesterday`  | Yesterday    | Select yesterday.                          |
| `tomorrow`   | Tomorrow     | Select tomorrow.                           |
| `last7days`  | Last 7 days  | Range: [today−6, today].                   |
| `last30days` | Last 30 days | Range: [today−29, today].                  |
| `last90days` | Last 90 days | Range: [today−89, today].                  |
| `thisWeek`   | This week    | Range: current week, using locale's start. |
| `thisMonth`  | This month   | Range: full current month.                 |
| `lastMonth`  | Last month   | Range: full previous month.                |
| `thisYear`   | This year    | Range: full current year.                  |
| `clear`      | Clear        | Wipe the selection.                        |

## resolvePreset

```ts
resolvePreset('today');              // → DatePreset (built-in)
resolvePreset({ id: 'easter', label: 'Easter', apply: e => /* … */ });
```

Returns `null` for unknown string IDs.

## resolvePresets

Used internally to expand a `presets` prop into the rendered chips.

```ts
resolvePresets(['today', 'last7days', myCustomPreset]);
// → ReadonlyArray<DatePreset>
```

## Writing your own

```ts
import { type DatePreset, type DatePickerEngine, createCalendarDate } from '@anil-labs/calendar-core';

const Easter: DatePreset = {
  id: 'easter',
  label: 'Easter',
  apply: (engine: DatePickerEngine) => {
    engine.select(createCalendarDate(2025, 4, 20));
  },
};

<DatePicker presets={['today', Easter, 'clear']} />
```

The `apply` callback gets the engine  drive it however you like. Most range
presets follow this shape:

```ts
{
  id: 'fy',
  label: 'Financial year',
  apply: e => {
    const t = e.calendar.today();
    const start = { year: t.year, month: 4, day: 1 };
    const end   = { year: t.year + 1, month: 3, day: 31 };
    e.clearSelection();
    e.select(start);
    e.select(end);
  },
}
```
