import { createSignal, For } from 'solid-js';
import { createDatePicker } from '@anil-labs/solid';
import { type CalendarDate, isInRange, isSameDay } from '@anil-labs/core';

const label = (d: CalendarDate | null): string => (d ? `${d.year}-${d.month}-${d.day}` : '(none)');

export const App = () => {
  const single = createDatePicker({ mode: 'single', locale: 'en-GB' });
  const range = createDatePicker({ mode: 'range' });
  const [lastSingle, setLastSingle] = createSignal<CalendarDate | null>(null);
  const [lastRange, setLastRange] = createSignal<CalendarDate | null>(null);

  return (
    <main class="layout">
      <header>
        <h1>@anil-labs — Solid example</h1>
        <p>createDatePicker + fine-grained signals.</p>
      </header>

      <Picker
        title="Single"
        engine={single.engine}
        state={single.state}
        onSelect={d => setLastSingle(d)}
      />
      <p class="status">Selected: {label(lastSingle())}</p>

      <Picker
        title="Range"
        engine={range.engine}
        state={range.state}
        onSelect={d => setLastRange(d)}
      />
      <p class="status">Last clicked: {label(lastRange())}</p>
    </main>
  );
};

type PickerProps = {
  title: string;
  engine: ReturnType<typeof createDatePicker>['engine'];
  state: ReturnType<typeof createDatePicker>['state'];
  onSelect: (date: CalendarDate) => void;
};

const Picker = (props: PickerProps) => {
  return (
    <section>
      <h2>{props.title}</h2>
      <div class="cal-picker" role="group">
        <div class="cal-picker__header">
          <button class="cal-picker__nav" onClick={() => props.engine.pagePrev()}>
            ‹
          </button>
          <span class="cal-picker__title">
            {props.engine.formatter.formatMonthYear(props.state().focused)}
          </span>
          <button class="cal-picker__nav" onClick={() => props.engine.pageNext()}>
            ›
          </button>
        </div>
        <div class="cal-picker__grid" role="grid">
          <For each={props.state().grid.weekdayHeaders}>
            {w => (
              <div class="cal-picker__weekday" role="columnheader">
                {props.engine.formatter.formatWeekday(w, 'short')}
              </div>
            )}
          </For>
          <For each={props.state().grid.weeks.flat()}>
            {cell => {
              const sel = props.state().selection;
              const range = sel.mode === 'range' ? sel.value : null;
              return (
                <button
                  type="button"
                  role="gridcell"
                  class="cal-picker__cell"
                  attr:data-outside={!cell.inCurrentMonth ? 'true' : undefined}
                  attr:data-today={cell.isToday ? 'true' : undefined}
                  attr:data-weekend={cell.isWeekend ? 'true' : undefined}
                  attr:data-selected={props.engine.isSelected(cell.date) ? 'true' : undefined}
                  attr:data-range-start={
                    range && isSameDay(cell.date, range.start) ? 'true' : undefined
                  }
                  attr:data-range-end={
                    range && isSameDay(cell.date, range.end) ? 'true' : undefined
                  }
                  attr:data-range-mid={
                    range &&
                    isInRange(cell.date, range, true) &&
                    !isSameDay(cell.date, range.start) &&
                    !isSameDay(cell.date, range.end)
                      ? 'true'
                      : undefined
                  }
                  onClick={() => {
                    if (props.engine.isDisabled(cell.date)) return;
                    props.engine.select(cell.date);
                    props.onSelect(cell.date);
                  }}
                >
                  {props.engine.formatter.formatDay(cell.date)}
                </button>
              );
            }}
          </For>
        </div>
      </div>
    </section>
  );
};
