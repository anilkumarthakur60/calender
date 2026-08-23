# DatePickerEngine

The pure-TS state machine. Every adapter wraps an instance of this class.

```ts
import { DatePickerEngine } from '@anil-labs/calendar-core';

const engine = new DatePickerEngine(options);
```

## Constructor

```ts
new DatePickerEngine(options?: DatePickerEngineOptions)
```

See [Options](/api/options) for the full options shape.

## Read-only API

| Property          | Type                     | Description                               |
| ----------------- | ------------------------ | ----------------------------------------- |
| `state`           | `EngineState`            | Current immutable snapshot.               |
| `locale`          | `LocaleConfig`           | Resolved locale, first-day-of-week, RTL.  |
| `formatter`       | `DateFormatter`          | Memoised Intl formatters.                 |
| `calendar`        | `CalendarSystem`         | Active calendar (Gregorian or BS).        |
| `granularity`     | `'day'\|'month'\|'year'` | Terminal selection view.                  |
| `months`          | `number`                 | Multi-month layout count.                 |
| `weekNumbers`     | `boolean`                |                                           |
| `headerSelectors` | `boolean`                |                                           |
| `withTime`        | `boolean`                |                                           |
| `timeStep`        | `number`                 |                                           |
| `use12HourClock`  | `boolean`                |                                           |
| `showSeconds`     | `boolean`                |                                           |
| `on`              | function                 | Event subscription. See **Events** below. |

## Predicates

```ts
engine.isDisabled(date: CalendarDate): boolean
engine.isPickable(date: CalendarDate): boolean   // disabled + range-length aware
engine.isSelected(date: CalendarDate): boolean
engine.reasonFor(date: CalendarDate): string | null
engine.getHighlight(date: CalendarDate): DateHighlight | undefined
engine.yearRange(): readonly [number, number]
```

## Commands

```ts
engine.open(): void
engine.close(reason?: 'cancel' | 'commit' | 'outside'): void
engine.toggle(): void

engine.focus(date: CalendarDate): void
engine.select(date: CalendarDate): void
engine.selectFocused(): void
engine.clearSelection(): void

engine.setHovered(date: CalendarDate | null): void   // range hover preview
engine.setTime(time: TimeOfDay | null): void
engine.setView(view: 'day' | 'month' | 'year' | 'decade'): void

engine.drillUp(): void
engine.drillDown(): void
engine.pickInView(date: CalendarDate): void           // smart click

engine.pagePrev(): void
engine.pageNext(): void

engine.setMonth(month: number): void                  // jump month, clamp day
engine.setYear(year: number): void                    // jump year, clamp day

engine.goToToday(): CalendarDate                      // focus only
engine.selectToday(): CalendarDate                    // focus + select

engine.handleKey(event: KeyboardEventLike): KeyboardAction | null
```

## Events

Subscribe via `engine.on(name, listener)`. Returns a function that
unsubscribes.

```ts
const unsub = engine.on('change', ({ state, previous }) => {
  render(state);
});

// later: unsub();
```

| Event    | Payload                                                |
| -------- | ------------------------------------------------------ |
| `change` | `{ state: EngineState; previous: EngineState }`        |
| `select` | `{ selection: SelectionValue; focused: CalendarDate }` |
| `focus`  | `{ focused: CalendarDate; previous: CalendarDate }`    |
| `view`   | `{ view: ViewMode; previous: ViewMode }`               |
| `hover`  | `{ hovered: CalendarDate \| null }`                    |
| `time`   | `{ time: TimeOfDay \| null }`                          |
| `open`   | `{ focused: CalendarDate }`                            |
| `close`  | `{ reason: 'cancel' \| 'commit' \| 'outside' }`        |
