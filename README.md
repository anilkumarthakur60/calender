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

### Playgrounds (one per adapter)

| App                        | Port | Stack                                                  |
| -------------------------- | ---- | ------------------------------------------------------ |
| `apps/wc-playground`       | 5180 | Plain HTML + Vite — uses the `<calender-picker>` element |
| `apps/vue-playground`      | 5173 | Vue 3 + Vite — uses `@calender/vue` and the WC together |
| `apps/react-playground`    | 5174 | React 18 + Vite                                        |
| `apps/svelte-playground`   | 5175 | Svelte 5 (runes) + Vite                                |
| `apps/solid-playground`    | 5176 | Solid + Vite                                           |
| `apps/angular-playground`  | —    | Reference snippets (Angular CLI required to run, see its README) |

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
- Form association — `<calender-picker>` participates in `<form>` submission via `ElementInternals`.
- Themeable through CSS custom properties (`--cal-*`). Light, dark, RTL, comfortable/dense density.
- Strict TypeScript end-to-end: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`.

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

# Open any playground:
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
