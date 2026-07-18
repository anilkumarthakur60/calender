# example-angular

> **Note** — Angular ships its own build tooling (`@angular/build` / Angular
> CLI) that's tightly version-coupled and doesn't compose cleanly with the
> rest of this Vite-based monorepo. So this app holds **reference integration
> snippets only** — copy them into an Angular CLI scaffold to run them.

The `@anil-labs/angular` adapter itself is fully built and tested via tsup and
publishes to npm like the other adapters. Users consume it the standard way:

```bash
ng new my-app --standalone
cd my-app
npm install @anil-labs/angular @anil-labs/styles
```

Then in your component:

```ts
// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { DatePickerComponent } from '@anil-labs/angular';
import { type CalendarDate } from '@anil-labs/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePickerComponent],
  template: `
    <cal-date-picker (select)="onSelect($event)"></cal-date-picker>
    <p>Last: {{ formatted() }}</p>
  `,
})
export class AppComponent {
  readonly last = signal<CalendarDate | null>(null);
  readonly formatted = () => {
    const d = this.last();
    return d ? `${d.year}-${d.month}-${d.day}` : '(none)';
  };
  onSelect(date: CalendarDate) {
    this.last.set(date);
  }
}
```

```ts
// src/main.ts
import 'zone.js';
import '@anil-labs/styles';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent);
```

```bash
ng serve
```

See [`src/`](./src) for the complete reference snippets that mirror the React,
Vue, Svelte, and Solid playgrounds.
