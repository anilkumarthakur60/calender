# Installation

Every package is published independently on npm. Pick the framework adapter you
need plus `@calender/styles` for the visual layer.

## Packages

| Package                   | What it is                                                   |
| ------------------------- | ------------------------------------------------------------ |
| `@calender/core`          | Headless TS engine. Pulled in transitively by every adapter. |
| `@calender/styles`        | SCSS source + compiled CSS theme.                            |
| `@calender/web-component` | `<calender-picker>` + `<calender-input>` custom elements.    |
| `@calender/react`         | `useDatePicker` hook, `<DatePicker>`, `<DateField>`.         |
| `@calender/vue`           | `useDatePicker` composable, `<DatePicker>`, `<DateField>`.   |
| `@calender/svelte`        | `createDatePicker` factory satisfying the store contract.    |
| `@calender/solid`         | `createDatePicker` returning Solid signals.                  |
| `@calender/angular`       | Standalone `DatePickerComponent` + `DatePickerService`.      |

## Package manager

End users use whatever they prefer:

```bash
npm install @calender/react @calender/styles
yarn add @calender/react @calender/styles
pnpm add @calender/react @calender/styles
bun add @calender/react @calender/styles
```

The repo itself is a **pnpm workspace** for the dev workflow (workspace symlinks,
disk-efficient install). That's a dev-time choice — it doesn't affect end users.

## Styles

Every renderer expects the styles to be loaded. The simplest path:

```ts
import '@calender/styles';
```

Or in HTML:

```html
<link rel="stylesheet" href="@calender/styles" />
```

The CSS is fully driven by CSS custom properties (design tokens). Override any
`--cal-*` variable at any scope to retheme.

```css
.my-app {
  --cal-color-accent: #16a34a;
  --cal-color-range-bg: #dcfce7;
}
```

## TypeScript

Types ship with every package. Strict mode-clean: `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`.

No setup needed — `import { DatePicker } from '@calender/react'` works.
