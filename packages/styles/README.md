# @calender/styles

SCSS source + compiled CSS for the `@calender` renderers. All visual styling is
driven by CSS custom properties (design tokens) — override any token at any
scope.

```html
<link rel="stylesheet" href="@calender/styles" />
<div class="cal-theme-dark cal-density-dense">…</div>
```

```scss
@use '@calender/styles/scss/tokens' as t;

.my-app {
  @include t.tokens-dark;
  --cal-color-accent: hotpink;
}
```
