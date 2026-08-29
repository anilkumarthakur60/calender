# Cookbook

Real-world patterns. Each recipe is a complete snippet you can paste into
your app.

## 1. Booking range  "from / to" with a minimum stay

A hotel-style booking input where the user must book at least 2 nights and
no more than 30.

```tsx
import { DateRangeField } from '@anil-labs/calendar-react';
import { createCalendarDate } from '@anil-labs/calendar-core';

const [range, setRange] = useState('');

<DateRangeField
  labelStart="Check-in"
  labelEnd="Check-out"
  value={range}
  onChange={setRange}
  min={createCalendarDate(2025, 1, 1)}
  minRangeDays={2}
  maxRangeDays={30}
/>;
```

The second input's `min` automatically follows the first  selecting Apr 15
as check-in disables Apr 14 and earlier in the check-out picker.

## 2. Age verification  only let users 18+ submit

Compute the boundary date once, pass as `max`.

```tsx
import { DateField } from '@anil-labs/calendar-react';
import { createCalendarDate, addYears } from '@anil-labs/calendar-core';

const today = new Date();
const eighteenYearsAgo = createCalendarDate(
  today.getFullYear() - 18,
  today.getMonth() + 1,
  today.getDate(),
);

<DateField
  label="Date of birth"
  max={eighteenYearsAgo}
  errorText={parsed && cmp(parsed, eighteenYearsAgo) > 0 ? 'Must be 18 or older' : undefined}
/>;
```

## 3. Fiscal-year preset (Apr–Mar)

Custom preset that selects the current FY.

```tsx
import { DatePicker, type DatePreset, createCalendarDate } from '@anil-labs/calendar-react';

const fy: DatePreset = {
  id: 'fy',
  label: 'This FY',
  apply: e => {
    const t = e.calendar.today();
    const fyStart =
      t.month >= 4 ? createCalendarDate(t.year, 4, 1) : createCalendarDate(t.year - 1, 4, 1);
    const fyEnd =
      t.month >= 4 ? createCalendarDate(t.year + 1, 3, 31) : createCalendarDate(t.year, 3, 31);
    e.clearSelection();
    e.select(fyStart);
    e.select(fyEnd);
  },
};

<DatePicker mode="range" presets={['last7days', fy, 'clear']} />;
```

## 4. Highlight holidays from `@anil-labs/calendar-core/holidays`

```tsx
import { DatePicker, usHolidays } from '@anil-labs/calendar-react';

const year = new Date().getFullYear();
const holidays = [...usHolidays(year), ...usHolidays(year + 1)];

<DatePicker highlights={holidays} />;
```

Dots appear under holiday dates with tooltips ("Christmas", "Thanksgiving", …).

## 5. Disable booked dates (load from API)

```tsx
const bookedDates = useBookedDates(); // e.g. SWR / react-query

<DatePicker
  mode="range"
  disabledDates={bookedDates.map(d => fromIso(d))}
  presets={['today', 'last7days', 'clear']}
/>;
```

## 6. Persist a value to a URL search param

```tsx
import { useSearchParams } from 'next/navigation';

const params = useSearchParams();
const [date, setDate] = useState(params.get('date') ?? '');

<DateField
  value={date}
  onChange={v => {
    setDate(v);
    const url = new URL(window.location.href);
    if (v) url.searchParams.set('date', v);
    else url.searchParams.delete('date');
    window.history.replaceState({}, '', url);
  }}
/>;
```

## 7. Calendar-aware highlights for BS

Same `highlights` API, BS dates:

```tsx
import { DatePicker, createCalendarDate } from '@anil-labs/calendar-react';

<DatePicker
  calendar="bikram-sambat"
  locale="ne-NP"
  highlights={[
    { date: createCalendarDate(2080, 1, 1), label: 'Nepali New Year', color: '#dc2626' },
    { date: createCalendarDate(2080, 6, 15), label: 'Dashain' },
  ]}
/>;
```

## 8. Custom day cell  show prices in a date picker

```tsx
import { DatePicker } from '@anil-labs/calendar-react';
import { toIso } from '@anil-labs/calendar-core';

const prices = { '2025-04-15': '$120', '2025-04-16': '$95' };

<DatePicker
  renderCell={({ cell, defaultLabel, selected }) => (
    <div className="cell-with-price">
      <span>{defaultLabel}</span>
      <small>{prices[toIso(cell.date)] ?? ''}</small>
    </div>
  )}
/>;
```

## 9. React-hook-form with validation

```tsx
<Controller
  control={control}
  name="checkIn"
  rules={{
    required: 'Required',
    validate: v => {
      const d = parseDate(v);
      if (!d) return 'Invalid date';
      if (isBefore(d, todayCalendarDate())) return 'Must be in the future';
      return true;
    },
  }}
  render={({ field, fieldState }) => (
    <DateField
      label="Check-in"
      value={field.value}
      onChange={field.onChange}
      errorText={fieldState.error?.message}
      required
    />
  )}
/>
```

## 10. Open the picker programmatically (React)

```tsx
const [open, setOpen] = useState(false);
const fieldRef = useRef<HTMLInputElement>(null);

<DateField
  inputProps={{ ref: fieldRef }}
  // …
/>
<button onClick={() => fieldRef.current?.focus()}>Pick a date</button>
```
