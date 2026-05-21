# @calender/svelte

Svelte adapter for `@calender/core`. Exposes a factory that satisfies Svelte's
readable store contract — usable as `$state` in Svelte 3/4 and read from a
`$derived` rune in Svelte 5.

```svelte
<script lang="ts">
  import { createDatePicker } from '@calender/svelte';

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

A pre-built `.svelte` component is intentionally omitted: shipping `.svelte`
sources requires the Svelte compiler in the host's build. The factory keeps
the library framework-pure while still feeling idiomatic.
