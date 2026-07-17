# Server-side rendering

The headless engine has no DOM dependencies — it can be constructed and
queried on the server, in workers, in tests, anywhere. Renderers (React, Vue,
Web Component) only touch the DOM when they actually render.

## Next.js (App Router)

`@anil-labs/react` works in both server and client components. The
`<DatePicker>` and `<DateField>` use hooks, so add `"use client"` to the file
that imports them:

```tsx
// app/components/booking-picker.tsx
'use client';

import { DateField } from '@anil-labs/react';

export const BookingPicker = ({ defaultValue }: { defaultValue: string }) => (
  <DateField defaultValue={defaultValue} />
);
```

Then use the component freely from a server component:

```tsx
// app/booking/page.tsx
import { BookingPicker } from '@/components/booking-picker';

export default function Page() {
  return <BookingPicker defaultValue="2025-04-15" />;
}
```

### Hydration warnings

The picker formats dates using `Intl.DateTimeFormat`, which can produce
slightly different output between Node and the browser in rare locale corner
cases (mostly Chinese / Japanese era names). If you see a hydration
mismatch:

- Pass the formatted string from the server explicitly via `defaultValue`
  rather than relying on `engine.formatter` server-side.
- Or wrap the picker in `<NoSsr>` (built-in `dynamic(() => import('…'), { ssr: false })`).

### Styles

Import `@anil-labs/styles` once at the top of your `app/layout.tsx` (or
`pages/_app.tsx`). The styles are pure CSS — no `useEffect` needed.

```tsx
import '@anil-labs/styles';
```

## Web Component in SSR frameworks

`<calender-picker>` is a custom element. SSR frameworks render it as-is on
the server; the upgrade happens after hydration when
`@anil-labs/web-component/auto-register` runs in the browser.

To avoid a flash of unstyled custom element:

```tsx
// app/layout.tsx
import '@anil-labs/styles';
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Script src="/calender-auto-register.js" type="module" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
```

Then `/public/calender-auto-register.js`:

```js
import '@anil-labs/web-component/auto-register';
```

## Nuxt (Vue)

Same idea — wrap `<DatePicker>` in a client-only boundary:

```vue
<template>
  <client-only>
    <DatePicker mode="range" @select="onSelect" />
  </client-only>
</template>
```

Or import directly in a `.client.vue` component.

## SvelteKit

Svelte's adapter exposes a `createDatePicker` factory rather than a component
— so SSR-safe by construction. Render the resulting state inside a Svelte
template; if you need browser-only APIs (`Intl.DateTimeFormat` is fine; the
DOM is not), guard with `if (browser)` from `$app/environment`.

## Astro

Each adapter works as an Astro island — pass `client:visible` or
`client:idle` so the picker only hydrates when needed.

```astro
---
import { DatePicker } from '@anil-labs/react';
import '@anil-labs/styles';
---

<DatePicker client:visible mode="range" />
```

## Tested environments

| Framework     | Tested | Notes                                  |
| ------------- | ------ | -------------------------------------- |
| Next.js (App) | ✅ 14+ | Use `'use client'` per component file. |
| Nuxt 3        | ✅     | `<client-only>` wrapper recommended.   |
| Astro         | ✅     | Pass `client:visible` to the island.   |
| SvelteKit     | ✅     | The factory is SSR-safe by default.    |
| Remix         | ⚠️     | Should work; not explicitly tested.    |
| Gatsby        | ⚠️     | Should work; not explicitly tested.    |
