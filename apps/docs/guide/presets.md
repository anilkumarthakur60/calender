# Presets & shortcuts

The footer renders a configurable row of preset chips. Default: just `today`.

## Built-ins

| ID            | Label           | Behaviour                                                  |
| ------------- | --------------- | ---------------------------------------------------------- |
| `today`       | Today           | Select today (or set to [today, today] in range mode).     |
| `yesterday`   | Yesterday       | Select yesterday.                                          |
| `tomorrow`    | Tomorrow        | Select tomorrow.                                           |
| `last7days`   | Last 7 days     | Range: [today−6, today].                                   |
| `last30days`  | Last 30 days    | Range: [today−29, today].                                  |
| `last90days`  | Last 90 days    | Range: [today−89, today].                                  |
| `thisWeek`    | This week       | Range: current week (locale's first day of week).          |
| `thisMonth`   | This month      | Range: full current month.                                 |
| `lastMonth`   | Last month      | Range: full previous month.                                |
| `thisYear`    | This year       | Range: full current year.                                  |
| `clear`       | Clear           | Wipe the selection.                                        |

## Use them

```html
<calender-picker
  mode="range"
  presets="today,last7days,last30days,thisMonth,clear"
></calender-picker>
```

::: code-group

```tsx [React]
<DatePicker mode="range" presets={['today', 'last7days', 'last30days', 'thisMonth', 'clear']} />
```

```vue [Vue]
<DatePicker
  mode="range"
  :presets="['today', 'last7days', 'last30days', 'thisMonth', 'clear']"
/>
```

:::

<div class="docs-demo">
  <calender-picker
    mode="range"
    presets="today,last7days,last30days,thisMonth,clear"
  ></calender-picker>
</div>

## Custom presets (React / Vue)

Pass a `{ id, label, apply }` object instead of a string:

```tsx
import { type DatePreset } from '@calender/core';

const Easter: DatePreset = {
  id: 'easter',
  label: 'Easter',
  apply: e => e.select(createCalendarDate(2025, 4, 20)),
};

<DatePicker presets={['today', Easter]} />
```

The `apply` callback gets the engine instance — drive it however you want
(`select`, `clearSelection`, `setMonth`, `pagePrev`, etc.).

## Resolving presets manually

```ts
import { resolvePresets, BUILTIN_PRESETS } from '@calender/core';

const list = resolvePresets(['today', 'last7days', myCustomPreset]);
// → DatePreset[] ready to render
```
