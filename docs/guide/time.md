# Time & DateTime

Pass `withTime` to add an inline time picker beneath the day grid.

## 24-hour

```html
<calender-picker with-time></calender-picker>
```

<div class="docs-demo">
  <calender-picker with-time></calender-picker>
</div>

## 12-hour + AM/PM + seconds

```html
<calender-picker with-time clock="12" seconds time-step="5"></calender-picker>
```

<div class="docs-demo">
  <calender-picker with-time clock="12" seconds time-step="5"></calender-picker>
</div>

## Options

| Option           | Default    | Description                                  |
| ---------------- | ---------- | -------------------------------------------- |
| `withTime`       | `false`    | Show the time picker row.                    |
| `use12HourClock` | `false`    | 12-hour with AM/PM toggle. WC: `clock="12"`. |
| `showSeconds`    | `false`    | Display a seconds field. WC: `seconds`.      |
| `timeStep`       | `1`        | Minute step (1, 5, 10, 15, 30).              |
| `initialTime`    | `00:00:00` | Initial time when none picked.               |

## DateTime in a form input

For `<calender-input>` / `DateField` the value automatically includes the time
when `withTime` is on and your format includes time tokens:

```html
<calender-input with-time time-step="15" format="yyyy-MM-dd HH:mm"></calender-input>
```

<div class="docs-demo">
  <calender-input with-time time-step="15" format="yyyy-MM-dd HH:mm"></calender-input>
</div>

## In code

The engine carries a `TimeOfDay | null` alongside the date:

```ts
engine.setTime({ hour: 9, minute: 30, second: 0 });
console.log(engine.state.time); // { hour: 9, minute: 30, second: 0 }
```

When the format pattern contains time tokens, `formatWithPattern` reads from
this value:

```ts
formatWithPattern(
  { year: 2025, month: 4, day: 15 },
  'yyyy-MM-dd HH:mm:ss',
  'en-US',
  engine.calendar,
  { hour: 14, minute: 30, second: 0 },
);
// → "2025-04-15 14:30:00"
```
