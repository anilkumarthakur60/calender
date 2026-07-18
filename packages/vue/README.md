# @anil-labs/vue

Vue 3 adapter for [`@anil-labs/core`](https://github.com/anilkumarthakur60/calender/tree/main/packages/core) — a headless, framework-agnostic calendar/date-picker engine. Ships `DatePicker` and `DateField` components plus a `useDatePicker` composable for fully custom UIs.

## Install

```sh
npm install @anil-labs/vue
# optional pre-built theme
npm install @anil-labs/styles
```

## Components

```vue
<script setup lang="ts">
import { DatePicker, DateField } from '@anil-labs/vue';
import type { CalendarDate, EngineState } from '@anil-labs/vue';
import '@anil-labs/styles';

const onSelect = (date: CalendarDate) => console.log('selected', date);
const onChange = (state: EngineState) => console.log('engine state', state);
</script>

<template>
  <DatePicker mode="range" locale="en-GB" @select="onSelect" @change="onChange" />
  <DateField />
</template>
```

`DatePicker` accepts the `DatePickerEngineOptions` fields from `@anil-labs/core` as props (`mode`, `min`, `max`, `locale`, `disabledWeekdays`, `withTime`, `weekNumbers`, `months`, `use12HourClock`, …) and emits:

| Event    | Payload        | Description                         |
| -------- | -------------- | ----------------------------------- |
| `select` | `CalendarDate` | Fires when a day is picked.         |
| `change` | `EngineState`  | Fires on every engine state commit. |

## Headless composable

```vue
<script setup lang="ts">
import { useDatePicker } from '@anil-labs/vue';

const { engine, state } = useDatePicker({ mode: 'single', locale: 'en-GB' });
</script>

<template>
  <div v-for="(week, i) in state.grid.weeks" :key="i">
    <button v-for="cell in week" :key="cell.key" @click="engine.select(cell.date)">
      {{ engine.formatter.formatDay(cell.date) }}
    </button>
  </div>
</template>
```

All core types (`CalendarDate`, `EngineState`, `DatePickerEngineOptions`, …) are re-exported, so `@anil-labs/vue` is the only import you need.

## License

MIT
