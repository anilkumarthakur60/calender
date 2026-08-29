# Linked pickers (departure / arrival)

A common pattern: two date inputs where the second's earliest allowed value
depends on the first. Built-in support via `<DateRangeField>` (React).

## DateRangeField

Two `DateField` inputs, paired. The second's `min` automatically follows the
first  selecting Apr 15 as the start disables Apr 14 and earlier in the end
field.

```tsx
import { DateRangeField } from '@anil-labs/calendar-react';
import { createCalendarDate } from '@anil-labs/calendar-core';

const [value, setValue] = useState(''); // "2025-04-15/2025-04-20"

<DateRangeField
  labelStart="Departure"
  labelEnd="Return"
  value={value}
  onChange={setValue}
  min={createCalendarDate(2025, 1, 1)}
  format="MMM d, yyyy"
  valueFormat="iso"
/>;
```

The `value` is published in `"start/end"` ISO form, regardless of the
display format.

## Manual linking (any framework)

If you need linked **single-date** pickers (e.g. two completely separate
fields that just share a constraint), wire it manually:

```tsx
const [start, setStart] = useState('');
const [end, setEnd] = useState('');

const startDate = start ? fromIso(start) : null;

<DateField label="Departure" value={start} onChange={setStart} />
<DateField
  label="Return"
  value={end}
  onChange={setEnd}
  min={startDate ?? undefined}
/>
```

## Form submission

`DateRangeField` publishes one combined `value` and optionally **two** hidden
inputs (`nameStart`, `nameEnd`) so your form payload has both halves:

```tsx
<form>
  <DateRangeField nameStart="checkIn" nameEnd="checkOut" defaultValue="2025-04-15/2025-04-20" />
  <button type="submit">Search</button>
</form>
```

`FormData(form)` yields `{ checkIn: '2025-04-15', checkOut: '2025-04-20' }`.

## Validation

Combine with `errorText` to surface cross-field rules:

```tsx
const [value, setValue] = useState('');
const error = (() => {
  const decoded = parseSelection(value, 'range');
  if (!decoded?.range) return undefined;
  const days = daysBetween(decoded.range.start, decoded.range.end);
  if (days < 1) return 'Minimum stay 1 night';
  if (days > 30) return 'Maximum stay 30 nights';
  return undefined;
})();

<DateRangeField value={value} onChange={setValue} errorText={error} />;
```

## Three or more linked pickers

For multi-leg travel (flight 1, flight 2, flight 3), apply the same pattern
recursively  each subsequent picker's `min` is the previous one's commit
value.

```tsx
const [legs, setLegs] = useState(['', '', '']);

{
  legs.map((leg, i) => {
    const previousIso = legs[i - 1];
    const previous = previousIso ? fromIso(previousIso) : null;
    return (
      <DateField
        key={i}
        label={`Leg ${i + 1}`}
        value={leg}
        onChange={v => setLegs(prev => prev.map((p, j) => (j === i ? v : p)))}
        {...(previous ? { min: previous } : {})}
      />
    );
  });
}
```
