---
layout: home

hero:
  name: '@calender'
  text: "One headless engine.\nEvery modern framework."
  tagline: Calendar / date-picker for React, Vue, Svelte, Solid, Angular & Web Components. AD + Bikram Sambat out of the box.
  image:
    src: /calendar.svg
    alt: '@calender'
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Adapters
      link: /adapters/react
    - theme: alt
      text: View on GitHub
      link: https://github.com/

features:
  - icon: 🧠
    title: Headless core
    details: Pure-TS state engine with zero runtime deps. Strategy-pattern selection, composable constraints, calendar-system abstraction.
  - icon: 🎯
    title: Framework adapters
    details: React 18 hook + component, Vue 3 composable + component, Svelte 5 store, Solid signal, Angular standalone — and a framework-free Web Component.
  - icon: 📅
    title: AD + BS calendar
    details: Gregorian by default. Pass calendar="bikram-sambat" for the Nepali calendar with Devanagari numerals + month names. Roll your own via CalendarSystem.
  - icon: 🔣
    title: Custom format
    details: Token-based formatter — yyyy MM dd MMMM HH mm a. Six built-in presets. Format + valueFormat let display and storage diverge.
  - icon: 🪟
    title: Form input + popover
    details: DateField (React/Vue) and <calender-input> wrap an input with a popover calendar. Form-associated. Lenient parse on blur.
  - icon: ⌨️
    title: WAI-ARIA grid
    details: Full keyboard model — arrows, Home/End, PageUp/Down, Enter/Esc. Roving tabindex. Screen-reader labels include the formatted date.
  - icon: 🎨
    title: Themeable
    details: SCSS source + compiled CSS driven entirely by CSS custom properties. Light / dark / RTL / dense out of the box.
  - icon: ⚡
    title: Time + DateTime
    details: with-time gives an inline time picker. 12 or 24-hour clock, AM/PM, optional seconds, configurable minute step.
  - icon: 🪐
    title: Polished UX
    details: Range hover preview, multi-month layout, week numbers, configurable presets (Last 7 days, This month, …), highlighted dates with dots, clear button.
---

## Quick taste

::: code-group

```html [HTML]
<link rel="stylesheet" href="@calender/styles" />
<script type="module">
  import '@calender/web-component/auto-register';
</script>

<calender-picker mode="range" header-selectors></calender-picker>
```

```tsx [React]
import { DatePicker } from '@calender/react';

<DatePicker mode="range" headerSelectors months={2} presets={['today', 'last7days']} />;
```

```vue [Vue]
<script setup>
import { DatePicker } from '@calender/vue';
</script>
<template>
  <DatePicker mode="range" :header-selectors="true" :months="2" />
</template>
```

```ts [Engine (any framework)]
import { DatePickerEngine } from '@calender/core';

const engine = new DatePickerEngine({ mode: 'range', calendar: 'bikram-sambat' });
engine.on('change', ({ state }) => render(state));
```

:::

<div class="docs-demo">
  <calender-picker mode="single" header-selectors></calender-picker>
</div>
