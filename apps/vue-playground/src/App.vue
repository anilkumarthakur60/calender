<script setup lang="ts">
import { ref } from "vue";
import { DatePicker, useDatePicker } from "@calender/vue";
import { createCalendarDate, type CalendarDate } from "@calender/core";

const lastWcValue = ref<string | null>(null);
const lastVueDate = ref<CalendarDate | null>(null);

const { state, engine } = useDatePicker({
  mode: "range",
  min: createCalendarDate(2024, 1, 1),
  max: createCalendarDate(2026, 12, 31),
});

const handleVueSelect = (d: CalendarDate): void => {
  lastVueDate.value = d;
};

const handleWcChange = (event: Event): void => {
  const detail = (event as CustomEvent<{ value: string | null }>).detail;
  lastWcValue.value = detail.value;
};
</script>

<template>
  <main class="layout">
    <header>
      <h1>@calender — multi-framework playground</h1>
      <p>One headless core engine, multiple renderers.</p>
    </header>

    <section>
      <h2>Web Component (framework-free)</h2>
      <calender-picker
        mode="single"
        locale="en-GB"
        theme="light"
        density="comfortable"
        @cal-change="handleWcChange"
      ></calender-picker>
      <p class="status">Value: {{ lastWcValue ?? "(none)" }}</p>
    </section>

    <section>
      <h2>Vue adapter — range mode</h2>
      <DatePicker
        :mode="'range'"
        :min="createCalendarDate(2024, 1, 1)"
        :max="createCalendarDate(2026, 12, 31)"
        @select="handleVueSelect"
      />
      <p class="status">
        Last clicked:
        {{ lastVueDate ? `${lastVueDate.year}-${lastVueDate.month}-${lastVueDate.day}` : "(none)" }}
      </p>
    </section>

    <section>
      <h2>Headless composable — custom UI</h2>
      <p>
        Focus: {{ state.focused.year }}-{{ state.focused.month }}-{{ state.focused.day }} | View:
        {{ state.view }} | Mode: {{ state.mode }}
      </p>
      <button @click="engine.pagePrev()">← prev</button>
      <button @click="engine.pageNext()">next →</button>
    </section>
  </main>
</template>

<style scoped>
.layout {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
  max-width: 70rem;
  margin: 2rem auto;
  padding: 0 1rem;
  display: grid;
  gap: 2rem;
}
section {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  background: #fff;
}
h2 {
  margin-top: 0;
}
.status {
  margin-top: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #6b7280;
}
button {
  margin-right: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #f9fafb;
  cursor: pointer;
}
</style>
