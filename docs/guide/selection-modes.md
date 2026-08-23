# Selection modes

Three built-in modes via the `mode` option.

## Single

The default. Each click replaces the selection.

<div class="docs-demo">
  <calender-picker mode="single"></calender-picker>
</div>

```html
<calender-picker mode="single"></calender-picker>
```

The selection value is `CalendarDate | null`.

## Range

Click an anchor, then click an end date. A continuous range band fills the
selection. While only the anchor is set, hover any date to preview the
tentative range.

<div class="docs-demo">
  <calender-picker mode="range" months="2"></calender-picker>
</div>

```html
<calender-picker mode="range" months="2"></calender-picker>
```

The selection value is `DateRange | null` (or the anchor while waiting for the
second click).

## Multi

Each click toggles a date in the array.

<div class="docs-demo">
  <calender-picker mode="multi"></calender-picker>
</div>

```html
<calender-picker mode="multi"></calender-picker>
```

The selection value is an array of `CalendarDate`.

## Range constraints

Limit how many days the user can span:

```html
<calender-picker mode="range" min-range-days="3" max-range-days="14"></calender-picker>
```

After the user clicks an anchor, any date outside the allowed window becomes
unclickable. Useful for hotel bookings (e.g. "1–30 nights").

<div class="docs-demo">
  <calender-picker mode="range" min-range-days="3" max-range-days="14"></calender-picker>
</div>

## Mode in code

```ts
import { DatePickerEngine } from '@anil-labs/calendar-core';

const engine = new DatePickerEngine({ mode: 'range' });

engine.select({ year: 2025, month: 4, day: 15 });
engine.select({ year: 2025, month: 4, day: 22 });

// state.selection is now:
// { mode: 'range', value: { start, end }, anchor }
```
