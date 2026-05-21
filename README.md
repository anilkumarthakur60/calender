# @calender

A headless, framework-agnostic, **most-advanced** calendar / date-picker form
input picker. Built as a pnpm monorepo, written end-to-end in strict TypeScript,
styled with SCSS + CSS custom properties.

## Packages

| Package                   | What it is                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `@calender/core`          | Pure-TS, zero-dep state engine. Domain primitives, selection strategies, constraints, navigation, i18n, keyboard, events. |
| `@calender/styles`        | SCSS source + compiled CSS theme. Tokens, light/dark, RTL, density.                                                       |
| `@calender/web-component` | Framework-free `<calender-picker>` custom element. Form-associated.                                                       |
| `@calender/react`         | `useDatePicker` hook + `<DatePicker>` component (React 18+).                                                              |
| `@calender/vue`           | `useDatePicker` composable + `<DatePicker>` component (Vue 3).                                                            |
| `@calender/svelte`        | `createDatePicker` factory that satisfies the Svelte store contract.                                                      |
| `@calender/solid`         | `createDatePicker` returning fine-grained Solid signals.                                                                  |
| `@calender/angular`       | Standalone `DatePickerComponent` + `DatePickerService` (signals, Angular 17+).                                            |

### Apps

| App                       | Port | Stack                                                            |
| ------------------------- | ---- | ---------------------------------------------------------------- |
| `apps/docs`               | 5179 | **VitePress docs site** — guides, adapter pages, API reference   |
| `apps/wc-playground`      | 5180 | Plain HTML + Vite — uses the `<calender-picker>` element         |
| `apps/vue-playground`     | 5173 | Vue 3 + Vite — uses `@calender/vue` and the WC together          |
| `apps/react-playground`   | 5174 | React 18 + Vite                                                  |
| `apps/svelte-playground`  | 5175 | Svelte 5 (runes) + Vite                                          |
| `apps/solid-playground`   | 5176 | Solid + Vite                                                     |
| `apps/angular-playground` | —    | Reference snippets (Angular CLI required to run, see its README) |

## Architecture (SOLID & modular)

- **Single Responsibility** — every file does one thing: a value object, a strategy, a constraint, a navigator, a formatter, an event bus.
- **Open/Closed** — selection modes and date constraints are added by implementing `SelectionStrategy` / `DateConstraint`. No core changes required.
- **Liskov** — all strategies are interchangeable behind `SelectionStrategy<S>`.
- **Interface Segregation** — `DateConstraint` exposes only `evaluate()`, formatters only formatting, navigator only stepping.
- **Dependency Inversion** — the engine facade depends on abstractions (`SelectionStrategy`, `DateConstraint`); concrete implementations are injected through the factory + options.

## Features

- Single, range, multi-date selection (Strategy pattern, swappable).
- Day / month / year / decade view navigation.
- Min / max, disabled dates, disabled weekdays, custom predicate constraints.
- WAI-ARIA grid keyboard model: arrows, Home/End (row), Ctrl+Home/End (month), PageUp/Down (month), Shift+PageUp/Down (year), Enter/Space (select), Esc (cancel).
- Locale-aware via `Intl.DateTimeFormat` (no extra runtime dep). First-day-of-week and direction (LTR/RTL) auto-resolved per locale.
- **Calendar systems**: AD (Gregorian, default) and BS (Bikram Sambat / Nepali). Add your own by implementing `CalendarSystem`.
- Form association — `<calender-picker>` participates in `<form>` submission via `ElementInternals`.
- Themeable through CSS custom properties (`--cal-*`). Light, dark, RTL, comfortable/dense density.
- Strict TypeScript end-to-end: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`.

## Calendar systems (AD / BS)

The engine operates in **Gregorian (AD)** by default. To use **Bikram Sambat (BS)**,
pass the `calendar` option:

```ts
// Engine
const engine = new DatePickerEngine({
  calendar: 'bikram-sambat',
  locale: 'ne-NP', // Devanagari month names + day digits
  initialFocused: { year: 2080, month: 1, day: 15 }, // BS Baishakh 15, 2080
});

// Web component
// <calender-picker calendar="bikram-sambat" locale="ne-NP"></calender-picker>

// Vue
// <DatePicker calendar="bikram-sambat" locale="ne-NP" />

// React
// <DatePicker calendar="bikram-sambat" locale="ne-NP" />
```

Conversion utilities:

```ts
import { BikramSambatCalendar } from '@calender/core';

const bs = new BikramSambatCalendar();
bs.toGregorian({ year: 2080, month: 1, day: 1 }); // → { year: 2023, month: 4, day: 14 } (approx)
bs.fromGregorian({ year: 2024, month: 1, day: 1 });
```

The supported BS year range is **2000–2099 BS** (≈ 1943–2042 AD). Conversions
relative to the epoch (BS 2000-01-01 = AD 1943-04-14) are exact. The shipped
table is a starter set — for production use that needs pixel-perfect agreement
with current-year Patro publications, supply a custom `CalendarSystem`.

## Installing (end users)

The packages are framework-agnostic on the registry. Use any package manager:

```bash
npm install @calender/core @calender/styles @calender/react
# or
yarn add @calender/core @calender/styles @calender/vue
# or
pnpm add @calender/core @calender/styles @calender/web-component
```

## Developing this repo (contributors)

The monorepo uses **pnpm workspaces** for the dev workflow (workspace symlinks,
disk-efficient install). This is a dev-time choice and doesn't affect end users.

```bash
pnpm install
pnpm -r --filter "./packages/**" run build

# Docs site:
pnpm dev:docs     # http://localhost:5179

# Or any playground:
pnpm dev:wc       # http://localhost:5180
pnpm dev:vue      # http://localhost:5173
pnpm dev:react    # http://localhost:5174
pnpm dev:svelte   # http://localhost:5175
pnpm dev:solid    # http://localhost:5176
```

> Don't have pnpm? `npm install -g pnpm` (or use Corepack: `corepack enable`).

## Using in your app

```ts
// Plain web component
import '@calender/styles';
import '@calender/web-component/auto-register';
// <calender-picker mode="range" min="2025-01-01" max="2025-12-31" />

// React
import { DatePicker } from '@calender/react';
// <DatePicker mode="range" locale="en-GB" onSelect={...} />

// Vue
import { DatePicker } from '@calender/vue';
// <DatePicker :mode="'range'" @select="..." />

// Solid
import { createDatePicker } from '@calender/solid';
const { engine, state } = createDatePicker({ mode: 'range' });

// Svelte 5
import { createDatePicker } from '@calender/svelte';
const { engine, state } = createDatePicker({ mode: 'range' });

// Angular
import { DatePickerComponent } from '@calender/angular';
// <cal-date-picker (select)="..." />
```

## Using inside a `<form>` — `DateField` / `<calender-input>`

For real form usage you want a text input + popover calendar (Stripe / Notion style),
not just the bare grid. We ship that as `DateField` (React / Vue) and `<calender-input>`
(framework-free Web Component). Both are **form-associated** and submit a normalised
ISO value via `name=`.

### Plain HTML form

```html
<form>
  <label>
    Booking date
    <calender-input name="bookingDate" mode="single" value="2025-04-15"></calender-input>
  </label>
  <button type="submit">Submit</button>
</form>
```

`FormData(form).get('bookingDate')` returns `"2025-04-15"`. Range becomes
`"start/end"`, multi becomes a CSV. The user can also **type** into the input
(`"2025-04-15"`, `"4/15/2025"`, …); on blur the value is lenient-parsed and
normalised.

### React — controlled

```tsx
import { DateField } from '@calender/react';

const [date, setDate] = useState('2025-04-15');

<DateField value={date} onChange={setDate} mode="single" min={createCalendarDate(2025, 1, 1)} />;
```

### React — uncontrolled inside a native form

```tsx
<form
  onSubmit={e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    submit(data.get('bookingDate'));
  }}
>
  <DateField name="bookingDate" defaultValue="2025-04-15" mode="single" />
  <button type="submit">Submit</button>
</form>
```

### React — with react-hook-form

```tsx
import { Controller, useForm } from 'react-hook-form';

const { control, handleSubmit } = useForm({ defaultValues: { dob: '' } });

<form onSubmit={handleSubmit(data => submit(data))}>
  <Controller
    control={control}
    name="dob"
    rules={{ required: 'Pick a date' }}
    render={({ field }) => <DateField value={field.value} onChange={field.onChange} />}
  />
  <button type="submit">Submit</button>
</form>;
```

### Vue — v-model

```vue
<script setup>
import { ref } from 'vue';
import { DateField } from '@calender/vue';

const date = ref('2025-04-15');
</script>

<template>
  <DateField v-model="date" mode="single" />
</template>
```

### Vue — form submit (no v-model)

```vue
<form @submit.prevent="onSubmit">
  <DateField name="bookingDate" mode="single" />
  <button type="submit">Submit</button>
</form>
```

### DateField props (React & Vue, parity)

| Prop                   | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `name`                 | Native form input name. Emits a hidden `<input>`.                       |
| `value` / `v-model`    | Controlled ISO value.                                                   |
| `defaultValue` (React) | Initial value when uncontrolled.                                        |
| `onChange` / `@change` | Fires whenever the value commits (pick OR parse-on-blur).               |
| `mode`                 | `'single'` (default), `'range'`, `'multi'`.                             |
| `min` / `max`          | `CalendarDate` bounds.                                                  |
| `locale`               | BCP-47 tag, e.g. `'en-GB'`, `'ne-NP'`.                                  |
| `calendar`             | `'gregorian'` (default) or `'bikram-sambat'`.                           |
| `placeholder`          | Defaults to `YYYY-MM-DD` / `YYYY-MM-DD / YYYY-MM-DD` / `YYYY-MM-DD, …`. |
| `disabled`             | Disable both input and trigger.                                         |
| `disabledWeekdays`     | E.g. `[0, 6]` to disable Sun/Sat.                                       |
| `inputProps` (React)   | Forwarded to the underlying `<input>`.                                  |
