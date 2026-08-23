# Svelte

```bash
npm install @anil-labs/calendar-svelte @anil-labs/calendar-styles
```

The adapter ships a single factory — `createDatePicker` — that satisfies
Svelte's readable-store contract. Works with Svelte 3/4 store auto-subscribe
(`$store`) and Svelte 5 runes.

```svelte
<script lang="ts">
  import '@anil-labs/calendar-styles';
  import { createDatePicker } from '@anil-labs/calendar-svelte';
  import { isSameDay } from '@anil-labs/calendar-core';

  const { engine, store } = createDatePicker({ mode: 'single', locale: 'en-GB' });
</script>

<div class="cal-picker" role="group">
  <div class="cal-picker__header">
    <button class="cal-picker__nav" on:click={() => engine.pagePrev()}>‹</button>
    <span class="cal-picker__title">{engine.formatter.formatMonthYear($store.focused)}</span>
    <button class="cal-picker__nav" on:click={() => engine.pageNext()}>›</button>
  </div>
  <div class="cal-picker__grid" role="grid">
    {#each $store.grid.weekdayHeaders as w (w)}
      <div class="cal-picker__weekday" role="columnheader">
        {engine.formatter.formatWeekday(w, 'short')}
      </div>
    {/each}
    {#each $store.grid.weeks as week}
      {#each week as cell (`${cell.date.year}-${cell.date.month}-${cell.date.day}`)}
        <button
          class="cal-picker__cell"
          data-outside={!cell.inCurrentMonth || undefined}
          data-today={cell.isToday || undefined}
          data-selected={engine.isSelected(cell.date) || undefined}
          on:click={() => engine.select(cell.date)}
        >
          {engine.formatter.formatDay(cell.date)}
        </button>
      {/each}
    {/each}
  </div>
</div>
```

## API

```ts
const { engine, store, subscribe } = createDatePicker(options);
```

- `engine` — the `DatePickerEngine` instance.
- `state` — Svelte-store-compatible (`subscribe(run)`), holds `EngineState`.
- `subscribe(listener)` — manual subscription outside of components.

## Why no `.svelte` component is shipped

Shipping `.svelte` sources requires the Svelte compiler in the host's build
pipeline. The factory pattern keeps the library framework-pure while still
feeling idiomatic. Copy the snippet above as your starting point — it's the
full reference implementation.

## All features available

Every engine feature works — range hover preview, multi-month, week numbers,
highlights, time picker, BS calendar, presets — by passing the relevant
options to `createDatePicker(options)` and reading from `store`. The rendering
is yours; the state machine is shared.

## Live example

<div class="docs-demo">
  <calender-picker mode="single"></calender-picker>
</div>
