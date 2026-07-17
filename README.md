# @calender

[![CI](https://github.com/anilkumarthakur60/calender/actions/workflows/ci.yml/badge.svg)](https://github.com/anilkumarthakur60/calender/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40calender%2Fcore.svg)](https://www.npmjs.com/package/@calender/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A headless, framework-agnostic calendar / date-picker for **React, Vue, Svelte,
Solid, Angular and Web Components**. One TypeScript state engine drives all of
them. Ships **AD (Gregorian) and BS (Bikram Sambat / Nepali)** calendars out of
the box and an extensible `CalendarSystem` interface for the rest.

```bash
npm install @calender/react @calender/styles      # pick your adapter
```

```tsx
import '@calender/styles';
import { DatePicker } from '@calender/react';

<DatePicker mode="range" months={2} headerSelectors presets={['today', 'last7days', 'clear']} />;
```

---

## Table of contents

- [Packages](#packages)
- [Apps](#apps)
- [Quick start (end users)](#quick-start-end-users)
- [Features](#features)
- [Local development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Clone & install](#clone--install)
  - [Run a playground](#run-a-playground)
  - [Run the docs site](#run-the-docs-site)
  - [Build everything](#build-everything)
  - [Test, lint, format](#test-lint-format)
- [Project structure](#project-structure)
- [Working on the code](#working-on-the-code)
  - [Editing the engine](#editing-the-engine)
  - [Editing the renderers / adapters](#editing-the-renderers--adapters)
  - [Editing styles](#editing-styles)
  - [Adding a new feature end-to-end](#adding-a-new-feature-end-to-end)
  - [Adding a new calendar system](#adding-a-new-calendar-system)
  - [Adding a new framework adapter](#adding-a-new-framework-adapter)
  - [Adding a test](#adding-a-test)
- [Architecture](#architecture)
- [Deployment](#deployment)
  - [Vercel (recommended)](#vercel-recommended)
  - [Cloudflare Pages](#cloudflare-pages)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Publishing to npm](#publishing-to-npm)
- [Tech stack](#tech-stack)
- [License](#license)

---

## Packages

| Package                   | What it is                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@calender/core`          | Pure-TS, zero-dep state engine. Domain primitives, selection strategies, constraints, navigation, i18n, keyboard, events.                        |
| `@calender/styles`        | SCSS source + compiled CSS theme. Tokens, light/dark, RTL, density.                                                                              |
| `@calender/web-component` | Framework-free `<calender-picker>` + `<calender-input>` custom elements. Form-associated.                                                        |
| `@calender/react`         | `useDatePicker` hook, `<DatePicker>`, `<DateField>` (React 18+).                                                                                 |
| `@calender/vue`           | `useDatePicker` composable, `<DatePicker>`, `<DateField>` (Vue 3).                                                                               |
| `@calender/svelte`        | `createDatePicker` factory satisfying the Svelte store contract.                                                                                 |
| `@calender/solid`         | `createDatePicker` returning fine-grained Solid signals.                                                                                         |
| `@calender/angular`       | Standalone `DatePickerComponent` + `DatePickerService` (signals, Angular 17+). **In-repo only — not yet on npm** (awaiting an ng-packagr build). |

## Apps

| App                       | Port | What it is                                                                                               |
| ------------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| `apps/docs`               | 5179 | **VitePress docs site** — guides, adapter pages, API reference, live demos.                              |
| `apps/wc-playground`      | 5180 | Plain HTML + Vite. The most thorough feature showcase, uses the Web Component directly.                  |
| `apps/vue-playground`     | 5173 | Vue 3 + Vite. Uses `@calender/vue` and the WC together.                                                  |
| `apps/react-playground`   | 5174 | React 18 + Vite.                                                                                         |
| `apps/svelte-playground`  | 5175 | Svelte 5 (runes) + Vite.                                                                                 |
| `apps/solid-playground`   | 5176 | Solid + Vite.                                                                                            |
| `apps/angular-playground` | —    | Reference snippets only. Angular needs its own `ng new` scaffold; the directory shows how to wire it up. |

---

## Quick start (end users)

Pick a framework adapter, install it + the styles, render:

**React**

```tsx
import '@calender/styles';
import { DatePicker, DateField } from '@calender/react';

<DatePicker mode="range" onSelect={d => console.log(d)} />
// or input + popover:
<DateField name="bookingDate" defaultValue="2025-04-15" />
```

**Vue**

```vue
<script setup>
import '@calender/styles';
import { DatePicker, DateField } from '@calender/vue';
</script>
<template>
  <DatePicker mode="range" @select="d => console.log(d)" />
  <DateField v-model="iso" />
</template>
```

**Web Component**

```html
<link rel="stylesheet" href="@calender/styles" />
<script type="module">
  import '@calender/web-component/auto-register';
</script>

<calender-picker mode="range" header-selectors></calender-picker>
<calender-input name="bookingDate" value="2025-04-15"></calender-input>
```

**Engine (any framework)**

```ts
import { DatePickerEngine } from '@calender/core';

const engine = new DatePickerEngine({ mode: 'range', calendar: 'bikram-sambat' });
engine.on('change', ({ state }) => render(state));
```

Full guides, every API, every option: **the [VitePress docs site](https://calender.dev)** (or run `pnpm dev:docs` locally).

---

## Features

- **Selection modes**: `single`, `range`, `multi`. Range gets a hover preview before the second click.
- **Calendar systems**: Gregorian (default) and Bikram Sambat. Add your own by implementing `CalendarSystem`.
- **Views**: day, month, year, decade — drill in/out via the header.
- **Header dropdowns**: pass `headerSelectors` for `<select>`-based month + year navigation.
- **Multi-month layout**: render N grids side-by-side.
- **Week numbers**: ISO week numbers in a left column.
- **Highlighted dates**: per-date dots (events, holidays) with optional tooltip labels.
- **Presets**: built-in `today`, `yesterday`, `last7days`, `last30days`, `thisWeek`, `thisMonth`, `lastMonth`, `thisYear`, `clear`. Add custom ones via `{id, label, apply}`.
- **Time picker**: optional `withTime` row — 12 or 24-hour, AM/PM, optional seconds, configurable minute step.
- **Custom format**: token-based formatter (`yyyy MM dd MMMM HH mm a`) with six presets. `format` and `valueFormat` props let display and storage diverge.
- **Constraints**: `min`/`max`, `disabledDates`, `disabledWeekdays`, `minRangeDays`/`maxRangeDays`, plus any custom `DateConstraint` predicate.
- **Form-associated**: `<calender-picker>` and `<calender-input>` participate in `<form>` submission via `ElementInternals`. React/Vue `DateField` emits a hidden `<input>`.
- **Accessibility**: WAI-ARIA grid role, full keyboard model (arrows, Home/End, PageUp/Down, Enter/Esc), `prefers-reduced-motion` honored.
- **Themeable**: every visual property is a CSS custom property. Light, dark, auto, RTL, comfortable, dense.
- **Strict TypeScript**: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`.

---

## Local development

### Prerequisites

- **Node.js ≥ 20** (`node --version` to check)
- **pnpm 10** (`npm i -g pnpm` or `corepack enable`)
- **Git**

That's it. No system-level deps.

### Clone & install

```bash
git clone https://github.com/anilkumarthakur60/calender.git
cd calender
pnpm install --frozen-lockfile
```

The first install symlinks the workspace packages and pulls roughly ~500 MB of
node_modules (pnpm content-addresses the global store so subsequent installs
are fast).

> Why pnpm? The monorepo uses `workspace:*` to wire local packages together —
> when `@calender/react` imports `@calender/core`, you get the live source, not
> a stale published copy. **This is a contributor-only choice — end users
> install your published packages with whichever package manager they like.**

### Run a playground

Pick one to start with — each has dozens of feature demos:

```bash
pnpm dev:wc       # http://localhost:5180  — Web Component (most thorough)
pnpm dev:vue      # http://localhost:5173
pnpm dev:react    # http://localhost:5174
pnpm dev:svelte   # http://localhost:5175
pnpm dev:solid    # http://localhost:5176
```

Edits to `packages/core/src/**` show up after a moment (the playground rebuilds
the dependency on demand). Edits to a renderer package (`packages/react/src/**`)
hot-reload instantly in its playground.

### Run the docs site

```bash
pnpm dev:docs     # http://localhost:5179
```

The docs site embeds live `<calender-picker>` elements via the Web Component.
Most pages have a runnable demo right under the prose.

### Build everything

```bash
pnpm build         # all packages → packages/*/dist
pnpm build:apps    # all playgrounds + docs → apps/*/dist
pnpm build:all     # both
```

### Test, lint, format

```bash
pnpm test          # vitest across the workspace
pnpm check         # lint + format:check + typecheck + test in one go
pnpm lint          # eslint across the repo
pnpm lint:fix      # auto-fix
pnpm format        # prettier --write
pnpm format:check  # CI mode
pnpm typecheck     # tsc --noEmit per package
```

CI runs all of these on every push and PR (`.github/workflows/ci.yml`).

---

## Project structure

```
calender/
├── packages/                    # publishable libraries
│   ├── core/                    # @calender/core — headless engine
│   │   ├── src/
│   │   │   ├── calendar/         #  CalendarSystem + Gregorian + BS
│   │   │   ├── constraints/      #  DateConstraint impls (Composite pattern)
│   │   │   ├── domain/           #  CalendarDate, DateRange, MonthGrid value objects
│   │   │   ├── engine/           #  DatePickerEngine facade, state, highlights, presets
│   │   │   ├── events/           #  Typed EventBus
│   │   │   ├── focus/            #  Keyboard controller (pure key→action)
│   │   │   ├── i18n/             #  Locale, formatter, parser, format engine
│   │   │   ├── navigation/       #  ViewMode + step functions
│   │   │   └── selection/        #  SelectionStrategy impls (Strategy pattern)
│   │   └── tests/                #  vitest
│   ├── styles/                  # @calender/styles — SCSS + compiled CSS
│   ├── web-component/           # @calender/web-component
│   ├── react/                   # @calender/react
│   ├── vue/                     # @calender/vue
│   ├── svelte/                  # @calender/svelte
│   ├── solid/                   # @calender/solid
│   └── angular/                 # @calender/angular
├── apps/
│   ├── docs/                    # VitePress site
│   ├── wc-playground/           # Plain HTML demo
│   ├── react-playground/        # React 18 demo
│   ├── vue-playground/          # Vue 3 demo
│   ├── svelte-playground/       # Svelte 5 demo
│   ├── solid-playground/        # Solid demo
│   └── angular-playground/      # Angular reference snippets
├── .github/workflows/           # CI + Deploy + Preview
├── .vscode/                     # Editor config
├── eslint.config.js
├── .prettierrc.json
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Working on the code

### Editing the engine

`packages/core/src/` is the heart of the project. Most features start here.

The **engine facade** lives at `engine/date-picker-engine.ts`. It composes:

- A `SelectionStrategy` (single / range / multi) — see `selection/`
- A `CalendarSystem` (Gregorian / BS) — see `calendar/`
- A `CompositeConstraint` (min/max, disabled dates, weekdays, custom) — see `constraints/`
- A `DateFormatter` and the token-pattern engine — see `i18n/`
- A typed `EventBus` for `change | select | focus | view | hover | time | open | close`

The engine produces an **immutable `EngineState`** snapshot on every mutation
(`engine/engine-state.ts`). Renderers subscribe to `change` and re-render from
this snapshot — they never reach into the engine's internals.

When you change the engine:

1. Update the relevant `engine/`, `selection/`, `constraints/`, etc.
2. Run `pnpm --filter @calender/core test` — extend the suite if you touched behavior.
3. Run `pnpm --filter @calender/core build` — keeps the workspace dist in sync.
4. The renderers will pick up the new behavior automatically since they consume `EngineState`.

### Editing the renderers / adapters

Each adapter is **a thin reactive binding** to the engine:

| Adapter | Reactivity primitive                     |
| ------- | ---------------------------------------- |
| React   | `useSyncExternalStore` (concurrent-safe) |
| Vue     | `shallowRef` (engine emits frozen state) |
| Svelte  | Store contract (`subscribe(listener)`)   |
| Solid   | `createSignal`                           |
| Angular | `signal()` (signals API)                 |
| WC      | DOM events (`change` listener on engine) |

The reference renderer is `packages/web-component/src/picker-renderer.ts` —
when you ship a new feature it's worth keeping this and the React + Vue
renderers in sync.

After editing a renderer, run `pnpm --filter @calender/<adapter> build`. The
relevant playground hot-reloads automatically.

### Editing styles

`packages/styles/src/scss/`:

- `_tokens.scss` — design tokens (palette, type, motion). All visual style
  comes from CSS custom properties.
- `_root.scss` — `:root` + theme variants (light / dark / auto / density).
- `_picker.scss` — picker, cells, ranges, hover preview, time, footer,
  DateField input + popover.
- `calender.scss` — entry point (just `@use` the above).

After editing:

```bash
pnpm --filter @calender/styles build
```

This compiles `calender.css` (minified) + `calender.dev.css` (expanded for
debugging).

### Adding a new feature end-to-end

Walk-through of how a feature flows from idea to rendered pixels:

1. **Decide the engine surface.** Will it be a new option (most common), a new
   state field, or a new command? Add to `engine/engine-options.ts` and/or
   `engine/engine-state.ts`.
2. **Implement in `@calender/core`.** Wire the option into the constructor;
   add a getter or command method on `DatePickerEngine`; emit an event if it
   produces state changes.
3. **Export from the barrel.** `packages/core/src/index.ts`.
4. **Tests.** Add a vitest case to `packages/core/tests/`. The pattern is
   small and self-contained — most features land in 20–30 lines of test.
5. **Render it.** Update the WC renderer first
   (`packages/web-component/src/picker-renderer.ts`) — it's the canonical
   reference. Then mirror the change in React (`packages/react/src/date-picker.tsx`)
   and Vue (`packages/vue/src/DatePicker.ts`).
6. **Style it.** Add the necessary selectors to `_picker.scss`. The renderers
   emit `data-*` attributes; the styles consume them.
7. **Surface in adapter props.** Add the prop to React + Vue's prop types,
   and to the WC's `STANDARD_OBSERVED_ATTRS` (`packages/web-component/src/attributes.ts`).
8. **Demo in playgrounds.** Add a card to `apps/wc-playground/index.html`,
   `apps/react-playground/src/App.tsx`, and `apps/vue-playground/src/App.vue`.
9. **Document.** Add or extend a page in `apps/docs/guide/`.

End-to-end PRs typically touch one engine file + 3 renderers + 1 SCSS file

- 3 playground files + 1 docs page. ~150–400 lines.

### Adding a new calendar system

The `CalendarSystem` interface is the extension point. To add (say) Hijri:

```ts
// packages/core/src/calendar/hijri-calendar.ts
import type { CalendarSystem } from './calendar-system.js';

export class HijriCalendar implements CalendarSystem {
  readonly id = 'hijri' as const;
  readonly displayName = 'Hijri';
  readonly monthsInYear = 12;

  daysInMonth(year: number, month: number): number {
    /* … */
  }
  addDays(date: CalendarDate, n: number): CalendarDate {
    /* … */
  }
  // … 12 more methods — see CalendarSystem in src/calendar/calendar-system.ts
}
```

Register it in `calendar/calendar-factory.ts` so `calendar: 'hijri'` works.
Add its tests. That's it — every renderer, the formatter, the pattern engine,
the grid all flow through the abstraction and pick up the new calendar for
free.

### Adding a new framework adapter

Steal the shape of `@calender/solid` — it's the smallest:

1. `packages/<framework>/package.json` — workspace dep on `@calender/core`,
   peer dep on the framework, `tsup` build like the others.
2. `packages/<framework>/src/create-date-picker.ts` — instantiate
   `DatePickerEngine`, mirror its state into the framework's reactivity
   primitive, dispose on cleanup.
3. (Optional) `packages/<framework>/src/<DatePicker>.ts` — a component that
   renders the picker using the framework's idioms.
4. Barrel + tsup config + README + playground.

The hard work is the engine, which the new adapter doesn't touch.

### Adding a test

Tests live alongside the package they cover, under a `tests/` directory.
To run a single file:

```bash
pnpm --filter @calender/core exec vitest run tests/engine.test.ts
```

To watch:

```bash
pnpm --filter @calender/core exec vitest
```

---

## Architecture

The project is deliberately layered to enforce **SOLID**:

- **Single Responsibility** — every file does one thing: a value object, a
  selection strategy, a date constraint, a navigator, a formatter, an event bus.
- **Open/Closed** — selection modes and date constraints are added by
  implementing `SelectionStrategy` / `DateConstraint`. No core changes
  required. New calendars likewise via `CalendarSystem`.
- **Liskov** — all strategies / constraints / calendar systems are
  interchangeable behind their interfaces.
- **Interface Segregation** — `DateConstraint` exposes only `evaluate()`,
  formatters only formatting, navigator only stepping.
- **Dependency Inversion** — `DatePickerEngine` depends on abstractions
  (`SelectionStrategy`, `DateConstraint`, `CalendarSystem`). Concrete
  implementations are injected through the factory + options.

The rendering layer is intentionally **separate** from the state layer. The
engine has no DOM imports anywhere; every renderer consumes the same
immutable `EngineState` and produces its own DOM.

---

## Deployment

Every app (docs + 5 playgrounds) builds to **static HTML/JS/CSS**. Any static
host works. Repo ships with `vercel.json` per app and GitHub Actions
workflows ready to push.

### Vercel (recommended)

The set-up shipped in the repo. One Vercel project per app (6 total). On vercel.com:

1. Click **Add New → Project** and import the repo.
2. **Critical**: set **Root Directory** → `apps/<app-name>` in project settings.
3. Vercel auto-reads the app's `vercel.json` (already includes the
   monorepo-aware install/build commands).
4. Click **Deploy**.
5. Repeat for the other apps.

Map subdomains in each project's **Settings → Domains** (`calender.dev`,
`wc.calender.dev`, `react.calender.dev`, etc.).

### Cloudflare Pages

Best free tier (unlimited bandwidth, fast CDN). For each app:

- **Root directory**: `/`
- **Build command**: `pnpm install --frozen-lockfile && pnpm -r --filter "./packages/**" run build && pnpm --filter @calender/<app> run build`
- **Build output directory**: `apps/<app>/dist`
- **Env vars**: `NODE_VERSION=20`, `PNPM_VERSION=10`

### Netlify

Same shape per app:

- **Base directory**: `apps/<app>`
- **Build command**: `cd ../.. && pnpm install --frozen-lockfile && pnpm -r --filter "./packages/**" run build && pnpm --filter @calender/<app> run build`
- **Publish directory**: `apps/<app>/dist`

### GitHub Pages

One Pages site under `<user>.github.io/calender/` with subpaths. Each
playground needs Vite's `base` set to its subpath (e.g.
`base: '/calender/wc/'`) so assets resolve. Less flexible than the others —
pick Vercel/Cloudflare if you can.

### CI/CD with GitHub Actions

Three workflows ship in `.github/workflows/`:

| Workflow      | Trigger         | Does                                                                                                        |
| ------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | Every push / PR | Lint + format-check + typecheck + build + test + package checks (publint/attw) + build apps + size budgets. |
| `release.yml` | Push to `main`  | Changesets: opens the version PR, or publishes to npm with provenance when it merges.                       |
| `deploy.yml`  | Push to `main`  | Matrix-deploys all 6 apps to Vercel in parallel via the Vercel CLI.                                         |
| `preview.yml` | Every PR        | Deploys preview URLs for all 6 apps to the PR's run summary.                                                |

To enable the deploy + preview workflows, add these GitHub repo secrets
(Settings → Secrets and variables → Actions):

| Secret                     | Source                                                  |
| -------------------------- | ------------------------------------------------------- |
| `VERCEL_TOKEN`             | vercel.com → Account Settings → Tokens                  |
| `VERCEL_ORG_ID`            | Run `vercel link` once locally → `.vercel/project.json` |
| `VERCEL_PROJECT_ID_DOCS`   | Each Vercel project → Settings → General → Project ID   |
| `VERCEL_PROJECT_ID_WC`     |                                                         |
| `VERCEL_PROJECT_ID_REACT`  |                                                         |
| `VERCEL_PROJECT_ID_VUE`    |                                                         |
| `VERCEL_PROJECT_ID_SVELTE` |                                                         |
| `VERCEL_PROJECT_ID_SOLID`  |                                                         |

If you'd rather not maintain CI, **delete `deploy.yml` and `preview.yml`** —
Vercel's native Git integration auto-deploys every push to main + opens
preview URLs on every PR.

---

## Publishing to npm

The packages live under the `@calender/` scope and release through
[Changesets](https://github.com/changesets/changesets), fully automated by
`.github/workflows/release.yml`:

1. Land your change with a changeset (`pnpm changeset` — pick the bump, write
   the summary). CI on `main` then opens/updates a **"chore: version packages"**
   PR.
2. Merge that PR → the workflow builds, tests, and publishes every changed
   package to npm with **provenance attestation** (requires the `NPM_TOKEN`
   repo secret).

Manual escape hatch (rarely needed):

```bash
pnpm build && pnpm -r --filter "./packages/**" publish --access public
```

The `apps/*` are `"private": true` and never publish; `@calender/angular` is
also private until its build moves to ng-packagr.

---

## Tech stack

| Concern              | Choice                                                            |
| -------------------- | ----------------------------------------------------------------- |
| Language             | TypeScript ~6.0 (strict, `noUncheckedIndexedAccess`, etc.)        |
| Monorepo             | pnpm 10 workspaces                                                |
| Build (libraries)    | tsup (esbuild + rollup-style dts)                                 |
| Build (apps)         | Vite                                                              |
| Docs                 | VitePress                                                         |
| Tests                | Vitest                                                            |
| Lint                 | ESLint 9 flat config + typescript-eslint + eslint-config-prettier |
| Format               | Prettier 3                                                        |
| Styles               | SCSS source → compiled CSS, design-token driven                   |
| CI/CD                | GitHub Actions + Vercel CLI                                       |
| Runtime requirements | Node ≥ 20 (development); modern evergreen browsers (consumers)    |

---

## License

MIT.
