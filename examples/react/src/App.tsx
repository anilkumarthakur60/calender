import { useState } from 'react';
import { DateField, DatePicker } from '@anil-labs/react';
import { type CalendarDate, createCalendarDate } from '@anil-labs/core';

const toLabel = (d: CalendarDate | null): string =>
  d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : '(none)';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element => (
  <>
    <h2 className="section-title">{title}</h2>
    <div className="grid">{children}</div>
  </>
);

const Card = ({
  title,
  description,
  children,
  status,
  wide,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  status?: string | null;
  wide?: boolean;
}): React.JSX.Element => (
  <section className={wide ? 'wide' : undefined}>
    <header>
      <h3>{title}</h3>
      <p>{description}</p>
    </header>
    {children}
    {status !== undefined && <p className="status">{status ?? '(none)'}</p>}
  </section>
);

export const App = (): React.JSX.Element => {
  const [single, setSingle] = useState<CalendarDate | null>(null);
  const [range, setRange] = useState<CalendarDate | null>(null);
  const [multi, setMulti] = useState<CalendarDate | null>(null);
  const [datetimeIso, setDatetimeIso] = useState('');
  const [euValue, setEuValue] = useState('');
  const [isoValue, setIsoValue] = useState('2025-04-15');
  const [bookingIso, setBookingIso] = useState<string | null>(null);
  const [monthPick, setMonthPick] = useState<CalendarDate | null>(null);
  const [yearPick, setYearPick] = useState<CalendarDate | null>(null);
  const [presetRange, setPresetRange] = useState('');
  const [bsValue, setBsValue] = useState('');

  const onNativeSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBookingIso(String(data.get('bookingDate') ?? ''));
  };

  return (
    <main className="layout">
      <header className="hero">
        <span className="badge">Feature showcase</span>
        <h1>@anil-labs — React</h1>
        <p>Every feature, idiomatic React.</p>
      </header>

      <Section title="Selection modes">
        <Card title="Single date" description="Default mode. Today is marked with a dot.">
          <DatePicker mode="single" locale="en-GB" onSelect={setSingle} />
          <p className="status">Selected: {toLabel(single)}</p>
        </Card>

        <Card
          title="Range — hover preview"
          description="Click an anchor, then hover anywhere — see the tentative range until you click the second date."
        >
          <DatePicker mode="range" onSelect={setRange} />
          <p className="status">Last clicked: {toLabel(range)}</p>
        </Card>

        <Card
          title="Multi-date — weekends disabled"
          description="Click multiple non-weekend dates to toggle them."
        >
          <DatePicker mode="multi" disabledWeekdays={[0, 6]} onSelect={setMulti} />
          <p className="status">Last clicked: {toLabel(multi)}</p>
        </Card>
      </Section>

      <Section title="Form integration — DateField">
        <Card
          title="Controlled — ISO storage"
          description={
            <>
              <code>value</code> + <code>onChange</code>. ISO format both ways.
            </>
          }
          status={`value = ${isoValue || '(empty)'}`}
        >
          <DateField value={isoValue} onChange={setIsoValue} />
        </Card>

        <Card
          title="Custom display, ISO storage"
          description={
            <>
              <code>format="MMM d, yyyy"</code> <code>valueFormat="iso"</code>. User sees pretty
              dates; you store ISO.
            </>
          }
          status={`stored: ${isoValue || '(empty)'}`}
        >
          <DateField
            value={isoValue}
            onChange={setIsoValue}
            format="MMM d, yyyy"
            valueFormat="iso"
          />
        </Card>

        <Card
          title="EU format"
          description={
            <>
              <code>format="dd/MM/yyyy"</code>. Both display + value in this format.
            </>
          }
          status={`value = ${euValue || '(empty)'}`}
        >
          <DateField value={euValue} onChange={setEuValue} format="dd/MM/yyyy" />
        </Card>

        <Card
          title="Native form submit"
          description={
            <>
              <code>name="..."</code> emits a hidden &lt;input&gt; — submits via FormData.
            </>
          }
          status={`submitted: ${bookingIso ?? '(unsubmitted)'}`}
        >
          <form onSubmit={onNativeSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                marginBottom: '0.375rem',
                color: '#64748b',
              }}
            >
              Booking date
            </label>
            <DateField name="bookingDate" defaultValue="2025-04-15" mode="single" />
            <button type="submit" className="submit-btn-react">
              Submit
            </button>
          </form>
        </Card>

        <Card
          title="DateTime — 15-min step"
          description={
            <>
              <code>withTime timeStep={15} format="yyyy-MM-dd HH:mm"</code>.
            </>
          }
          status={`value = ${datetimeIso || '(empty)'}`}
        >
          <DateField
            value={datetimeIso}
            onChange={setDatetimeIso}
            withTime
            timeStep={15}
            format="yyyy-MM-dd HH:mm"
          />
        </Card>

        <Card
          title="BS calendar — Devanagari"
          description={
            <>
              BS picker with <code>calendar="bikram-sambat" locale="ne-NP"</code>.
            </>
          }
          status={`value = ${bsValue || '(empty)'}`}
        >
          <DateField
            value={bsValue}
            onChange={setBsValue}
            calendar="bikram-sambat"
            locale="ne-NP"
            format="MMMM d, yyyy"
          />
        </Card>
      </Section>

      <Section title="Navigation">
        <Card
          title="Header month/year dropdowns"
          description={
            <>
              Pass <code>headerSelectors</code>. Jump in one click.
            </>
          }
        >
          <DatePicker headerSelectors yearRange={[2000, 2050]} />
        </Card>

        <Card
          title="Multi-month — 2 months"
          wide
          description={
            <>
              <code>months={2}</code>. Range bands span across months.
            </>
          }
        >
          <DatePicker mode="range" months={2} />
        </Card>

        <Card
          title="Preset shortcuts"
          description={
            <>
              <code>presets={`['last7days','last30days','thisMonth','clear']`}</code>.
            </>
          }
          status={`range value: ${presetRange || '(none)'}`}
        >
          <DatePicker
            mode="range"
            presets={['today', 'last7days', 'last30days', 'thisMonth', 'clear']}
            onChange={s => {
              const sel = s.selection;
              if (sel.mode === 'range' && sel.value) {
                setPresetRange(`${toLabel(sel.value.start)} / ${toLabel(sel.value.end)}`);
              } else {
                setPresetRange('');
              }
            }}
          />
        </Card>
      </Section>

      <Section title="Visual options">
        <Card
          title="Week numbers"
          description={
            <>
              ISO week numbers in a left column. <code>weekNumbers</code>.
            </>
          }
        >
          <DatePicker weekNumbers />
        </Card>

        <Card
          title="Highlights — events / holidays"
          description={
            <>
              Coloured dot under the day number. Tooltip from <code>label</code>.
            </>
          }
        >
          <DatePicker
            initialFocused={createCalendarDate(2026, 12, 1)}
            highlights={[
              { date: createCalendarDate(2026, 12, 25), color: '#dc2626', label: 'Christmas' },
              { date: createCalendarDate(2026, 1, 1), color: '#16a34a', label: 'New Year' },
              { date: createCalendarDate(2026, 12, 31), color: '#f59e0b', label: 'NYE' },
            ]}
          />
        </Card>
      </Section>

      <Section title="Time / DateTime">
        <Card
          title="24-hour clock"
          description={
            <>
              <code>withTime</code>. Default 24-hour, minute step 1.
            </>
          }
        >
          <DatePicker withTime />
        </Card>

        <Card
          title="12-hour + seconds + 5-min step"
          description={
            <>
              <code>withTime use12HourClock showSeconds timeStep={5}</code>.
            </>
          }
        >
          <DatePicker withTime use12HourClock showSeconds timeStep={5} />
        </Card>
      </Section>

      <Section title="Granularity">
        <Card
          title="Month picker"
          description={
            <>
              <code>granularity="month"</code>. Click a month to select.
            </>
          }
          status={`picked: ${toLabel(monthPick)}`}
        >
          <DatePicker granularity="month" onSelect={setMonthPick} />
        </Card>

        <Card
          title="Year picker"
          description={
            <>
              <code>granularity="year"</code>. Click a year to select.
            </>
          }
          status={`picked: ${toLabel(yearPick)}`}
        >
          <DatePicker granularity="year" onSelect={setYearPick} />
        </Card>
      </Section>

      <Section title="Constraints">
        <Card title="min / max" description="Dates outside the range are dimmed and not clickable.">
          <DatePicker min={createCalendarDate(2025, 4, 1)} max={createCalendarDate(2025, 6, 30)} />
        </Card>

        <Card
          title="Range 3–7 days"
          description={
            <>
              <code>minRangeDays={3}</code> <code>maxRangeDays={7}</code>. After picking the anchor,
              cells outside the allowed window are disabled.
            </>
          }
        >
          <DatePicker mode="range" minRangeDays={3} maxRangeDays={7} />
        </Card>
      </Section>

      <Section title="Calendar systems">
        <Card
          title="Bikram Sambat — English transliteration"
          description={<>Months: Baishakh, Jestha, …</>}
        >
          <DatePicker calendar="bikram-sambat" locale="en-US" headerSelectors />
        </Card>

        <Card
          title="Bikram Sambat — Nepali Devanagari"
          description={
            <>
              <code>locale="ne-NP"</code> renders Devanagari digits + month names.
            </>
          }
        >
          <DatePicker calendar="bikram-sambat" locale="ne-NP" headerSelectors />
        </Card>
      </Section>
    </main>
  );
};
