# calender — @anil-labs calendar suite

[![CI](https://github.com/anilkumarthakur60/calender/actions/workflows/ci.yml/badge.svg)](https://github.com/anilkumarthakur60/calender/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40anil-labs%2Fcore.svg)](https://www.npmjs.com/package/@anil-labs/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A headless, framework-agnostic calendar / date-picker for **React, Vue, Svelte,
Solid, Angular and Web Components**. One TypeScript state engine drives all of
them. Ships **AD (Gregorian) and BS (Bikram Sambat / Nepali)** calendars out of
the box and an extensible `CalendarSystem` interface for the rest.

```bash
npm install @anil-labs/react @anil-labs/styles      # pick your adapter
```

```tsx
import '@anil-labs/styles';
import { DatePicker } from '@anil-labs/react';

<DatePicker mode="range" months={2} headerSelectors presets={['today', 'last7days', 'clear']} />;
```

---

## Table of contents

- [Packages](#packages)
- [Examples & docs](#examples--docs)
- [Quick start (end users)](#quick-start-end-users)
- [Features](#features)
- [Local development](#local-development)
  - [Prerequisites](#prerequisites)
  - [Clone & install](#clone--install)
  - [Run an example](#run-an-example)
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
  - [Demos → Vercel (one project)](#demos--vercel-one-project)
  - [Docs → GitHub Pages](#docs--github-pages)
  - [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Publishing to npm](#publishing-to-npm)
- [Tech stack](#tech-stack)
- [License](#license)

---

## Packages

| Package                    | What it is                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@anil-labs/core`          | Pure-TS, zero-dep state engine. Domain primitives, selection strategies, constraints, navigation, i18n, keyboard, events.                        |
| `@anil-labs/styles`        | SCSS source + compiled CSS theme. Tokens, light/dark, RTL, density.                                                                              |
| `@anil-labs/web-component` | Framework-free `<calender-picker>` + `<calender-input>` custom elements. Form-associated.                                                        |
| `@anil-labs/react`         | `useDatePicker` hook, `<DatePicker>`, `<DateField>` (React 18+).                                                                                 |
| `@anil-labs/vue`           | `useDatePicker` composable, `<DatePicker>`, `<DateField>` (Vue 3).                                                                               |
| `@anil-labs/svelte`        | `createDatePicker` factory satisfying the Svelte store contract.                                                                                 |
| `@anil-labs/solid`         | `createDatePicker` returning fine-grained Solid signals.                                                                                         |
| `@anil-labs/angular`       | Standalone `DatePickerComponent` + `DatePickerService` (signals, Angular 17+). **In-repo only — not yet on npm** (awaiting an ng-packagr build). |

## Examples & docs

Each framework has a runnable example under `examples/`; the docs site lives in `docs/`.

| Directory          | Package           | What it is                                                                              |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------- |
| `docs`             | `docs`            | **VitePress docs site** — guides, adapter pages, API reference, live demos.             |
| `examples/wc`      | `example-wc`      | Plain HTML + Vite. The most thorough feature showcase, uses the Web Component directly. |
| `examples/vue`     | `example-vue`     | Vue 3 + Vite. Uses `@anil-labs/vue` and the WC together.                                |
| `examples/react`   | `example-react`   | React 18 + Vite.                                                                        |
| `examples/svelte`  | `example-svelte`  | Svelte 5 (runes) + Vite.                                                                |
| `examples/solid`   | `example-solid`   | Solid + Vite.                                                                           |
| `examples/angular` | `example-angular` | Reference snippets only. Angular needs its own `ng new` scaffold.                       |

`pnpm build:demos` assembles every example into a single static site under `dist-demos/` (this is what the Vercel project builds — see [Deployment](#deployment)).

---

## Quick start (end users)

Pick a framework adapter, install it + the styles, render:

**React**

```tsx
import '@anil-labs/styles';
import { DatePicker, DateField } from '@anil-labs/react';

<DatePicker mode="range" onSelect={d => console.log(d)} />
// or input + popover:
<DateField name="bookingDate" defaultValue="2025-04-15" />
```

**Vue**

```vue
<script setup>
import '@anil-labs/styles';
import { DatePicker, DateField } from '@anil-labs/vue';
</script>
<template>
  <DatePicker mode="range" @select="d => console.log(d)" />
  <DateField v-model="iso" />
</template>
```

**Web Component**

```html
<link rel="stylesheet" href="@anil-labs/styles" />
<script type="module">
  import '@anil-labs/web-component/auto-register';
</script>

<calender-picker mode="range" header-selectors></calender-picker>
<calender-input name="bookingDate" value="2025-04-15"></calender-input>
```

**Engine (any framework)**

```ts
import { DatePickerEngine } from '@anil-labs/core';

const engine = new DatePickerEngine({ mode: 'range', calendar: 'bikram-sambat' });
engine.on('change', ({ state }) => render(state));
```

Full guides, every API, every option: **the [VitePress docs site](https://calender.dev)** (or run `pnpm docs:dev` locally).

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
> when `@anil-labs/react` imports `@anil-labs/core`, you get the live source, not
> a stale published copy. **This is a contributor-only choice — end users
> install your published packages with whichever package manager they like.**

### Run an example

Pick one to start with — each has dozens of feature demos:

```bash
pnpm example:wc       # http://localhost:5180  — Web Component (most thorough)
pnpm example:vue      # http://localhost:5173
pnpm example:react    # http://localhost:5174
pnpm example:svelte   # http://localhost:5175
pnpm example:solid    # http://localhost:5176
```

Edits to `packages/core/src/**` show up after a moment (the example rebuilds
the dependency on demand). Edits to a renderer package (`packages/react/src/**`)
hot-reload instantly in its example.

### Run the docs site

```bash
pnpm docs:dev     # http://localhost:5179
```

The docs site embeds live `<calender-picker>` elements via the Web Component.
Most pages have a runnable demo right under the prose.

### Build everything

```bash
pnpm build            # all packages → packages/*/dist
pnpm build:examples   # all examples → examples/*/dist
pnpm build:demos      # assemble every example into dist-demos/ (the deploy artifact)
pnpm build:all        # packages + examples
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
│   ├── core/                    # @anil-labs/core — headless engine
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
│   ├── styles/                  # @anil-labs/styles — SCSS + compiled CSS
│   ├── web-component/           # @anil-labs/web-component
│   ├── react/                   # @anil-labs/react
│   ├── vue/                     # @anil-labs/vue
│   ├── svelte/                  # @anil-labs/svelte
│   ├── solid/                   # @anil-labs/solid
│   └── angular/                 # @anil-labs/angular
├── examples/                    # runnable per-framework demos (private)
│   ├── wc/                      # Plain HTML demo
│   ├── react/                   # React 18 demo
│   ├── vue/                     # Vue 3 demo
│   ├── svelte/                  # Svelte 5 demo
│   ├── solid/                   # Solid demo
│   └── angular/                 # Angular reference snippets
├── docs/                        # VitePress site
├── scripts/build-demos.mjs      # assembles examples → dist-demos/
├── vercel.json                  # single Vercel project → build-demos → dist-demos
├── .github/workflows/           # CI + Docs (Pages) + Release
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
2. Run `pnpm --filter @anil-labs/core test` — extend the suite if you touched behavior.
3. Run `pnpm --filter @anil-labs/core build` — keeps the workspace dist in sync.
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

After editing a renderer, run `pnpm --filter @anil-labs/<adapter> build`. The
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
pnpm --filter @anil-labs/styles build
```

This compiles `calender.css` (minified) + `calender.dev.css` (expanded for
debugging).

### Adding a new feature end-to-end

Walk-through of how a feature flows from idea to rendered pixels:

1. **Decide the engine surface.** Will it be a new option (most common), a new
   state field, or a new command? Add to `engine/engine-options.ts` and/or
   `engine/engine-state.ts`.
2. **Implement in `@anil-labs/core`.** Wire the option into the constructor;
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
8. **Demo in playgrounds.** Add a card to `examples/wc/index.html`,
   `examples/react/src/App.tsx`, and `examples/vue/src/App.vue`.
9. **Document.** Add or extend a page in `docs/guide/`.

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

Steal the shape of `@anil-labs/solid` — it's the smallest:

1. `packages/<framework>/package.json` — workspace dep on `@anil-labs/core`,
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
pnpm --filter @anil-labs/core exec vitest run tests/engine.test.ts
```

To watch:

```bash
pnpm --filter @anil-labs/core exec vitest
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

Two independent, secret-free deploy targets:

### Demos → Vercel (one project)

`scripts/build-demos.mjs` assembles every example into a single static site
under `dist-demos/` (a landing page linking `/wc/`, `/react/`, `/vue/`,
`/svelte/`, `/solid/`). The root `vercel.json` points a **single** Vercel
project at it:

```jsonc
{
  "buildCommand": "node scripts/build-demos.mjs",
  "outputDirectory": "dist-demos",
  "installCommand": "pnpm install",
}
```

On vercel.com: **Add New → Project**, import the repo, keep **Root Directory**
at `/`, deploy. Vercel's native Git integration then auto-deploys `main` to
production and posts a preview URL on every PR — **no tokens, no GitHub secrets,
no per-app matrix**. Run `pnpm build:demos` to reproduce the exact build
locally.

### Docs → GitHub Pages

`.github/workflows/docs.yml` builds the VitePress site and publishes it to
GitHub Pages on any push to `main` that touches `docs/**`. The workflow sets
`DOCS_BASE=/calender/` so assets resolve under the project-site path; the
VitePress config falls back to `/` for local dev and custom domains. Enable it
once under **Settings → Pages → Source: GitHub Actions**.

### CI/CD with GitHub Actions

Three workflows ship in `.github/workflows/`:

| Workflow      | Trigger                    | Does                                                                                                                                                 |
| ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | Every push / PR            | Lint + format-check + build + typecheck + test + package checks (publint/attw) + Node import smoke + build examples + size budgets, on Node 20 & 22. |
| `docs.yml`    | Push to `main` (`docs/**`) | Builds VitePress and deploys it to GitHub Pages.                                                                                                     |
| `release.yml` | Push to `main`             | Changesets: opens the version PR, or publishes to npm with provenance when it merges (needs `NPM_TOKEN`).                                            |

Deployment of the demos needs **no** workflow — Vercel's Git integration
handles it. The only repo secret required anywhere is `NPM_TOKEN`, for releases.

---

## Publishing to npm

The packages live under the `@anil-labs/` scope and release through
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

The `examples/*` and `docs` are `"private": true` and never publish;
`@anil-labs/angular` is also private until validated in a real Angular app.

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
