# @anil-labs/calendar-solid

Solid adapter for [`@anil-labs/calendar-core`](https://github.com/anilkumarthakur60/calender/tree/main/packages/core) — a headless, framework-agnostic calendar/date-picker engine. Engine state is mirrored into a fine-grained signal; every commit pushes a new frozen object so identity-based reactivity is honoured.

## Install

```sh
npm install @anil-labs/calendar-solid
# optional pre-built theme
npm install @anil-labs/calendar-styles
```

## Usage

```tsx
import { For } from 'solid-js';
import { createDatePicker } from '@anil-labs/calendar-solid';
import '@anil-labs/calendar-styles';

const Picker = () => {
  const { engine, state } = createDatePicker({ mode: 'range', locale: 'en-GB' });

  return (
    <div class="cal-picker">
      <For each={state().grid.weeks}>
        {week => (
          <For each={week}>
            {cell => (
              <button
                class="cal-picker__cell"
                data-outside={!cell.inCurrentMonth || undefined}
                data-today={cell.isToday || undefined}
                onClick={() => engine.select(cell.date)}
              >
                {engine.formatter.formatDay(cell.date)}
              </button>
            )}
          </For>
        )}
      </For>
    </div>
  );
};
```

`createDatePicker(options)` takes any `DatePickerEngineOptions` from `@anil-labs/calendar-core` (`mode`, `min`, `max`, `locale`, `disabledWeekdays`, `withTime`, …) and returns:

| Field    | Type                    | Description                                         |
| -------- | ----------------------- | --------------------------------------------------- |
| `engine` | `DatePickerEngine`      | Full engine API — `select`, `handleKey`, `on`, …    |
| `state`  | `Accessor<EngineState>` | Reactive signal holding the immutable engine state. |

The subscription is cleaned up automatically via `onCleanup`. All core types are re-exported, so `@anil-labs/calendar-solid` is the only import you need.

## License

MIT
