# Calendar systems (AD / BS)

The engine operates in **Gregorian (AD)** by default. To use **Bikram Sambat
(BS / Nepali)**, pass the `calendar` option.

## Use BS

```ts
const engine = new DatePickerEngine({
  calendar: 'bikram-sambat',
  locale: 'ne-NP', // Devanagari numerals
  initialFocused: { year: 2080, month: 1, day: 15 }, // BS Baishakh 15
});
```

Or directly in the markup:

::: code-group

```html [HTML]
<calender-picker calendar="bikram-sambat" locale="ne-NP"></calender-picker>
```

```tsx [React]
<DatePicker calendar="bikram-sambat" locale="ne-NP" headerSelectors />
```

```vue [Vue]
<DatePicker calendar="bikram-sambat" locale="ne-NP" :header-selectors="true" />
```

:::

<div class="docs-demo-row">
  <div>
    <p class="docs-demo-label">English transliteration</p>
    <calender-picker calendar="bikram-sambat" locale="en-US" header-selectors></calender-picker>
  </div>
  <div>
    <p class="docs-demo-label">Nepali Devanagari</p>
    <calender-picker calendar="bikram-sambat" locale="ne-NP" header-selectors></calender-picker>
  </div>
</div>

The month names automatically render in the correct script:

- `en-US` → Baishakh, Jestha, Ashar, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra
- `ne-NP` → बैशाख, जेठ, असार, साउन, भदौ, असोज, कात्तिक, मंसिर, पुष, माघ, फागुन, चैत्र

Day digits, year digits, and any token-formatted output use the locale's
numeral system (`२०८०` instead of `2080` for Devanagari).

## Conversion utilities

```ts
import { BikramSambatCalendar } from '@anil-labs/core';

const bs = new BikramSambatCalendar();

bs.toGregorian({ year: 2080, month: 1, day: 1 }); // { year: 2023, month: 4, day: 14 }
bs.fromGregorian({ year: 2024, month: 12, day: 31 });
bs.daysInMonth(2080, 9); // 29 (varies per year)
bs.weekday({ year: 2080, month: 1, day: 1 }); // 0-6 (US weekday)
```

## Supported range

The shipped lookup table covers **BS 1970 to BS 2100** (≈ 1913–2043 AD),
anchored at BS 1970-01-01 ↔ AD 1913-04-13. The table is verified against a
known-correct reference converter across every date in the range, so
conversions are exact for current and near-future dates. (BS 2087–2088, AD
≈ 2030, carry a one-day boundary quirk inherited from the reference; no
authoritative Patro data exists that far out.) For production use that needs
pixel-perfect agreement with a specific year's Patro, supply your own table
via a custom `CalendarSystem` (see below).

## Adding your own calendar

`CalendarSystem` is the abstraction. Implement it for any calendar — Hijri,
Buddhist, Persian — and pass an instance via `calendar`:

```ts
import { type CalendarSystem, DatePickerEngine } from '@anil-labs/core';

class MyCalendar implements CalendarSystem {
  readonly id = 'gregorian' as const;
  readonly displayName = 'My Calendar';
  readonly monthsInYear = 12;
  daysInMonth(year, month) {
    /* … */
  }
  addDays(date, n) {
    /* … */
  }
  // … plus addMonths, addYears, weekday, today, toGregorian, fromGregorian,
  //    monthName, formatDay, toIso, compare, isValidDate
}

const engine = new DatePickerEngine({ calendar: new MyCalendar() });
```

The engine, grid, formatter, and pattern engine all flow through this — no
other code needs to change.
