# Web Component

Framework-free. Just an import and a custom element. Works in plain HTML, any
framework, any platform.

```bash
npm install @anil-labs/web-component @anil-labs/styles
```

```ts
import '@anil-labs/styles';
import '@anil-labs/web-component/auto-register';
```

Now use `<calender-picker>` or `<calender-input>` anywhere:

```html
<calender-picker mode="range" header-selectors></calender-picker>
```

<div class="docs-demo">
  <calender-picker mode="range" header-selectors></calender-picker>
</div>

## Two elements

- **`<calender-picker>`** — the bare grid. Form-associated via
  `ElementInternals`; clicking dates updates the form value.
- **`<calender-input>`** — text input + popover containing the picker. Type or
  pick. Lenient parse on blur. Same form behaviour.

## Attributes

Both elements share the same attribute surface (`<calender-input>` adds `format`, `value-format`, `placeholder`, `disabled`).

| Attribute              | Type       | Description                                        |
| ---------------------- | ---------- | -------------------------------------------------- |
| `mode`                 | string     | `single` (default), `range`, `multi`               |
| `min` / `max`          | ISO date   | Bounds                                             |
| `value`                | string     | Initial value                                      |
| `locale`               | BCP-47     | `en-GB`, `ne-NP`, …                                |
| `calendar`             | string     | `gregorian` (default), `bikram-sambat`             |
| `granularity`          | string     | `day` (default), `month`, `year`                   |
| `months`               | number     | Render N months side-by-side (default 1)           |
| `week-numbers`         | boolean    | Show ISO week-number column                        |
| `header-selectors`     | boolean    | Replace title with month + year dropdowns          |
| `year-range`           | `S-E`      | E.g. `2000-2050` for the year dropdown             |
| `min-range-days`       | number     | Minimum range length (range mode)                  |
| `max-range-days`       | number     | Maximum range length                               |
| `disabled-weekdays`    | csv        | `0,6` blocks Sun + Sat                             |
| `disabled-dates`       | csv        | `2025-12-25, 2026-01-01`                           |
| `with-time`            | boolean    | Show time picker                                   |
| `time-step`            | number     | Minute step (1, 5, 10, 15, 30)                     |
| `clock`                | `12`\|`24` | 12-hour with AM/PM                                 |
| `seconds`              | boolean    | Show seconds field                                 |
| `theme`                | string     | `light` (default), `dark`, `auto`                  |
| `density`              | string     | `comfortable` (default), `dense`                   |
| `presets`              | csv        | `today,last7days,clear`                            |
| `highlights`           | string     | `YYYY-MM-DD\|#color\|label, …` separated by commas |
| `name`                 | string     | Form input name                                    |
| `format` (input)       | string     | Display format pattern or preset                   |
| `value-format` (input) | string     | Storage format (defaults to `format`)              |
| `placeholder` (input)  | string     | Override default hint                              |
| `disabled` (input)     | boolean    | Disable input + trigger                            |

## Events

```js
const picker = document.querySelector('calender-picker');

picker.addEventListener('cal-select', e => {
  console.log(e.detail.date); // { year, month, day }
});

picker.addEventListener('cal-change', e => {
  console.log(e.detail.value); // ISO string OR range "start/end" OR multi csv
});
```

## Form integration

```html
<form>
  <label>
    Booking date
    <calender-input name="bookingDate" value="2025-04-15"></calender-input>
  </label>
  <button type="submit">Submit</button>
</form>
```

`FormData(form).get('bookingDate')` returns the current value.

## Defining a custom tag name

If `calender-picker` collides with something else:

```ts
import { defineCalenderPicker, defineCalenderInput } from '@anil-labs/web-component';

defineCalenderPicker('my-date-picker');
defineCalenderInput('my-date-input');
```
