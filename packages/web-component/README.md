# @calender/web-component

Framework-free `<calender-picker>` custom element built on `@calender/core`.

```html
<link rel="stylesheet" href="@calender/styles" />
<script type="module">
  import '@calender/web-component/auto-register';
</script>

<calender-picker mode="range" min="2025-01-01" max="2025-12-31" locale="en-GB" theme="dark"></calender-picker>
```

## Attributes

| Attribute            | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `mode`               | `single` (default), `range`, `multi`                     |
| `min` / `max`        | ISO date bounds                                          |
| `value`              | Initial value (ISO; range = `start/end`; multi = csv)    |
| `locale`             | BCP-47 tag, e.g. `en-GB`                                 |
| `disabled-weekdays`  | Comma-separated `0..6` (Sun..Sat)                        |
| `theme`              | `light`, `dark`, or `auto`                               |
| `density`            | `comfortable` or `dense`                                 |

## Events

- `cal-select` — fires when a date is selected (`detail.date`).
- `cal-change` — fires on any state mutation (`detail.value`, `detail.state`).

## Form association

The element is `form-associated` — its `value` is reported via
`ElementInternals.setFormValue`, so it submits cleanly inside a `<form>`.
