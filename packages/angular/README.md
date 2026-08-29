# @anil-labs/calendar-angular

Angular 17+ adapter for [`@anil-labs/calendar-core`](https://github.com/anilkumarthakur60/calender/tree/main/packages/core)  a standalone `<cal-date-picker>` component, an injectable `DatePickerService`, and a `provideDatePicker(options)` helper.

> **Status: not yet published to npm.** The package builds with [ng-packagr](https://github.com/ng-packagr/ng-packagr) in the standard partial-Ivy library format (FESM2022 + type declarations), so it is AOT-safe; it stays `private` until the release workstream flips the flag. It works when consumed from source inside this monorepo.

## Usage (in-repo)

```ts
import { Component } from '@angular/core';
import { DatePickerComponent, provideDatePicker } from '@anil-labs/calendar-angular';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [DatePickerComponent],
  providers: [provideDatePicker({ mode: 'range', locale: 'en-GB' })],
  template: `<cal-date-picker (select)="onSelect($event)" />`,
})
export class DemoComponent {
  onSelect(date: unknown): void {
    console.log(date);
  }
}
```

Without `provideDatePicker`, the component creates its own service with engine
defaults. The `[options]` input live-reconfigures the engine via
`engine.setOptions(...)`  selection and focus are preserved where still valid.

## Reactive forms

`DatePickerComponent` implements `ControlValueAccessor`, so it binds to
`formControl`/`ngModel`. The value shape follows the selection mode:
`CalendarDate | null` (single), `DateRange | null` (range), or
`readonly CalendarDate[]` (multi).

```html
<cal-date-picker [formControl]="date" />
```

## Custom UIs through the service

```ts
import { Component, inject } from '@angular/core';
import { DatePickerService, provideDatePicker } from '@anil-labs/calendar-angular';

@Component({
  selector: 'app-custom',
  standalone: true,
  providers: [provideDatePicker({ mode: 'range' })],
  template: `...`,
})
export class CustomComponent {
  readonly picker = inject(DatePickerService);
}
```

`DatePickerService` wraps a `DatePickerEngine` and exposes its immutable `EngineState` as an Angular signal. All core types are re-exported.

## License

MIT
