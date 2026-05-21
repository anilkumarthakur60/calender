# Form integration

For real form usage you usually want a **text input + popover calendar**, not
the bare grid. We ship that as `DateField` (React / Vue) and `<calender-input>`
(framework-free). Both are **form-associated** and submit a normalised value
via `name=`.

## Plain HTML form

```html
<form>
  <label>
    Booking date
    <calender-input name="bookingDate" mode="single" value="2025-04-15"></calender-input>
  </label>
  <button type="submit">Submit</button>
</form>
```

`FormData(form).get('bookingDate')` returns `"2025-04-15"`. Range becomes
`"start/end"`, multi becomes a CSV.

<div class="docs-demo">
  <calender-input name="bookingDate" mode="single" value="2025-04-15"></calender-input>
</div>

The user can also **type** into the input. On blur, the text is lenient-parsed
and normalised back to the format you specified.

## React — controlled

```tsx
import { DateField } from '@calender/react';

const [date, setDate] = useState('2025-04-15');

<DateField value={date} onChange={setDate} mode="single" />
```

## React — react-hook-form

```tsx
import { Controller, useForm } from 'react-hook-form';
import { DateField } from '@calender/react';

const { control, handleSubmit } = useForm({ defaultValues: { dob: '' } });

<form onSubmit={handleSubmit(data => submit(data))}>
  <Controller
    control={control}
    name="dob"
    rules={{ required: 'Pick a date' }}
    render={({ field }) => <DateField value={field.value} onChange={field.onChange} />}
  />
  <button type="submit">Submit</button>
</form>
```

## React — native form submit

```tsx
<form
  onSubmit={e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    submit(data.get('bookingDate'));
  }}
>
  <DateField name="bookingDate" defaultValue="2025-04-15" />
  <button type="submit">Submit</button>
</form>
```

## Vue — v-model

```vue
<script setup>
import { ref } from 'vue';
import { DateField } from '@calender/vue';

const date = ref('2025-04-15');
</script>

<template>
  <DateField v-model="date" mode="single" />
</template>
```

## Vue — form submit (no v-model)

```vue
<form @submit.prevent="onSubmit">
  <DateField name="bookingDate" mode="single" />
  <button type="submit">Submit</button>
</form>
```

## Common props

| Prop                       | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| `name`                     | Native form input name. Emits a hidden `<input>`.                    |
| `value` / `v-model`        | Controlled value.                                                    |
| `defaultValue` (React)     | Initial value when uncontrolled.                                     |
| `onChange` / `@change`     | Fires whenever the value commits (pick OR parse-on-blur).            |
| `format`                   | Display format. `'iso'` (default), `'us'`, `'eu'`, `'medium'`, `'long'`, `'short'`, or a token pattern. |
| `valueFormat`              | Storage format for the controlled value. Defaults to `format`. Pass `'iso'` to store ISO with a human display format. |
| `mode`                     | `'single'` (default), `'range'`, `'multi'`.                          |
| `min` / `max`              | `CalendarDate` bounds.                                               |
| `withTime`                 | Show an inline time picker beneath the grid.                         |
| `locale`                   | BCP-47 tag, e.g. `'en-GB'`, `'ne-NP'`.                               |
| `calendar`                 | `'gregorian'` (default) or `'bikram-sambat'`.                        |
| `placeholder`              | Defaults to a hint matching `format` (`YYYY-MM-DD`, etc.).            |
| `disabled`                 | Disable both input and trigger.                                      |
| `disabledWeekdays`         | E.g. `[0, 6]` to disable Sun/Sat.                                    |
| `inputProps` (React)       | Forwarded to the underlying `<input>`.                               |
