# @calender/core

Headless, framework-agnostic calendar/date-picker state engine. Zero runtime
dependencies. Drives the React, Vue, Svelte, Solid, Angular, and Web Component
renderers in this monorepo, but you can build your own renderer against the
same public API.

```ts
import { DatePickerEngine, createCalendarDate } from '@calender/core';

const engine = new DatePickerEngine({
  mode: 'range',
  min: createCalendarDate(2025, 1, 1),
  max: createCalendarDate(2025, 12, 31),
  locale: 'en-GB',
});

engine.on('change', ({ state }) => render(state));
engine.handleKey({
  key: 'ArrowRight',
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
});
```

## Architecture

- **Domain** — `CalendarDate`, `DateRange`, `buildMonthGrid` (pure value objects + functions).
- **Selection strategies** — `single | range | multi` implementing the same `SelectionStrategy` interface (Strategy pattern, OCP).
- **Constraints** — `MinMax`, `DisabledDates`, `DisabledWeekday`, `Filter`, `Composite` (composable predicates).
- **Navigation** — `ViewMode` (day/month/year/decade) + pure `stepBackward/stepForward` per view.
- **i18n** — `resolveLocaleConfig`, `DateFormatter` (memoised `Intl`), lenient `parseDate`.
- **Focus/keyboard** — `interpretKey` maps `KeyboardEventLike` → logical `KeyboardAction`.
- **Engine facade** — `DatePickerEngine` composes all of the above; renderers consume the immutable `EngineState`.
