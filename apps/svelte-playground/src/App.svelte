<script lang="ts">
  import { createDatePicker } from '@anil-labs/svelte';
  import { type CalendarDate, isSameDay, isInRange } from '@anil-labs/core';

  const single = createDatePicker({ mode: 'single', locale: 'en-GB' });
  const range = createDatePicker({ mode: 'range' });
  let lastSingle: CalendarDate | null = $state(null);
  let lastRange: CalendarDate | null = $state(null);

  let singleState = $state(single.engine.state);
  let rangeState = $state(range.engine.state);
  single.subscribe(s => (singleState = s));
  range.subscribe(s => (rangeState = s));

  const label = (d: CalendarDate | null): string =>
    d ? `${d.year}-${d.month}-${d.day}` : '(none)';

  function onSingleClick(date: CalendarDate): void {
    single.engine.select(date);
    lastSingle = date;
  }
  function onRangeClick(date: CalendarDate): void {
    range.engine.select(date);
    lastRange = date;
  }
</script>

<main>
  <header>
    <h1>@calender — Svelte 5 playground</h1>
    <p>createDatePicker + runes.</p>
  </header>

  <section>
    <h2>Single (custom-rendered from state)</h2>
    <div class="cal-picker" role="group">
      <div class="cal-picker__header">
        <button onclick={() => single.engine.pagePrev()} class="cal-picker__nav">‹</button>
        <span class="cal-picker__title">{single.engine.formatter.formatMonthYear(singleState.focused)}</span>
        <button onclick={() => single.engine.pageNext()} class="cal-picker__nav">›</button>
      </div>
      <div class="cal-picker__grid" role="grid">
        {#each singleState.grid.weekdayHeaders as w (w)}
          <div class="cal-picker__weekday" role="columnheader">{single.engine.formatter.formatWeekday(w, 'short')}</div>
        {/each}
        {#each singleState.grid.weeks as week, wi (wi)}
          {#each week as cell (`${cell.date.year}-${cell.date.month}-${cell.date.day}`)}
            <button
              type="button"
              role="gridcell"
              class="cal-picker__cell"
              data-outside={!cell.inCurrentMonth || undefined}
              data-today={cell.isToday || undefined}
              data-weekend={cell.isWeekend || undefined}
              data-selected={single.engine.isSelected(cell.date) || undefined}
              onclick={() => onSingleClick(cell.date)}
            >
              {single.engine.formatter.formatDay(cell.date)}
            </button>
          {/each}
        {/each}
      </div>
    </div>
    <p class="status">Selected: {label(lastSingle)}</p>
  </section>

  <section>
    <h2>Range</h2>
    <div class="cal-picker" role="group">
      <div class="cal-picker__header">
        <button onclick={() => range.engine.pagePrev()} class="cal-picker__nav">‹</button>
        <span class="cal-picker__title">{range.engine.formatter.formatMonthYear(rangeState.focused)}</span>
        <button onclick={() => range.engine.pageNext()} class="cal-picker__nav">›</button>
      </div>
      <div class="cal-picker__grid" role="grid">
        {#each rangeState.grid.weekdayHeaders as w (w)}
          <div class="cal-picker__weekday" role="columnheader">{range.engine.formatter.formatWeekday(w, 'short')}</div>
        {/each}
        {#each rangeState.grid.weeks as week, wi (wi)}
          {#each week as cell (`${cell.date.year}-${cell.date.month}-${cell.date.day}`)}
            {@const rangeValue = rangeState.selection.mode === 'range' ? rangeState.selection.value : null}
            <button
              type="button"
              role="gridcell"
              class="cal-picker__cell"
              data-outside={!cell.inCurrentMonth || undefined}
              data-today={cell.isToday || undefined}
              data-selected={range.engine.isSelected(cell.date) || undefined}
              data-range-start={rangeValue && isSameDay(cell.date, rangeValue.start) || undefined}
              data-range-end={rangeValue && isSameDay(cell.date, rangeValue.end) || undefined}
              data-range-mid={rangeValue && isInRange(cell.date, rangeValue, true) && !isSameDay(cell.date, rangeValue.start) && !isSameDay(cell.date, rangeValue.end) || undefined}
              onclick={() => onRangeClick(cell.date)}
            >
              {range.engine.formatter.formatDay(cell.date)}
            </button>
          {/each}
        {/each}
      </div>
    </div>
    <p class="status">Last clicked: {label(lastRange)}</p>
  </section>
</main>

<style>
  main {
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    max-width: 70rem;
    margin: 2rem auto;
    padding: 0 1rem;
    display: grid;
    gap: 1.5rem;
  }
  section {
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    background: #fff;
  }
  .status {
    margin-top: 0.5rem;
    font-family: ui-monospace, SFMono-Regular, monospace;
    color: #6b7280;
  }
</style>
