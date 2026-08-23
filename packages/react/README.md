# @anil-labs/calendar-react

React 18+ adapter for [`@anil-labs/calendar-core`](https://github.com/anilkumarthakur60/calender/tree/main/packages/core) — a headless, framework-agnostic calendar/date-picker engine. Ships ready-made components (`DatePicker`, `DateField`, `DateRangeField`) plus a `useDatePicker` hook for fully custom UIs.

## Install

```sh
npm install @anil-labs/calendar-react
# optional pre-built theme
npm install @anil-labs/calendar-styles
```

## Components

```tsx
import { DatePicker, DateField, DateRangeField } from '@anil-labs/calendar-react';
import '@anil-labs/calendar-styles';

export const Demo = () => (
  <>
    <DatePicker
      mode="range"
      locale="en-GB"
      presets={['today']}
      onSelect={date => console.log('selected', date)}
      onChange={state => console.log('engine state', state)}
    />
    <DateField placeholder="DD/MM/YYYY" />
    <DateRangeField />
  </>
);
```

`DatePicker` accepts every `DatePickerEngineOptions` field from `@anil-labs/calendar-core` (`mode`, `min`, `max`, `locale`, `disabledWeekdays`, `withTime`, `weekNumbers`, …) plus:

| Prop         | Type                                 | Description                                                    |
| ------------ | ------------------------------------ | -------------------------------------------------------------- |
| `onSelect`   | `(date: CalendarDate) => void`       | Fires when a day is picked.                                    |
| `onChange`   | `(state: EngineState) => void`       | Fires on every engine state commit.                            |
| `presets`    | `PresetSpec[]`                       | Footer presets (built-in ids or `{ id, label, apply }`).       |
| `hideFooter` | `boolean`                            | Hide the preset footer.                                        |
| `renderCell` | `(ctx: DayCellContext) => ReactNode` | Replace day-cell content; the accessible button shell remains. |

## Headless hook

```tsx
import { useDatePicker } from '@anil-labs/calendar-react';

const Custom = () => {
  const { engine, state } = useDatePicker({ mode: 'single', locale: 'en-GB' });

  return (
    <div>
      {state.grid.weeks.map((week, i) => (
        <div key={i}>
          {week.map(cell => (
            <button key={cell.key} onClick={() => engine.select(cell.date)}>
              {engine.formatter.formatDay(cell.date)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
```

All core types (`CalendarDate`, `EngineState`, `DatePickerEngineOptions`, …) are re-exported, so `@anil-labs/calendar-react` is the only import you need.

## License

MIT
