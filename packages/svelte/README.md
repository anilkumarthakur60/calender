# @anil-labs/calendar-svelte

Svelte adapter for `@anil-labs/calendar-core`. Exposes a factory that satisfies Svelte's
readable store contract — read it with `$store` auto-subscription in
Svelte 3/4/5, or bridge it into a rune with Svelte 5's `fromStore`.

```svelte
<script lang="ts">
  import { createDatePicker } from '@anil-labs/calendar-svelte';

  const { engine, state } = createDatePicker({ mode: 'range', locale: 'en-GB' });
</script>

<div class="cal-picker">
  {#each $state.grid.weeks as week}
    {#each week as cell}
      <button
        class="cal-picker__cell"
        data-outside={!cell.inCurrentMonth || undefined}
        data-today={cell.isToday || undefined}
        on:click={() => engine.select(cell.date)}
      >
        {engine.formatter.formatDay(cell.date)}
      </button>
    {/each}
  {/each}
</div>
```

## Live reconfiguration

The result exposes the engine plus a `setOptions` shorthand, so a mounted
picker can be reconfigured without recreating it — selection and focus are
preserved where still valid and every subscriber is notified:

```ts
const picker = createDatePicker({ mode: 'single' });
picker.setOptions({ min: { year: 2025, month: 1, day: 1 } });
// equivalent: picker.engine.setOptions({ ... })
```

A pre-built `.svelte` component is intentionally omitted: shipping `.svelte`
sources requires the Svelte compiler in the host's build. The factory keeps
the library framework-pure while still feeling idiomatic.
