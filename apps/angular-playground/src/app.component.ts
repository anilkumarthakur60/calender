import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DatePickerComponent } from '@calender/angular';
import { type CalendarDate } from '@calender/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="layout">
      <header>
        <h1>&#64;calender — Angular playground</h1>
        <p>Standalone component + signals.</p>
      </header>

      <section>
        <h2>Single</h2>
        <cal-date-picker (select)="onSelect($event)"></cal-date-picker>
        <p class="status">Last clicked: {{ formatted() }}</p>
      </section>
    </main>
  `,
})
export class AppComponent {
  readonly #last = signal<CalendarDate | null>(null);
  readonly formatted = () => {
    const d = this.#last();
    return d ? `${d.year}-${d.month}-${d.day}` : '(none)';
  };

  onSelect(date: CalendarDate): void {
    this.#last.set(date);
  }
}
