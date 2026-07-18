<script setup lang="ts">
import { ref } from "vue";
import { DateField, DatePicker } from "@anil-labs/vue";
import { createCalendarDate, type CalendarDate } from "@anil-labs/core";

const fmt = (d: CalendarDate | null) =>
  d ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : "(none)";

// Selection modes
const single = ref<CalendarDate | null>(null);
const range = ref<CalendarDate | null>(null);
const multi = ref<CalendarDate | null>(null);

// DateField values
const isoValue = ref("2025-04-15");
const euValue = ref("");
const datetimeValue = ref("");
const bsValue = ref("");
const multiRangeValue = ref("");

// Form
const submittedIso = ref<string | null>(null);
const onSubmit = (e: Event): void => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  submittedIso.value = String(data.get("bookingDate") ?? "");
};

// Granularity
const monthPick = ref<CalendarDate | null>(null);
const yearPick = ref<CalendarDate | null>(null);

// Highlights data
const holidays = [
  { date: createCalendarDate(2026, 12, 25), color: "#dc2626", label: "Christmas" },
  { date: createCalendarDate(2026, 1, 1), color: "#16a34a", label: "New Year" },
  { date: createCalendarDate(2026, 7, 4), color: "#f59e0b", label: "Independence Day" },
];
</script>

<template>
  <div class="page">
    <header class="hero">
      <span class="badge">Feature showcase</span>
      <h1>@anil-labs/calender</h1>
      <p>Every feature, idiomatic Vue.</p>
    </header>

    <h2 class="section-title">Selection modes</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>Single date</h3>
          <p>Default mode. Today is marked with a dot.</p>
        </header>
        <DatePicker mode="single" locale="en-GB" @select="d => (single = d)" />
        <p class="status">Selected: {{ fmt(single) }}</p>
      </article>

      <article class="card">
        <header>
          <h3>Range — hover preview</h3>
          <p>
            Click an anchor, then hover anywhere — see the tentative range until you click the
            second date.
          </p>
        </header>
        <DatePicker mode="range" @select="d => (range = d)" />
        <p class="status">Last clicked: {{ fmt(range) }}</p>
      </article>

      <article class="card">
        <header>
          <h3>Multi-date — weekends disabled</h3>
          <p>Click multiple non-weekend dates to toggle.</p>
        </header>
        <DatePicker mode="multi" :disabled-weekdays="[0, 6]" @select="d => (multi = d)" />
        <p class="status">Last clicked: {{ fmt(multi) }}</p>
      </article>
    </div>

    <h2 class="section-title">Form integration — DateField (v-model)</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>v-model — ISO storage</h3>
          <p>Default behaviour. ISO format both ways.</p>
        </header>
        <DateField v-model="isoValue" />
        <p class="status">v-model = {{ isoValue || "(empty)" }}</p>
      </article>

      <article class="card">
        <header>
          <h3>Custom display, ISO storage</h3>
          <p>
            <code>format="MMM d, yyyy" value-format="iso"</code>. User sees pretty dates; you store
            ISO.
          </p>
        </header>
        <DateField v-model="isoValue" format="MMM d, yyyy" value-format="iso" />
        <p class="status">stored: {{ isoValue || "(empty)" }}</p>
      </article>

      <article class="card">
        <header>
          <h3>EU format</h3>
          <p><code>format="dd/MM/yyyy"</code>. Both display + value in this format.</p>
        </header>
        <DateField v-model="euValue" format="dd/MM/yyyy" />
        <p class="status">value = {{ euValue || "(empty)" }}</p>
      </article>

      <article class="card">
        <header>
          <h3>Native form submit</h3>
          <p><code>name="..."</code> emits a hidden input. Submits via FormData.</p>
        </header>
        <form @submit="onSubmit">
          <label class="field-label">Booking date</label>
          <DateField name="bookingDate" mode="single" />
          <button type="submit" class="submit-btn">Submit</button>
        </form>
        <p class="status">submitted = {{ submittedIso ?? "(unsubmitted)" }}</p>
      </article>

      <article class="card">
        <header>
          <h3>DateTime — 15-min step</h3>
          <p><code>with-time time-step="15" format="yyyy-MM-dd HH:mm"</code>.</p>
        </header>
        <DateField v-model="datetimeValue" with-time :time-step="15" format="yyyy-MM-dd HH:mm" />
        <p class="status">value = {{ datetimeValue || "(empty)" }}</p>
      </article>

      <article class="card dark">
        <header>
          <h3>BS calendar — Devanagari</h3>
          <p>BS picker with <code>calendar="bikram-sambat" locale="ne-NP"</code>.</p>
        </header>
        <div class="cal-theme-dark">
          <DateField
            v-model="bsValue"
            calendar="bikram-sambat"
            locale="ne-NP"
            format="MMMM d, yyyy"
          />
        </div>
        <p class="status">value = {{ bsValue || "(empty)" }}</p>
      </article>

      <article class="card wide">
        <header>
          <h3>Multi-month — 2 months</h3>
          <p><code>mode="range" :months="2"</code>. The popover shows two months.</p>
        </header>
        <DateField v-model="multiRangeValue" mode="range" :months="2" format="MMM d, yyyy" />
        <p class="status">value = {{ multiRangeValue || "(empty)" }}</p>
      </article>
    </div>

    <h2 class="section-title">Navigation</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>Header month/year dropdowns</h3>
          <p>Pass <code>:header-selectors="true"</code>. Jump in one click.</p>
        </header>
        <DatePicker :header-selectors="true" :year-range="[2000, 2050]" />
      </article>

      <article class="card wide">
        <header>
          <h3>Multi-month — 2 months</h3>
          <p><code>:months="2"</code>. Range bands span across months.</p>
        </header>
        <DatePicker mode="range" :months="2" />
      </article>

      <article class="card">
        <header>
          <h3>Preset shortcuts</h3>
          <p><code>:presets="['today','last7days','last30days','thisMonth','clear']"</code>.</p>
        </header>
        <DatePicker
          mode="range"
          :presets="['today', 'last7days', 'last30days', 'thisMonth', 'clear']"
        />
      </article>
    </div>

    <h2 class="section-title">Visual options</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>Week numbers</h3>
          <p>ISO week numbers on the left. <code>:week-numbers="true"</code>.</p>
        </header>
        <DatePicker :week-numbers="true" />
      </article>

      <article class="card">
        <header>
          <h3>Highlights — events / holidays</h3>
          <p>Coloured dot under the day number. Tooltip from <code>label</code>.</p>
        </header>
        <DatePicker :initial-focused="createCalendarDate(2026, 12, 1)" :highlights="holidays" />
      </article>
    </div>

    <h2 class="section-title">Time / DateTime</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>24-hour clock</h3>
          <p><code>:with-time="true"</code>. Default 24-hour.</p>
        </header>
        <DatePicker :with-time="true" />
      </article>

      <article class="card">
        <header>
          <h3>12-hour + AM/PM + seconds</h3>
          <p>
            <code
              >:with-time="true" :use12-hour-clock="true" :show-seconds="true" :time-step="5"</code
            >.
          </p>
        </header>
        <DatePicker
          :with-time="true"
          :use12-hour-clock="true"
          :show-seconds="true"
          :time-step="5"
        />
      </article>
    </div>

    <h2 class="section-title">Granularity</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>Month picker</h3>
          <p><code>granularity="month"</code>. Click a month to select.</p>
        </header>
        <DatePicker granularity="month" @select="d => (monthPick = d)" />
        <p class="status">picked: {{ fmt(monthPick) }}</p>
      </article>

      <article class="card">
        <header>
          <h3>Year picker</h3>
          <p><code>granularity="year"</code>. Click a year to select.</p>
        </header>
        <DatePicker granularity="year" @select="d => (yearPick = d)" />
        <p class="status">picked: {{ fmt(yearPick) }}</p>
      </article>
    </div>

    <h2 class="section-title">Constraints</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>min / max</h3>
          <p>Dates outside the range are dimmed and not clickable.</p>
        </header>
        <DatePicker :min="createCalendarDate(2025, 4, 1)" :max="createCalendarDate(2025, 6, 30)" />
      </article>

      <article class="card">
        <header>
          <h3>Range 3–7 days</h3>
          <p>
            <code>:min-range-days="3"</code> <code>:max-range-days="7"</code>. After picking the
            anchor, only dates 3 to 7 days away are clickable.
          </p>
        </header>
        <DatePicker mode="range" :min-range-days="3" :max-range-days="7" />
      </article>
    </div>

    <h2 class="section-title">Calendar systems</h2>
    <div class="grid">
      <article class="card">
        <header>
          <h3>Bikram Sambat — English transliteration</h3>
          <p>Months: Baishakh, Jestha, …</p>
        </header>
        <DatePicker calendar="bikram-sambat" locale="en-US" :header-selectors="true" />
      </article>

      <article class="card">
        <header>
          <h3>Bikram Sambat — Nepali Devanagari</h3>
          <p><code>locale="ne-NP"</code> renders Devanagari digits + month names.</p>
        </header>
        <DatePicker calendar="bikram-sambat" locale="ne-NP" :header-selectors="true" />
      </article>
    </div>
  </div>
</template>

<style>
@import url("https://rsms.me/inter/inter.css");
:root {
  --page-bg: #f8fafc;
  --card-bg: #ffffff;
  --card-border: #e2e8f0;
  --ink: #0f172a;
  --ink-muted: #64748b;
  --accent: #2563eb;
}
* {
  box-sizing: border-box;
}
html,
body,
#app {
  margin: 0;
  padding: 0;
}
body {
  font-family:
    "Inter",
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
  font-feature-settings: "cv11";
  background:
    radial-gradient(ellipse 60% 40% at 50% -10%, rgba(37, 99, 235, 0.08), transparent 60%),
    var(--page-bg);
  color: var(--ink);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.page {
  max-width: 84rem;
  margin: 0 auto;
  padding: 3rem 1.5rem 5rem;
}
.hero {
  text-align: center;
  margin-bottom: 3rem;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(37, 99, 235, 0.08);
  color: var(--accent);
  border: 1px solid rgba(37, 99, 235, 0.18);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  margin-bottom: 0.75rem;
}
.hero h1 {
  font-size: 2.75rem;
  letter-spacing: -0.03em;
  font-weight: 700;
  margin: 0 0 0.5rem;
  background: linear-gradient(135deg, #0f172a, #475569);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero p {
  color: var(--ink-muted);
  font-size: 1.0625rem;
  margin: 0;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  margin: 2.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--card-border);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
  gap: 1.5rem;
  align-items: start;
}
/* Wide cards (e.g. multi-month) span two columns so both months fit. */
.card.wide {
  grid-column: span 2;
}
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow:
    0 0 0 1px rgb(15 23 42 / 0.02),
    0 1px 3px 0 rgb(15 23 42 / 0.04);
  transition: box-shadow 200ms ease;
}
.card:hover {
  box-shadow:
    0 0 0 1px rgb(15 23 42 / 0.04),
    0 8px 20px -4px rgb(15 23 42 / 0.08);
}
.card > header {
  margin-bottom: 1.25rem;
}
.card h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}
.card > header p {
  color: var(--ink-muted);
  font-size: 0.8125rem;
  line-height: 1.55;
  margin: 0;
}
.card.dark {
  background: #0f172a;
  border-color: #1e293b;
  color: #f1f5f9;
}
.card.dark h3 {
  color: #f1f5f9;
}
.card.dark > header p {
  color: #94a3b8;
}
.card.dark .status {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8 !important;
}
code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.78em;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  background: rgba(15, 23, 42, 0.06);
  color: var(--ink);
}
.dark code {
  background: rgba(241, 245, 249, 0.1);
  color: #f1f5f9;
}
.status {
  margin-top: 1rem;
  font-family: ui-monospace, SFMono-Regular, monospace !important;
  font-size: 0.75rem !important;
  background: #f8fafc;
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  padding: 0.4375rem 0.625rem;
  color: var(--ink-muted) !important;
}
.field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ink-muted);
  margin-bottom: 0.375rem;
}
.submit-btn {
  margin-top: 0.75rem;
  background: #2563eb;
  color: #fff;
  border: 0;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}
.submit-btn:hover {
  background: #1d4ed8;
}
</style>
