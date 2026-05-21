import { useState } from 'react';
import { DatePicker } from '@calender/react';
import { type CalendarDate, createCalendarDate } from '@calender/core';

const toLabel = (d: CalendarDate | null): string =>
  d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : '(none)';

export const App = (): JSX.Element => {
  const [single, setSingle] = useState<CalendarDate | null>(null);
  const [range, setRange] = useState<CalendarDate | null>(null);
  const [multi, setMulti] = useState<CalendarDate | null>(null);

  return (
    <main className="layout">
      <header>
        <h1>@calender — React playground</h1>
        <p>useDatePicker + &lt;DatePicker&gt;.</p>
      </header>

      <section>
        <h2>Single</h2>
        <DatePicker mode="single" locale="en-GB" onSelect={setSingle} />
        <p className="status">Selected: {toLabel(single)}</p>
      </section>

      <section>
        <h2>Range, with bounds</h2>
        <DatePicker
          mode="range"
          min={createCalendarDate(2024, 1, 1)}
          max={createCalendarDate(2026, 12, 31)}
          onSelect={setRange}
        />
        <p className="status">Last clicked: {toLabel(range)}</p>
      </section>

      <section>
        <h2>Multi, weekends disabled</h2>
        <DatePicker mode="multi" disabledWeekdays={[0, 6]} onSelect={setMulti} />
        <p className="status">Last clicked: {toLabel(multi)}</p>
      </section>
    </main>
  );
};
