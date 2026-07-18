# Types

All public types exported from `@anil-labs/core`. Same names available from
every adapter package.

## CalendarDate

The picker's canonical date representation. Plain `{year, month, day}` —
timezone-safe.

```ts
interface CalendarDate {
  readonly year: number;
  readonly month: number; // 1..12 (1..N depending on calendar)
  readonly day: number; // 1..31 (varies by month + calendar)
}
```

Construction helpers:

```ts
createCalendarDate(2025, 4, 15); // throws on invalid Gregorian dates
fromIso('2025-04-15'); // ISO parsing
fromJsDate(new Date()); // JS Date → CalendarDate
todayCalendarDate('Asia/Kathmandu'); // today in a time zone
```

## DateRange

```ts
interface DateRange {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
}

createRange(d1, d2); // canonicalises order
isInRange(date, range, (inclusive = true));
```

## SelectionValue

Tagged union — the shape depends on `mode`.

```ts
type SelectionValue =
  | { mode: 'single'; value: CalendarDate | null }
  | { mode: 'range'; value: DateRange | null; anchor: CalendarDate | null }
  | { mode: 'multi'; value: ReadonlyArray<CalendarDate> };
```

## TimeOfDay

```ts
interface TimeOfDay {
  readonly hour: number; // 0..23
  readonly minute: number; // 0..59
  readonly second: number; // 0..59
}
```

## EngineState

```ts
interface EngineState {
  readonly mode: 'single' | 'range' | 'multi';
  readonly view: 'day' | 'month' | 'year' | 'decade';
  readonly focused: CalendarDate;
  readonly selection: SelectionValue;
  readonly grid: MonthGrid;
  readonly isOpen: boolean;
  readonly hovered: CalendarDate | null;
  readonly time: TimeOfDay | null;
}
```

## MonthGrid

```ts
interface MonthGrid {
  readonly month: number;
  readonly year: number;
  readonly weeks: ReadonlyArray<ReadonlyArray<MonthGridCell>>; // 6×7
  readonly weekdayHeaders: ReadonlyArray<number>; // 0..6, ordered
}

interface MonthGridCell {
  readonly date: CalendarDate;
  readonly inCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isWeekend: boolean;
}
```

## PeriodCell

The cells in month / year / decade views.

```ts
interface PeriodCell {
  readonly date: CalendarDate; // canonical date for the period
  readonly label: string; // short label ("Apr", "2025", "2020s")
  readonly longLabel: string; // long label (for aria-label)
  readonly isFocused: boolean;
  readonly isToday: boolean;
  readonly outside: boolean; // outside the visible decade/century band
}
```

## DateHighlight

```ts
interface DateHighlight {
  readonly date: CalendarDate;
  readonly color?: string; // CSS colour for the dot
  readonly label?: string; // appended to aria-label
}
```

## CalendarSystem

```ts
interface CalendarSystem {
  readonly id: 'gregorian' | 'bikram-sambat';
  readonly displayName: string;
  readonly monthsInYear: number;

  daysInMonth(year: number, month: number): number;
  isValidDate(year: number, month: number, day: number): boolean;

  addDays(date: CalendarDate, days: number): CalendarDate;
  addMonths(date: CalendarDate, months: number): CalendarDate;
  addYears(date: CalendarDate, years: number): CalendarDate;
  compare(a: CalendarDate, b: CalendarDate): number;
  weekday(date: CalendarDate): number;
  today(timeZone?: string): CalendarDate;

  toGregorian(date: CalendarDate): CalendarDate;
  fromGregorian(date: CalendarDate): CalendarDate;

  monthName(month: number, style: 'long' | 'short' | 'narrow', locale: string): string;
  formatDay(day: number, locale: string): string;
  toIso(date: CalendarDate): string;
}
```

## DateConstraint

```ts
interface DateConstraint {
  evaluate(date: CalendarDate): string | null; // null = pickable
}
```
