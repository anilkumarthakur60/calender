# Visual options

## Themes

Light (default), dark, or auto (matches OS).

```html
<calender-picker theme="dark"></calender-picker> <calender-picker theme="auto"></calender-picker>
```

Or set the class on a wrapper:

```html
<div class="cal-theme-dark">
  <calender-picker></calender-picker>
</div>
```

## Density

```html
<calender-picker density="comfortable"></calender-picker>
<!-- default -->
<calender-picker density="dense"></calender-picker>
```

## RTL

The picker auto-detects RTL from the locale (Arabic, Hebrew, Persian, …).
Arrow-key navigation and range gradients flip automatically.

```html
<calender-picker locale="ar-EG" mode="range"></calender-picker>
```

## Week numbers

ISO week numbers in a column on the left:

```html
<calender-picker week-numbers></calender-picker>
```

<div class="docs-demo">
  <calender-picker week-numbers></calender-picker>
</div>

## Highlighted dates

Mark holidays / events with a colored dot under the number. The label becomes
part of the cell's `aria-label`.

```html
<calender-picker
  highlights="2026-12-25|#dc2626|Christmas, 2026-01-01|#16a34a|New Year"
></calender-picker>
```

::: code-group

```tsx [React]
<DatePicker
  highlights={[
    { date: createCalendarDate(2026, 12, 25), color: '#dc2626', label: 'Christmas' },
    { date: createCalendarDate(2026, 1, 1), color: '#16a34a', label: 'New Year' },
  ]}
/>
```

```vue [Vue]
<DatePicker
  :highlights="[{ date: createCalendarDate(2026, 12, 25), color: '#dc2626', label: 'Christmas' }]"
/>
```

:::

<div class="docs-demo">
  <calender-picker
    min="2026-01-01"
    max="2026-12-31"
    highlights="2026-12-25|#dc2626|Christmas, 2026-01-01|#16a34a|New Year, 2026-07-04|#f59e0b|Independence Day"
  ></calender-picker>
</div>

## Custom theme via tokens

Every visual property is a CSS custom property. Override at any scope:

```css
.brand-app {
  --cal-color-accent: #16a34a;
  --cal-color-accent-soft: #dcfce7;
  --cal-color-range-bg: #f0fdf4;
  --cal-color-today-dot: #16a34a;
  --cal-radius: 0.5rem;
  --cal-cell-size: 2.5rem;
}
```

Full token list lives in `@anil-labs/calendar-styles/scss/tokens.scss`.
