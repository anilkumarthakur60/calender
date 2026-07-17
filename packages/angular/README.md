# @calender/angular

Angular 17+ adapter for [`@calender/core`](https://github.com/anilkumarthakur60/calender/tree/main/packages/core) — a standalone `<cal-date-picker>` component and an injectable `DatePickerService`.

> **Status: not yet published to npm.** This package currently builds with tsup/esbuild rather than the Angular compiler, so it does not ship in the required partial-Ivy library format and would break consumer AOT builds. It is marked `private` until the build is migrated to [ng-packagr](https://github.com/ng-packagr/ng-packagr). It works fine when consumed from source inside this monorepo (see `apps/angular-playground`).

## Usage (in-repo)

```ts
import { Component } from '@angular/core';
import { DatePickerComponent } from '@calender/angular';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [DatePickerComponent],
  template: `<cal-date-picker />`,
})
export class DemoComponent {}
```

Or drive a custom UI through the service:

```ts
import { Component, inject } from '@angular/core';
import { DatePickerService } from '@calender/angular';

@Component({
  selector: 'app-custom',
  standalone: true,
  providers: [
    { provide: DatePickerService, useFactory: () => new DatePickerService({ mode: 'range' }) },
  ],
  template: `...`,
})
export class CustomComponent {
  readonly picker = inject(DatePickerService);
}
```

`DatePickerService` wraps a `DatePickerEngine` and exposes its immutable `EngineState` as an Angular signal. All core types are re-exported.

## License

MIT
