# Format & parsing

`@calender/core` ships a token-based formatter and parser. Both calendar-aware,
both used by every adapter.

## Tokens

| Token  | Meaning              | Example  |
| ------ | -------------------- | -------- |
| `yyyy` | 4-digit year         | `2025`   |
| `yy`   | 2-digit year         | `25`     |
| `MMMM` | Long month name      | `April`  |
| `MMM`  | Short month name     | `Apr`    |
| `MM`   | 2-digit month        | `04`     |
| `M`    | 1-2 digit month      | `4`      |
| `dd`   | 2-digit day          | `07`     |
| `d`    | 1-2 digit day        | `7`      |
| `EEEE` | Long weekday         | `Monday` |
| `EEE`  | Short weekday        | `Mon`    |
| `HH`   | 2-digit hour (24h)   | `14`     |
| `H`    | 1-2 digit hour (24h) | `14`     |
| `hh`   | 2-digit hour (12h)   | `02`     |
| `h`    | 1-2 digit hour (12h) | `2`      |
| `mm`   | 2-digit minute       | `05`     |
| `m`    | 1-2 digit minute     | `5`      |
| `ss`   | 2-digit second       | `09`     |
| `s`    | 1-2 digit second     | `9`      |
| `a`    | `AM` or `PM`         | `PM`     |

Anything not a token is taken literally — spaces, slashes, commas, words.

```ts
import { formatWithPattern, createCalendarDate } from '@calender/core';

const d = createCalendarDate(2025, 4, 7);
formatWithPattern(d, 'yyyy-MM-dd'); // "2025-04-07"
formatWithPattern(d, 'MMMM d, yyyy'); // "April 7, 2025"
formatWithPattern(d, 'EEE MMM d', 'en-US'); // "Mon Apr 7"
formatWithPattern(d, 'dd/MM/yyyy'); // "07/04/2025"
```

## Presets

Use a string ID instead of writing tokens:

| Preset   | Pattern        |
| -------- | -------------- |
| `iso`    | `yyyy-MM-dd`   |
| `us`     | `MM/dd/yyyy`   |
| `eu`     | `dd/MM/yyyy`   |
| `short`  | `M/d/yyyy`     |
| `medium` | `MMM d, yyyy`  |
| `long`   | `MMMM d, yyyy` |

```ts
<DateField format="medium" />  // "Apr 7, 2025"
<DateField format="us" />      // "04/07/2025"
```

## DateField — display vs storage

`DateField` has two format props:

- `format` — what the user **sees** in the input
- `valueFormat` — the format of the controlled `value` and `onChange` string (defaults to `format`)

Useful when you want a human-friendly display but ISO storage:

```tsx
const [iso, setIso] = useState('2025-04-15');

<DateField
  format="MMM d, yyyy" // user sees "Apr 15, 2025"
  valueFormat="iso" // you get "2025-04-15"
  value={iso}
  onChange={setIso}
/>;
```

<div class="docs-demo">
  <calender-input format="MMM d, yyyy" value-format="iso" value="2025-04-15"></calender-input>
</div>

## Parsing

Symmetric: `parseWithPattern(input, pattern, locale, calendar)`.

```ts
parseWithPattern('Apr 7, 2025', 'MMM d, yyyy'); // { year: 2025, month: 4, day: 7 }
parseWithPattern('07/04/2025', 'dd/MM/yyyy'); // EU
parseWithPattern('04/07/2025', 'us'); // US
```

`DateField`'s blur handler parses against `format` first, then `valueFormat`, so
the user can type either shape.

## Calendar-aware

When the calendar system is BS, month names + numbers automatically pick up the
right ones:

```ts
import { BikramSambatCalendar } from '@calender/core';

const bs = new BikramSambatCalendar();
formatWithPattern({ year: 2080, month: 1, day: 15 }, 'MMMM d, yyyy', 'en-US', bs);
// → "Baishakh 15, 2080"

formatWithPattern({ year: 2080, month: 1, day: 15 }, 'MMMM d, yyyy', 'ne-NP', bs);
// → "बैशाख १५, २०८०"
```
