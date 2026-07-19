<script setup lang="ts">
import { ref } from "vue";
import { DateField, DatePicker } from "@anil-labs/vue";
import { createCalendarDate } from "@anil-labs/core";
import FeaturePair from "./FeaturePair.vue";

// Form-pattern demos (controlled state).
const isoValue = ref("2025-04-15");
const euValue = ref("");
const submittedIso = ref<string | null>(null);
const onSubmit = (e: Event): void => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  submittedIso.value = String(data.get("bookingDate") ?? "");
};

const holidays = [
  { date: createCalendarDate(2026, 12, 25), color: "#dc2626", label: "Christmas" },
  { date: createCalendarDate(2026, 1, 1), color: "#16a34a", label: "New Year" },
  { date: createCalendarDate(2026, 12, 31), color: "#f59e0b", label: "NYE" },
];
</script>

<template>
  <div class="page">
    <header class="hero">
      <span class="badge">Feature showcase</span>
      <h1>@anil-labs/calender</h1>
      <p>Every feature shown as an inline picker and as a form input, side by side.</p>
    </header>

    <h2 class="section-title">Selection modes</h2>
    <div class="pairs">
      <FeaturePair title="Single date">
        <template #desc>Default mode. Today is marked with a dot.</template>
        <template #picker><DatePicker mode="single" locale="en-GB" /></template>
        <template #field><DateField mode="single" locale="en-GB" /></template>
      </FeaturePair>
      <FeaturePair title="Range — hover preview">
        <template #desc
          >Click an anchor, then hover — a tentative range shows until the second click.</template
        >
        <template #picker><DatePicker mode="range" /></template>
        <template #field><DateField mode="range" format="MMM d, yyyy" /></template>
      </FeaturePair>
      <FeaturePair title="Multi-date — weekends disabled">
        <template #desc>Toggle multiple non-weekend dates.</template>
        <template #picker><DatePicker mode="multi" :disabled-weekdays="[0, 6]" /></template>
        <template #field><DateField mode="multi" :disabled-weekdays="[0, 6]" /></template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Navigation</h2>
    <div class="pairs">
      <FeaturePair title="Header month/year dropdowns">
        <template #desc
          ><code>:header-selectors :year-range="[2000, 2050]"</code>. Jump in one click.</template
        >
        <template #picker
          ><DatePicker :header-selectors="true" :year-range="[2000, 2050]"
        /></template>
        <template #field
          ><DateField :header-selectors="true" :year-range="[2000, 2050]"
        /></template>
      </FeaturePair>
      <FeaturePair title="Multi-month — 2 months">
        <template #desc
          ><code>mode="range" :months="2"</code>. Two months side by side; range bands span
          both.</template
        >
        <template #picker><DatePicker mode="range" :months="2" /></template>
        <template #field><DateField mode="range" :months="2" format="MMM d, yyyy" /></template>
      </FeaturePair>
      <FeaturePair title="Preset shortcuts">
        <template #desc
          ><code>:presets="['today','last7days','last30days','thisMonth','clear']"</code>.</template
        >
        <template #picker>
          <DatePicker
            mode="range"
            :presets="['today', 'last7days', 'last30days', 'thisMonth', 'clear']"
          />
        </template>
        <template #field>
          <DateField
            mode="range"
            :presets="['today', 'last7days', 'last30days', 'thisMonth', 'clear']"
            format="MMM d, yyyy"
          />
        </template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Visual options</h2>
    <div class="pairs">
      <FeaturePair title="Week numbers">
        <template #desc
          >ISO week numbers in a left column. <code>:week-numbers="true"</code>.</template
        >
        <template #picker><DatePicker :week-numbers="true" /></template>
        <template #field><DateField :week-numbers="true" /></template>
      </FeaturePair>
      <FeaturePair title="Highlights — events / holidays">
        <template #desc>Coloured dot under the day; tooltip from <code>label</code>.</template>
        <template #picker
          ><DatePicker :initial-focused="createCalendarDate(2026, 12, 1)" :highlights="holidays"
        /></template>
        <template #field><DateField default-value="2026-12-25" :highlights="holidays" /></template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Time / DateTime</h2>
    <div class="pairs">
      <FeaturePair title="24-hour clock">
        <template #desc><code>:with-time="true"</code>. Default 24-hour.</template>
        <template #picker><DatePicker :with-time="true" /></template>
        <template #field><DateField :with-time="true" format="yyyy-MM-dd HH:mm" /></template>
      </FeaturePair>
      <FeaturePair title="12-hour + seconds + 5-min step">
        <template #desc
          ><code>:with-time :use12-hour-clock :show-seconds :time-step="5"</code>.</template
        >
        <template #picker
          ><DatePicker
            :with-time="true"
            :use12-hour-clock="true"
            :show-seconds="true"
            :time-step="5"
        /></template>
        <template #field
          ><DateField
            :with-time="true"
            :use12-hour-clock="true"
            :show-seconds="true"
            :time-step="5"
            format="yyyy-MM-dd hh:mm:ss a"
        /></template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Granularity</h2>
    <div class="pairs">
      <FeaturePair title="Month picker">
        <template #desc><code>granularity="month"</code>. Pick a month.</template>
        <template #picker><DatePicker granularity="month" /></template>
        <template #field><DateField granularity="month" format="MMM yyyy" /></template>
      </FeaturePair>
      <FeaturePair title="Year picker">
        <template #desc><code>granularity="year"</code>. Pick a year.</template>
        <template #picker><DatePicker granularity="year" /></template>
        <template #field><DateField granularity="year" format="yyyy" /></template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Constraints</h2>
    <div class="pairs">
      <FeaturePair title="min / max">
        <template #desc>Dates outside the range are dimmed and rejected on type + click.</template>
        <template #picker
          ><DatePicker :min="createCalendarDate(2025, 4, 1)" :max="createCalendarDate(2025, 6, 30)"
        /></template>
        <template #field
          ><DateField :min="createCalendarDate(2025, 4, 1)" :max="createCalendarDate(2025, 6, 30)"
        /></template>
      </FeaturePair>
      <FeaturePair title="Range 3–7 days">
        <template #desc
          ><code>:min-range-days="3" :max-range-days="7"</code>. Cells outside the window disable
          after the anchor.</template
        >
        <template #picker
          ><DatePicker mode="range" :min-range-days="3" :max-range-days="7"
        /></template>
        <template #field
          ><DateField mode="range" :min-range-days="3" :max-range-days="7" format="MMM d"
        /></template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Calendar systems</h2>
    <div class="pairs">
      <FeaturePair title="Bikram Sambat — English">
        <template #desc>Months: Baishakh, Jestha, … transliterated.</template>
        <template #picker
          ><DatePicker calendar="bikram-sambat" locale="en-US" :header-selectors="true"
        /></template>
        <template #field
          ><DateField
            calendar="bikram-sambat"
            locale="en-US"
            :header-selectors="true"
            format="MMMM d, yyyy"
        /></template>
      </FeaturePair>
      <FeaturePair title="Bikram Sambat — Nepali Devanagari">
        <template #desc
          ><code>locale="ne-NP"</code> renders Devanagari digits + month names.</template
        >
        <template #picker
          ><DatePicker calendar="bikram-sambat" locale="ne-NP" :header-selectors="true"
        /></template>
        <template #field
          ><DateField
            calendar="bikram-sambat"
            locale="ne-NP"
            :header-selectors="true"
            format="MMMM d, yyyy"
        /></template>
      </FeaturePair>
    </div>

    <h2 class="section-title">Form integration — DateField patterns</h2>
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
          <p><code>format="MMM d, yyyy" value-format="iso"</code>. Pretty display, ISO storage.</p>
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

.pairs {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
  gap: 1.5rem;
  align-items: start;
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
code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.78em;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  background: rgba(15, 23, 42, 0.06);
  color: var(--ink);
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
