# @anil-labs/calendar-styles

SCSS source + compiled CSS for the `@anil-labs` renderers. All visual styling is
driven by CSS custom properties (design tokens) — override any token at any
scope.

```html
<link rel="stylesheet" href="@anil-labs/calendar-styles" />
<div class="cal-theme-dark cal-density-dense">…</div>
```

```scss
@use '@anil-labs/calendar-styles/scss/tokens' as t;

.my-app {
  @include t.tokens-dark;
  --cal-color-accent: hotpink;
}
```
