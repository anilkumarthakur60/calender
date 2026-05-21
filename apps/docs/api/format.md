# Format engine

```ts
import {
  formatWithPattern,
  parseWithPattern,
  parseDateTimeWithPattern,
  formatSelection,
  parseSelection,
  resolvePattern,
  type FormatPreset,
  type TimeOfDay,
  type ParsedDateTime,
} from '@calender/core';
```

## formatWithPattern

```ts
formatWithPattern(
  date: CalendarDate,
  pattern: string | FormatPreset,
  locale?: string,           // default 'en-US'
  calendar?: CalendarSystem, // default Gregorian
  time?: TimeOfDay | null,   // for HH/mm/ss/a tokens
): string
```

Tokens (longest match wins):

| Token | Output                            |
| ----- | --------------------------------- |
| `yyyy`| 4-digit year                      |
| `yy`  | 2-digit year                      |
| `MMMM`| Long month name (calendar-aware)  |
| `MMM` | Short month name                  |
| `MM`  | 2-digit month                     |
| `M`   | 1-2 digit month                   |
| `dd`  | 2-digit day                       |
| `d`   | 1-2 digit day                     |
| `EEEE`| Long weekday                      |
| `EEE` | Short weekday                     |
| `HH`  | 2-digit hour (24h)                |
| `H`   | 1-2 digit hour (24h)              |
| `hh`  | 2-digit hour (12h)                |
| `h`   | 1-2 digit hour (12h)              |
| `mm`  | 2-digit minute                    |
| `m`   | 1-2 digit minute                  |
| `ss`  | 2-digit second                    |
| `s`   | 1-2 digit second                  |
| `a`   | `AM` / `PM`                       |

## Presets

```ts
type FormatPreset = 'iso' | 'us' | 'eu' | 'short' | 'medium' | 'long';
```

| Preset   | Resolved pattern  |
| -------- | ----------------- |
| `iso`    | `yyyy-MM-dd`      |
| `us`     | `MM/dd/yyyy`      |
| `eu`     | `dd/MM/yyyy`      |
| `short`  | `M/d/yyyy`        |
| `medium` | `MMM d, yyyy`     |
| `long`   | `MMMM d, yyyy`    |

## parseWithPattern

Symmetric to formatting:

```ts
parseWithPattern(
  input: string,
  pattern: string | FormatPreset,
  locale?: string,
  calendar?: CalendarSystem,
): CalendarDate | null
```

Returns `null` on malformed input or invalid date.

## parseDateTimeWithPattern

Same as `parseWithPattern` but also recovers the time portion:

```ts
parseDateTimeWithPattern(
  '2025-04-15 14:30',
  'yyyy-MM-dd HH:mm',
);
// → { date: { year, month, day }, time: { hour, minute, second } }
```

## formatSelection / parseSelection

Operate on a whole `SelectionValue`, handling range separators and multi-CSV
automatically.

```ts
formatSelection(selection, {
  pattern: 'medium',
  locale: 'en-GB',
  calendar: someCalendar,
  rangeSeparator: ' – ',   // default depends on pattern
  multiSeparator: '; ',
  time: { hour: 14, minute: 30, second: 0 },
});

parseSelection('Apr 1, 2025 – Apr 15, 2025', 'range', { pattern: 'medium' });
// → { mode: 'range', range: { start, end } }
```

Default separators:
- ISO format → `/` (range), `,` (multi) — compact, round-trips cleanly
- Other formats → ` – ` (range), `; ` (multi) — avoids comma collision with
  formatted output like `"Apr 15, 2025"`
