# Installation

Every package is published independently on npm. Pick the framework adapter you
need plus `@anil-labs/styles` for the visual layer.

## Packages

| Package                    | What it is                                                   |
| -------------------------- | ------------------------------------------------------------ |
| `@anil-labs/core`          | Headless TS engine. Pulled in transitively by every adapter. |
| `@anil-labs/styles`        | SCSS source + compiled CSS theme.                            |
| `@anil-labs/web-component` | `<calender-picker>` + `<calender-input>` custom elements.    |
| `@anil-labs/react`         | `useDatePicker` hook, `<DatePicker>`, `<DateField>`.         |
| `@anil-labs/vue`           | `useDatePicker` composable, `<DatePicker>`, `<DateField>`.   |
| `@anil-labs/svelte`        | `createDatePicker` factory satisfying the store contract.    |
| `@anil-labs/solid`         | `createDatePicker` returning Solid signals.                  |
| `@anil-labs/angular`       | Standalone `DatePickerComponent` + `DatePickerService`.      |

## Package manager

End users use whatever they prefer:

```bash
npm install @anil-labs/react @anil-labs/styles
yarn add @anil-labs/react @anil-labs/styles
pnpm add @anil-labs/react @anil-labs/styles
bun add @anil-labs/react @anil-labs/styles
```

The repo itself is a **pnpm workspace** for the dev workflow (workspace symlinks,
disk-efficient install). That's a dev-time choice — it doesn't affect end users.

## Styles

Every renderer expects the styles to be loaded. The simplest path:

```ts
import '@anil-labs/styles';
```

Or in HTML:

```html
<link rel="stylesheet" href="@anil-labs/styles" />
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

No setup needed — `import { DatePicker } from '@anil-labs/react'` works.
