# React

```bash
npm install @anil-labs/calendar-react @anil-labs/calendar-styles
```

```tsx
import '@anil-labs/calendar-styles';
import { DatePicker } from '@anil-labs/calendar-react';

export default function App() {
  return <DatePicker mode="range" />;
}
```

## Components & hooks

### `<DatePicker />`

Renders the calendar grid (+ optional time row + footer). Accepts every engine
option as a prop.

```tsx
<DatePicker
  mode="range"
  months={2}
  headerSelectors
  weekNumbers
  presets={['today', 'last7days', 'thisMonth', 'clear']}
  highlights={[{ date: createCalendarDate(2025, 12, 25), color: '#dc2626', label: 'Christmas' }]}
  onSelect={d => console.log(d)}
  onChange={state => console.log(state)}
/>
```

### `<DateField />`

Text input + popover. Form-associated. Type or pick.

```tsx
<DateField value={iso} onChange={setIso} format="MMM d, yyyy" valueFormat="iso" />
```

### `useDatePicker(options)`

Headless hook  returns the engine + a reactive `state` (via
`useSyncExternalStore`). Useful when you want to render your own UI.

```tsx
import { useDatePicker } from '@anil-labs/calendar-react';

const { engine, state } = useDatePicker({ mode: 'single' });

return (
  <div>
    Focused: {state.focused.year}-{state.focused.month}-{state.focused.day}
    <button onClick={() => engine.pagePrev()}>Previous</button>
  </div>
);
```

## Props reference

`DatePicker` extends `DatePickerEngineOptions` and adds:

| Prop         | Type                           | Description                       |
| ------------ | ------------------------------ | --------------------------------- |
| `className`  | `string`                       | Forwarded to the root `<div>`     |
| `onSelect`   | `(date: CalendarDate) => void` | Fires when the user picks a date  |
| `onChange`   | `(state: EngineState) => void` | Fires on every state mutation     |
| `hideFooter` | `boolean`                      | Don't render the preset footer    |
| `presets`    | `ReadonlyArray<PresetSpec>`    | Preset chips. Default `['today']` |

`DateField` adds the form-input chrome on top of the picker. See
[Form integration](/guide/forms) for the full props table.

## Live example

<div class="docs-demo">
  <calender-picker mode="range" header-selectors months="2"></calender-picker>
</div>

The above is rendered via the Web Component for the docs site, but the React
adapter produces an identical UI through its own JSX.

## react-hook-form

`DateField` is fully controllable, so a `Controller` wrap-around just works:

```tsx
import { Controller, useForm } from 'react-hook-form';
import { DateField } from '@anil-labs/calendar-react';

const { control, handleSubmit } = useForm({ defaultValues: { dob: '' } });

<form onSubmit={handleSubmit(d => save(d))}>
  <Controller
    control={control}
    name="dob"
    rules={{ required: 'Pick a date' }}
    render={({ field }) => <DateField value={field.value} onChange={field.onChange} />}
  />
</form>;
```
