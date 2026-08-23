# Vue 3

```bash
npm install @anil-labs/calendar-vue @anil-labs/calendar-styles
```

```vue
<script setup>
import '@anil-labs/calendar-styles';
import { DatePicker } from '@anil-labs/calendar-vue';
</script>

<template>
  <DatePicker mode="range" />
</template>
```

## Components & composables

### `<DatePicker />`

Render-function based component (no SFC compilation in the published package).
Accepts every engine option as a prop and emits `select` + `change`.

```vue
<DatePicker
  mode="range"
  :months="2"
  :header-selectors="true"
  :week-numbers="true"
  :presets="['today', 'last7days', 'thisMonth', 'clear']"
  :highlights="[{ date: createCalendarDate(2025, 12, 25), color: '#dc2626', label: 'Christmas' }]"
  @select="d => console.log(d)"
  @change="state => console.log(state)"
/>
```

### `<DateField />`

Text input + popover. v-model returns the controlled value (string), formatted
according to `valueFormat` (defaults to `format`).

```vue
<script setup>
import { ref } from 'vue';
import { DateField } from '@anil-labs/calendar-vue';

const iso = ref('2025-04-15');
</script>

<template>
  <DateField v-model="iso" format="MMM d, yyyy" value-format="iso" />
</template>
```

### `useDatePicker(options)`

Composable returning the engine + a `shallowRef<EngineState>`.

```vue
<script setup>
import { useDatePicker } from '@anil-labs/calendar-vue';

const { engine, state } = useDatePicker({ mode: 'single' });
</script>

<template>
  <div>
    Focused: {{ state.focused.year }}-{{ state.focused.month }}-{{ state.focused.day }}
    <button @click="engine.pagePrev()">Previous</button>
  </div>
</template>
```

## Props reference

| Prop               | Type                              | Notes                         |
| ------------------ | --------------------------------- | ----------------------------- |
| `mode`             | `'single' \| 'range' \| 'multi'`  | Default `single`.             |
| `min` / `max`      | `CalendarDate`                    | Bounds.                       |
| `locale`           | `string \| Partial<LocaleConfig>` |                               |
| `calendar`         | `'gregorian' \| 'bikram-sambat'`  |                               |
| `granularity`      | `'day' \| 'month' \| 'year'`      | Terminal view.                |
| `months`           | `number`                          | Multi-month layout.           |
| `weekNumbers`      | `boolean`                         | ISO week column.              |
| `headerSelectors`  | `boolean`                         | Replace title with dropdowns. |
| `yearRange`        | `[number, number]`                | Dropdown year span.           |
| `minRangeDays`     | `number`                          | Range mode only.              |
| `maxRangeDays`     | `number`                          |                               |
| `withTime`         | `boolean`                         | Time picker.                  |
| `timeStep`         | `number`                          | Minute step.                  |
| `use12HourClock`   | `boolean`                         |                               |
| `showSeconds`      | `boolean`                         |                               |
| `disabledWeekdays` | `ReadonlyArray<number>`           |                               |
| `presets`          | `ReadonlyArray<PresetSpec>`       | Default `['today']`.          |
| `highlights`       | `ReadonlyArray<DateHighlight>`    | `{date, color?, label?}`.     |
| `hideFooter`       | `boolean`                         |                               |

## Live example

<div class="docs-demo">
  <calender-picker mode="range" header-selectors months="2"></calender-picker>
</div>
