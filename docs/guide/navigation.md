# Navigation

## Default  clickable title

The header title drills upward through views: day → month → year → decade.
Click a cell in a non-day view to drill back down.

<div class="docs-demo">
  <calender-picker></calender-picker>
</div>

## Header month / year dropdowns

Pass `header-selectors` to replace the title with native `<select>` dropdowns.
One click to any month, one click to any year.

```html
<calender-picker header-selectors year-range="2000-2050"></calender-picker>
```

<div class="docs-demo">
  <calender-picker header-selectors year-range="2000-2050"></calender-picker>
</div>

The year list defaults to focused-year ± 100 (clamped by `min`/`max`). Override
with `year-range="START-END"`.

## Multi-month

Render N grids side-by-side:

```html
<calender-picker mode="range" months="2"></calender-picker>
```

<div class="docs-demo">
  <calender-picker mode="range" months="2"></calender-picker>
</div>

The range band spans across months. PagePrev/Next still steps by one (sliding
window).

## Keyboard

Full WAI-ARIA grid model:

| Key                 | Action                            |
| ------------------- | --------------------------------- |
| ←/→/↑/↓             | Move focus by 1 day / 7 days      |
| `Home` / `End`      | Start / end of week               |
| `Ctrl+Home/End`     | Start / end of month              |
| `PageUp/PageDown`   | Previous / next month             |
| `Shift+PageUp/Down` | Previous / next year              |
| `Enter` / `Space`   | Select focused date               |
| `Esc`               | Cancel / close popover            |
| `+` / `-`           | Drill up / drill down (view mode) |

In RTL locales the left/right arrows are flipped automatically.

## Programmatic

```ts
engine.focus({ year: 2025, month: 4, day: 15 });
engine.setMonth(7); // jump month, keep year/day
engine.setYear(2030); // jump year, keep month/day
engine.pagePrev(); // previous month/year/decade by view
engine.pageNext();
engine.drillUp(); // day → month → year → decade
engine.drillDown();
engine.goToToday(); // back to day view, focused on today
engine.selectToday();
```
