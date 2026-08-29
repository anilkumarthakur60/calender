# Angular

```bash
npm install @anil-labs/calendar-angular @anil-labs/calendar-styles
```

The adapter ships a standalone `DatePickerComponent` + an injectable
`DatePickerService` that wraps the engine in Angular signals (Angular 17+
standalone API).

```ts
// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { DatePickerComponent } from '@anil-labs/calendar-angular';
import { type CalendarDate } from '@anil-labs/calendar-core';

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
    return d ? \`\${d.year}-\${d.month}-\${d.day}\` : '(none)';
  };
  onSelect(date: CalendarDate) { this.last.set(date); }
}
```

```ts
// src/main.ts
import 'zone.js';
import '@anil-labs/calendar-styles';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent);
```

## API

### `<cal-date-picker>`

Standalone component. Outputs `select`. Accepts engine options via inputs
(see `@Input() options`).

### `DatePickerService`

Injectable wrapper. Exposes the engine + `Signal<EngineState>`:

```ts
import { Component, inject } from '@angular/core';
import { DatePickerService } from '@anil-labs/calendar-angular';

@Component({
  selector: 'app-custom',
  standalone: true,
  providers: [DatePickerService],
  template: `
    Focused: {{ state().focused | json }}
    <button (click)="picker.engine.pagePrev()">Previous</button>
  `,
})
export class CustomComponent {
  readonly picker = inject(DatePickerService);
  readonly state = this.picker.state;
}
```

## Why no Vite-based example in the repo

Angular ships its own tightly-coupled build tooling (`@angular/build` + Angular
CLI). The other adapters live in a Vite-first monorepo. For Angular, use
`ng new` to scaffold your project and install `@anil-labs/calendar-angular` from npm 
the standard Angular workflow.

The `examples/angular/` directory in the repo contains reference
snippets you can copy into an `ng new` project.

## Live example

<div class="docs-demo">
  <calender-picker mode="single"></calender-picker>
</div>
