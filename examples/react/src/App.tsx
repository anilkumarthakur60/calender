import { useState } from 'react';
import { DateField, DatePicker } from '@anil-labs/react';
import { createCalendarDate } from '@anil-labs/core';

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

/**
 * A feature shown twice, side by side: the inline picker on the left and the
 * same feature as a DateField (form input) on the right — so each use case is
 * easy to compare in both forms.
 */
const FeaturePair = ({
  title,
  description,
  picker,
  field,
}: {
  title: string;
  description: React.ReactNode;
  picker: React.ReactNode;
  field: React.ReactNode;
}): React.JSX.Element => (
  <div className="pair">
    <div className="pair-head">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <div className="pair-cards">
      <div className="pair-card">
        <span className="pair-tag">Inline picker</span>
        {picker}
      </div>
      <div className="pair-card">
        <span className="pair-tag">Form input</span>
        {field}
      </div>
    </div>
  </div>
);

const PairSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element => (
  <>
    <h2 className="section-title">{title}</h2>
    <div className="pairs">{children}</div>
  </>
);

const holidays = [
  { date: createCalendarDate(2026, 12, 25), color: '#dc2626', label: 'Christmas' },
  { date: createCalendarDate(2026, 1, 1), color: '#16a34a', label: 'New Year' },
  { date: createCalendarDate(2026, 12, 31), color: '#f59e0b', label: 'NYE' },
];

export const App = (): React.JSX.Element => {
  const [euValue, setEuValue] = useState('');
  const [isoValue, setIsoValue] = useState('2025-04-15');
  const [bookingIso, setBookingIso] = useState<string | null>(null);

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
        <p>Every feature shown as an inline picker and as a form input, side by side.</p>
      </header>

      <PairSection title="Selection modes">
        <FeaturePair
          title="Single date"
          description="Default mode. Today is marked with a dot."
          picker={<DatePicker mode="single" locale="en-GB" />}
          field={<DateField mode="single" locale="en-GB" />}
        />
        <FeaturePair
          title="Range — hover preview"
          description="Click an anchor, then hover — a tentative range shows until the second click."
          picker={<DatePicker mode="range" />}
          field={<DateField mode="range" format="MMM d, yyyy" />}
        />
        <FeaturePair
          title="Multi-date — weekends disabled"
          description="Toggle multiple non-weekend dates."
          picker={<DatePicker mode="multi" disabledWeekdays={[0, 6]} />}
          field={<DateField mode="multi" disabledWeekdays={[0, 6]} />}
        />
      </PairSection>

      <PairSection title="Navigation">
        <FeaturePair
          title="Header month/year dropdowns"
          description={
            <>
              <code>headerSelectors yearRange={[2000, 2050]}</code>. Jump in one click.
            </>
          }
          picker={<DatePicker headerSelectors yearRange={[2000, 2050]} />}
          field={<DateField headerSelectors yearRange={[2000, 2050]} />}
        />
        <FeaturePair
          title="Multi-month — 2 months"
          description={
            <>
              <code>mode="range" months={2}</code>. Two months side by side; range bands span both.
            </>
          }
          picker={<DatePicker mode="range" months={2} />}
          field={<DateField mode="range" months={2} format="MMM d, yyyy" />}
        />
        <FeaturePair
          title="Preset shortcuts"
          description={
            <>
              <code>presets={`['today','last7days','last30days','thisMonth','clear']`}</code>.
            </>
          }
          picker={
            <DatePicker
              mode="range"
              presets={['today', 'last7days', 'last30days', 'thisMonth', 'clear']}
            />
          }
          field={
            <DateField
              mode="range"
              presets={['today', 'last7days', 'last30days', 'thisMonth', 'clear']}
              format="MMM d, yyyy"
            />
          }
        />
      </PairSection>

      <PairSection title="Visual options">
        <FeaturePair
          title="Week numbers"
          description={
            <>
              ISO week numbers in a left column. <code>weekNumbers</code>.
            </>
          }
          picker={<DatePicker weekNumbers />}
          field={<DateField weekNumbers />}
        />
        <FeaturePair
          title="Highlights — events / holidays"
          description={
            <>
              Coloured dot under the day; tooltip from <code>label</code>.
            </>
          }
          picker={
            <DatePicker initialFocused={createCalendarDate(2026, 12, 1)} highlights={holidays} />
          }
          field={<DateField defaultValue="2026-12-25" highlights={holidays} />}
        />
      </PairSection>

      <PairSection title="Time / DateTime">
        <FeaturePair
          title="24-hour clock"
          description={
            <>
              <code>withTime</code>. Default 24-hour, minute step 1.
            </>
          }
          picker={<DatePicker withTime />}
          field={<DateField withTime format="yyyy-MM-dd HH:mm" />}
        />
        <FeaturePair
          title="12-hour + seconds + 5-min step"
          description={
            <>
              <code>withTime use12HourClock showSeconds timeStep={5}</code>.
            </>
          }
          picker={<DatePicker withTime use12HourClock showSeconds timeStep={5} />}
          field={
            <DateField
              withTime
              use12HourClock
              showSeconds
              timeStep={5}
              format="yyyy-MM-dd hh:mm:ss a"
            />
          }
        />
      </PairSection>

      <PairSection title="Granularity">
        <FeaturePair
          title="Month picker"
          description={
            <>
              <code>granularity="month"</code>. Pick a month.
            </>
          }
          picker={<DatePicker granularity="month" />}
          field={<DateField granularity="month" format="MMM yyyy" />}
        />
        <FeaturePair
          title="Year picker"
          description={
            <>
              <code>granularity="year"</code>. Pick a year.
            </>
          }
          picker={<DatePicker granularity="year" />}
          field={<DateField granularity="year" format="yyyy" />}
        />
      </PairSection>

      <PairSection title="Constraints">
        <FeaturePair
          title="min / max"
          description="Dates outside the range are dimmed and rejected on type + click."
          picker={
            <DatePicker
              min={createCalendarDate(2025, 4, 1)}
              max={createCalendarDate(2025, 6, 30)}
            />
          }
          field={
            <DateField min={createCalendarDate(2025, 4, 1)} max={createCalendarDate(2025, 6, 30)} />
          }
        />
        <FeaturePair
          title="Range 3–7 days"
          description={
            <>
              <code>
                minRangeDays={3} maxRangeDays={7}
              </code>
              . Cells outside the window are disabled after the anchor.
            </>
          }
          picker={<DatePicker mode="range" minRangeDays={3} maxRangeDays={7} />}
          field={<DateField mode="range" minRangeDays={3} maxRangeDays={7} format="MMM d" />}
        />
      </PairSection>

      <PairSection title="Calendar systems">
        <FeaturePair
          title="Bikram Sambat — English"
          description="Months: Baishakh, Jestha, … transliterated."
          picker={<DatePicker calendar="bikram-sambat" locale="en-US" headerSelectors />}
          field={
            <DateField
              calendar="bikram-sambat"
              locale="en-US"
              headerSelectors
              format="MMMM d, yyyy"
            />
          }
        />
        <FeaturePair
          title="Bikram Sambat — Nepali Devanagari"
          description={
            <>
              <code>locale="ne-NP"</code> renders Devanagari digits + month names.
            </>
          }
          picker={<DatePicker calendar="bikram-sambat" locale="ne-NP" headerSelectors />}
          field={
            <DateField
              calendar="bikram-sambat"
              locale="ne-NP"
              headerSelectors
              format="MMMM d, yyyy"
            />
          }
        />
      </PairSection>

      <Section title="Form integration — DateField patterns">
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
              <code>format="MMM d, yyyy"</code> <code>valueFormat="iso"</code>. Pretty display, ISO
              storage.
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
            <label className="field-label">Booking date</label>
            <DateField name="bookingDate" defaultValue="2025-04-15" mode="single" />
            <button type="submit" className="submit-btn-react">
              Submit
            </button>
          </form>
        </Card>
      </Section>
    </main>
  );
};
