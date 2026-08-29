# Getting started

`@anil-labs` is a small set of packages. Pick the renderer for your framework and
go  the headless core powers them all.

## Install

::: code-group

```bash [React]
npm install @anil-labs/calendar-react @anil-labs/calendar-styles
```

```bash [Vue]
npm install @anil-labs/calendar-vue @anil-labs/calendar-styles
```

```bash [Web Component]
npm install @anil-labs/calendar-web-component @anil-labs/calendar-styles
```

```bash [Svelte / Solid / Angular]
# Pick the adapter that matches your framework
npm install @anil-labs/calendar-svelte @anil-labs/calendar-styles
npm install @anil-labs/calendar-solid @anil-labs/calendar-styles
npm install @anil-labs/calendar-angular @anil-labs/calendar-styles
```

:::

## Use it

::: code-group

```tsx [React]
import '@anil-labs/calendar-styles';
import { DatePicker } from '@anil-labs/calendar-react';

export default function App() {
  return <DatePicker mode="single" onSelect={d => console.log(d)} />;
}
```

```vue [Vue]
<script setup>
import '@anil-labs/calendar-styles';
import { DatePicker } from '@anil-labs/calendar-vue';

const onSelect = d => console.log(d);
</script>

<template>
  <DatePicker mode="single" @select="onSelect" />
</template>
```

```html [HTML / Web Component]
<link rel="stylesheet" href="https://unpkg.com/@anil-labs/calendar-styles" />
<script type="module">
  import 'https://unpkg.com/@anil-labs/calendar-web-component/auto-register';
</script>

<calender-picker mode="single"></calender-picker>
```

:::

<div class="docs-demo">
  <calender-picker mode="single"></calender-picker>
</div>

## What you get

- **Headless engine**  the picker's state machine has no DOM. The renderers consume an immutable `EngineState` and render it.
- **Selection modes**  `single`, `range`, `multi`.
- **Calendar systems**  Gregorian (default) and Bikram Sambat. Add others by implementing `CalendarSystem`.
- **Constraints**  `min`, `max`, `disabledDates`, `disabledWeekdays`, `minRangeDays`, `maxRangeDays`, any custom `DateConstraint`.
- **Time / DateTime**  `withTime` adds an inline hour/minute (+ seconds, +12h, +step) picker.
- **Format**  token-based formatter (`yyyy MM dd MMMM HH mm a`) with presets (`iso us eu medium long short`) and an opt-in `valueFormat` for divergent display vs storage.

## Next

- [Core concepts](/guide/concepts)  engine, state, calendar abstraction
- [Form integration](/guide/forms)  `DateField` and `<calender-input>` with native form submit, controlled state, react-hook-form
- [Calendar systems (AD / BS)](/guide/bs-calendar)  using Bikram Sambat
