import {
  type CalendarDate,
  isSameDay,
  isInRange,
  type DatePickerEngineOptions,
} from '@calender/core';
import { useCallback } from 'react';
import { useDatePicker } from './use-date-picker.js';

export interface DatePickerProps extends DatePickerEngineOptions {
  readonly className?: string;
  readonly onSelect?: (date: CalendarDate) => void;
  readonly onChange?: (state: ReturnType<typeof useDatePicker>['state']) => void;
}

export const DatePicker = (props: DatePickerProps): JSX.Element => {
  const { className, onSelect, onChange, ...engineOptions } = props;
  const { engine, state } = useDatePicker(engineOptions);

  const handleClick = useCallback(
    (date: CalendarDate) => {
      if (engine.isDisabled(date)) return;
      engine.select(date);
      onSelect?.(date);
      onChange?.(engine.state);
    },
    [engine, onSelect, onChange],
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      const action = engine.handleKey({
        key: e.key,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      });
      if (action) e.preventDefault();
    },
    [engine],
  );

  const fmt = engine.formatter;

  return (
    <div
      className={['cal-picker', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Date picker"
      dir={engine.locale.direction}
      data-view={state.view}
      data-mode={state.mode}
      onKeyDown={handleKey}
    >
      <div className="cal-picker__header">
        <button
          type="button"
          className="cal-picker__nav"
          aria-label="Previous"
          onClick={() => engine.pagePrev()}
        >
          ‹
        </button>
        <button type="button" className="cal-picker__title" onClick={() => engine.drillUp()}>
          {fmt.formatMonthYear(state.focused)}
        </button>
        <button
          type="button"
          className="cal-picker__nav"
          aria-label="Next"
          onClick={() => engine.pageNext()}
        >
          ›
        </button>
      </div>
      <div className="cal-picker__grid" role="grid">
        {state.grid.weekdayHeaders.map(w => (
          <div key={w} className="cal-picker__weekday" role="columnheader">
            {fmt.formatWeekday(w, 'short')}
          </div>
        ))}
        {state.grid.weeks.flatMap(week =>
          week.map(cell => {
            const selected = engine.isSelected(cell.date);
            const disabled = engine.isDisabled(cell.date);
            const focused = isSameDay(cell.date, state.focused);
            const range = state.selection.mode === 'range' ? state.selection.value : null;
            const isStart = range ? isSameDay(cell.date, range.start) : false;
            const isEnd = range ? isSameDay(cell.date, range.end) : false;
            const isMid = range ? isInRange(cell.date, range, true) && !isStart && !isEnd : false;
            return (
              <button
                key={`${cell.date.year}-${cell.date.month}-${cell.date.day}`}
                type="button"
                role="gridcell"
                className="cal-picker__cell"
                tabIndex={focused ? 0 : -1}
                aria-selected={selected || undefined}
                aria-disabled={disabled || undefined}
                aria-label={fmt.formatFull(cell.date)}
                data-outside={!cell.inCurrentMonth || undefined}
                data-today={cell.isToday || undefined}
                data-weekend={cell.isWeekend || undefined}
                data-selected={selected || undefined}
                data-disabled={disabled || undefined}
                data-range-start={isStart || undefined}
                data-range-end={isEnd || undefined}
                data-range-mid={isMid || undefined}
                onClick={() => handleClick(cell.date)}
              >
                {fmt.formatDay(cell.date)}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
};
