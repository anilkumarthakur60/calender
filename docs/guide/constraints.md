# Constraints

Multiple constraint shapes, layered through `CompositeConstraint`. `engine.isDisabled(date)` returns true when any constraint rejects.

## Min / max

```html
<calender-picker min="2025-04-01" max="2025-06-30"></calender-picker>
```

<div class="docs-demo">
  <calender-picker min="2025-04-01" max="2025-06-30"></calender-picker>
</div>

## Disabled weekdays

```html
<calender-picker disabled-weekdays="0,6"></calender-picker>
```

`0` = Sunday, `6` = Saturday (US convention).

## Disabled specific dates

```html
<calender-picker disabled-dates="2025-12-25, 2025-12-26, 2026-01-01"></calender-picker>
```

::: code-group

```tsx [React]
<DatePicker
  disabledDates={[
    createCalendarDate(2025, 12, 25),
    createCalendarDate(2025, 12, 26),
    createCalendarDate(2026, 1, 1),
  ]}
/>
```

:::

## Custom predicate

```ts
import { FilterConstraint } from '@anil-labs/calendar-core';

const blockHolidays = new FilterConstraint(d => !isHoliday(d), 'holiday');

new DatePickerEngine({
  extraConstraints: [blockHolidays],
});
```

## Range length

In range mode only: cap the number of days a range can span.

```html
<calender-picker mode="range" min-range-days="3" max-range-days="14"></calender-picker>
```

After the user clicks an anchor, any date outside the allowed window becomes
unclickable. The engine method that powers this is `engine.isPickable(date)`
(use that in custom renderers).

<div class="docs-demo">
  <calender-picker mode="range" min-range-days="3" max-range-days="14"></calender-picker>
</div>

## Constraint API

```ts
interface DateConstraint {
  evaluate(date: CalendarDate): string | null; // null = pickable; string = reason
}
```

Implement and pass via `extraConstraints`:

```ts
class BusinessDays implements DateConstraint {
  evaluate(date) {
    const weekday = new GregorianCalendar().weekday(date);
    return weekday === 0 || weekday === 6 ? 'weekend' : null;
  }
}
```
