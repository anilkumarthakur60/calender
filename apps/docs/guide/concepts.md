# Concepts

## The engine

`DatePickerEngine` is a pure TypeScript class. It owns the state machine for
selection, focus, navigation, and view mode. It has no DOM or framework
dependencies.

```ts
import { DatePickerEngine } from '@calender/core';

const engine = new DatePickerEngine({
  mode: 'range',
  calendar: 'gregorian',
  locale: 'en-GB',
  min: { year: 2025, month: 1, day: 1 },
});

engine.on('change', ({ state, previous }) => {
  // Re-render
});

engine.select({ year: 2025, month: 4, day: 15 });
engine.select({ year: 2025, month: 4, day: 22 });
console.log(engine.state.selection); // { mode: 'range', value: { start, end }, anchor }
```

Every adapter wraps this engine. The Vue composable, the React hook, the Solid
signal — they all expose the same engine instance.

## EngineState

Immutable snapshot produced on every state mutation:

```ts
interface EngineState {
  mode: 'single' | 'range' | 'multi';
  view: 'day' | 'month' | 'year' | 'decade';
  focused: CalendarDate; // roving-focus target
  selection: SelectionValue; // shape depends on mode
  grid: MonthGrid; // 6×7 day grid for the focused month
  isOpen: boolean;
  hovered: CalendarDate | null; // range-mode hover preview cursor
  time: TimeOfDay | null; // when withTime is enabled
}
```

The renderers read this snapshot and emit DOM. When the engine commits a new
state, it fires a `change` event — the renderer subscribes and re-renders.

## CalendarDate — a plain triple

The picker stores dates as a `{year, month, day}` triple, not a JS `Date`. This
avoids time-zone surprises and makes BS support trivial.

```ts
import { createCalendarDate, addDays } from '@calender/core';

const d = createCalendarDate(2025, 4, 15);
const a = addDays(d, 7); // { year: 2025, month: 4, day: 22 }
```

Conversion helpers (`fromJsDate`, `toJsDate`, `fromIso`, `toIso`) handle the
boundary with the rest of the world.

## Calendar system

The picker's date math (adding days, days-in-month, weekday, today) flows
through a `CalendarSystem` interface. Two systems ship:

- `GregorianCalendar` (default)
- `BikramSambatCalendar` — Nepali calendar with months Baishakh, Jestha, …

```ts
import { BikramSambatCalendar } from '@calender/core';

const bs = new BikramSambatCalendar();
bs.toGregorian({ year: 2080, month: 1, day: 1 }); // BS New Year → AD
```

To add a new calendar (Hijri, Buddhist, Persian, …) implement the interface
and pass an instance via `calendar:` — the engine, grid, formatter, and pattern
engine all delegate to it.

## Selection strategies (Strategy pattern)

Each `mode` plugs in a `SelectionStrategy` that decides how successive clicks
accumulate. Built-in:

- `SingleSelectionStrategy` — each click replaces the value
- `RangeSelectionStrategy` — first click sets anchor, second click completes
- `MultiSelectionStrategy` — clicks toggle

```ts
import { RangeSelectionStrategy } from '@calender/core';
// Implement a custom one if you need different semantics
```

## Constraints (Composite pattern)

Min/max, disabled-dates, disabled-weekdays, and custom filter predicates are
all `DateConstraint` instances composed by `CompositeConstraint`. The engine
exposes `isDisabled(date)` and the higher-level `isPickable(date)` that also
enforces `minRangeDays` / `maxRangeDays` when an anchor is set in range mode.

## Events

The engine is an event source. Subscribe to whichever signal you need:

```ts
engine.on('change', ({ state, previous }) => {
  /* every mutation */
});
engine.on('select', ({ selection, focused }) => {
  /* user picked */
});
engine.on('focus', ({ focused, previous }) => {
  /* roving focus */
});
engine.on('view', ({ view, previous }) => {
  /* day/month/year */
});
engine.on('hover', ({ hovered }) => {
  /* range preview */
});
engine.on('time', ({ time }) => {
  /* time changed */
});
engine.on('open', ({ focused }) => {
  /* popover opened */
});
engine.on('close', ({ reason }) => {
  /* popover closed */
});
```
