# Solid

```bash
npm install @anil-labs/solid @anil-labs/styles
```

```tsx
import '@anil-labs/styles';
import { createDatePicker } from '@anil-labs/solid';
import { For } from 'solid-js';
import { isSameDay } from '@anil-labs/core';

export const App = () => {
  const { engine, state } = createDatePicker({ mode: 'single', locale: 'en-GB' });

  return (
    <div class="cal-picker" role="group">
      <div class="cal-picker__header">
        <button class="cal-picker__nav" onClick={() => engine.pagePrev()}>
          ‹
        </button>
        <span class="cal-picker__title">{engine.formatter.formatMonthYear(state().focused)}</span>
        <button class="cal-picker__nav" onClick={() => engine.pageNext()}>
          ›
        </button>
      </div>
      <div class="cal-picker__grid" role="grid">
        <For each={state().grid.weekdayHeaders}>
          {w => (
            <div class="cal-picker__weekday" role="columnheader">
              {engine.formatter.formatWeekday(w, 'short')}
            </div>
          )}
        </For>
        <For each={state().grid.weeks.flat()}>
          {cell => (
            <button
              class="cal-picker__cell"
              attr:data-outside={!cell.inCurrentMonth ? 'true' : undefined}
              attr:data-today={cell.isToday ? 'true' : undefined}
              attr:data-selected={engine.isSelected(cell.date) ? 'true' : undefined}
              onClick={() => engine.select(cell.date)}
            >
              {engine.formatter.formatDay(cell.date)}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
```

## API

```ts
const { engine, state } = createDatePicker(options);
```

- `engine` — the `DatePickerEngine` instance.
- `state` — a Solid `Accessor<EngineState>` (call `state()` to read; reactive
  by default).

The Solid adapter uses `createSignal` internally; subscribing to engine
`change` events is handled for you, and `onCleanup` releases the listener
when the component unmounts.

## Features

Every engine feature is available via the options object — range hover preview,
multi-month, week numbers, highlights, time picker, BS calendar, presets, etc.
The rendering is yours, the state machine is shared.

## Live example

<div class="docs-demo">
  <calender-picker mode="single"></calender-picker>
</div>
