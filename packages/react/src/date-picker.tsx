import {
  type CalendarDate,
  type DatePickerEngine,
  type DatePickerEngineOptions,
  type EngineState,
  type PresetSpec,
  buildMonthGrid,
  buildPeriodGrid,
  createRange,
  isInRange,
  isSameDay,
  isoWeekOfYear,
  resolvePresets,
} from '@anil-labs/core';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useDatePicker } from './use-date-picker.js';

export interface DayCellContext {
  readonly cell: ReturnType<typeof buildMonthGrid>['weeks'][number][number];
  /** Default label the renderer would have shown (e.g. "15"). */
  readonly defaultLabel: string;
  readonly selected: boolean;
  /** True when constraints / range-length make this date unclickable. */
  readonly disabled: boolean;
  /** True when the cell falls inside a committed range. */
  readonly inRange: boolean;
}

export interface DatePickerProps extends DatePickerEngineOptions {
  readonly className?: string;
  readonly onSelect?: (date: CalendarDate) => void;
  readonly onChange?: (state: EngineState) => void;
  /** Hide the preset footer. Default false. */
  readonly hideFooter?: boolean;
  /** Preset specs (string ids of built-ins, or custom {id, label, apply}). Default ['today']. */
  readonly presets?: ReadonlyArray<PresetSpec>;
  /**
   * Custom render function for the contents of each day cell. The button shell
   * (click handler, data-attrs, aria-label, focus management) is preserved —
   * only the cell's child content is replaced.
   */
  readonly renderCell?: (ctx: DayCellContext) => React.ReactNode;
}

/** Imperative surface exposed through the component ref. */
export interface DatePickerHandle {
  /** The live engine driving this picker. */
  readonly engine: DatePickerEngine;
  /** Move DOM focus to the currently focused calendar cell. */
  focus(): void;
}

/** Slice a flat cell list into rows of `size` (period grids are 4-wide). */
const chunkCells = <T,>(cells: ReadonlyArray<T>, size: number): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < cells.length; i += size) rows.push(cells.slice(i, i + size));
  return rows;
};

export const DatePicker = forwardRef<DatePickerHandle, DatePickerProps>(
  (props, ref): React.JSX.Element => {
    const {
      className,
      onSelect,
      onChange,
      hideFooter,
      presets = ['today'],
      renderCell,
      ...engineOptions
    } = props;
    const { engine, state } = useDatePicker(engineOptions);
    const fmt = engine.formatter;
    const rootRef = useRef<HTMLDivElement>(null);

    // Callbacks fire from ENGINE events so keyboard selection (Enter/Space),
    // presets and programmatic changes all report — not just clicks. Handler
    // identity is kept in refs so we never need to re-subscribe.
    const onSelectRef = useRef(onSelect);
    const onChangeRef = useRef(onChange);
    onSelectRef.current = onSelect;
    onChangeRef.current = onChange;

    useEffect(() => {
      const offSelect = engine.on('select', ({ focused }) => onSelectRef.current?.(focused));
      const offChange = engine.on('change', ({ state: next }) => onChangeRef.current?.(next));
      return () => {
        offSelect();
        offChange();
      };
    }, [engine]);

    useImperativeHandle(
      ref,
      () => ({
        engine,
        focus: () => {
          const cell = rootRef.current?.querySelector<HTMLElement>(
            '[role="gridcell"][tabindex="0"]',
          );
          (cell ?? rootRef.current)?.focus();
        },
      }),
      [engine],
    );

    const handleDayClick = useCallback(
      (date: CalendarDate) => {
        if (!engine.isPickable(date)) return;
        engine.select(date);
      },
      [engine],
    );

    const handlePeriodClick = useCallback(
      (date: CalendarDate) => {
        engine.pickInView(date);
      },
      [engine],
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

    const periodGrid = useMemo(() => {
      if (state.view === 'day') return null;
      return buildPeriodGrid(state.focused, state.view, engine.calendar, engine.locale.locale);
    }, [state.view, state.focused, engine.calendar, engine.locale.locale]);

    const title = useMemo(() => {
      if (state.view !== 'day') return periodGrid?.title ?? '';
      if (engine.months <= 1) return fmt.formatMonthYear(state.focused);
      const last = engine.calendar.addMonths(state.focused, engine.months - 1);
      return `${fmt.formatMonthYear(state.focused)} — ${fmt.formatMonthYear(last)}`;
    }, [state.view, state.focused, periodGrid, fmt, engine]);

    const resolved = useMemo(() => resolvePresets(presets), [presets]);
    // Title navigates upward; only disable at the top of the view hierarchy.
    const terminalView = state.view === 'decade';
    const monthsToRender = Math.max(1, engine.months);

    const renderDayCell = (
      cell: ReturnType<typeof buildMonthGrid>['weeks'][number][number],
      focusedMonth: CalendarDate,
    ) => {
      const inThisMonth =
        cell.date.year === focusedMonth.year && cell.date.month === focusedMonth.month;
      const selected = engine.isSelected(cell.date);
      const pickable = engine.isPickable(cell.date);
      const focused = isSameDay(cell.date, state.focused);

      const range = state.selection.mode === 'range' ? state.selection.value : null;
      const isStart = range ? isSameDay(cell.date, range.start) : false;
      const isEnd = range ? isSameDay(cell.date, range.end) : false;
      const isMid = range ? isInRange(cell.date, range, true) && !isStart && !isEnd : false;

      let previewStart = false,
        previewEnd = false,
        previewMid = false;
      if (
        state.selection.mode === 'range' &&
        state.selection.anchor !== null &&
        state.selection.value === null &&
        state.hovered !== null
      ) {
        const preview = createRange(state.selection.anchor, state.hovered);
        previewStart = isSameDay(cell.date, preview.start);
        previewEnd = isSameDay(cell.date, preview.end);
        previewMid = isInRange(cell.date, preview, true) && !previewStart && !previewEnd;
      }

      const highlight = engine.getHighlight(cell.date);
      const style = highlight?.color
        ? ({ ['--cal-highlight-color' as string]: highlight.color } as React.CSSProperties)
        : undefined;
      let label = fmt.formatFull(cell.date);
      if (highlight?.label) label += ` — ${highlight.label}`;

      return (
        <button
          key={`${cell.date.year}-${cell.date.month}-${cell.date.day}`}
          type="button"
          role="gridcell"
          className="cal-picker__cell"
          tabIndex={focused ? 0 : -1}
          aria-selected={selected || undefined}
          aria-disabled={!pickable || undefined}
          aria-label={label}
          data-outside={!inThisMonth || undefined}
          data-today={cell.isToday || undefined}
          data-weekend={cell.isWeekend || undefined}
          data-selected={selected || undefined}
          data-disabled={!pickable || undefined}
          data-range-start={isStart || undefined}
          data-range-end={isEnd || undefined}
          data-range-mid={isMid || undefined}
          data-range-preview-start={previewStart || undefined}
          data-range-preview-end={previewEnd || undefined}
          data-range-preview-mid={previewMid || undefined}
          data-highlight={highlight ? 'true' : undefined}
          style={style}
          onClick={() => handleDayClick(cell.date)}
          onMouseEnter={() => {
            if (state.selection.mode === 'range' && state.selection.anchor !== null) {
              engine.setHovered(cell.date);
            }
          }}
        >
          {renderCell
            ? renderCell({
                cell,
                defaultLabel: fmt.formatDay(cell.date),
                selected,
                disabled: !pickable,
                inRange: isStart || isEnd || isMid,
              })
            : fmt.formatDay(cell.date)}
        </button>
      );
    };

    const renderDayGrid = (focusedMonth: CalendarDate) => {
      const useWeeks = engine.weekNumbers;
      const isCurrent =
        focusedMonth.year === state.focused.year && focusedMonth.month === state.focused.month;
      const monthGrid = isCurrent
        ? state.grid
        : buildMonthGrid(focusedMonth, {
            firstDayOfWeek: engine.locale.firstDayOfWeek,
            fixedWeeks: true,
            calendar: engine.calendar,
            weekNumbers: useWeeks,
          });

      return (
        <div
          key={`${focusedMonth.year}-${focusedMonth.month}`}
          className={`cal-picker__grid${useWeeks ? ' cal-picker__grid--with-weeks' : ''}`}
          role="grid"
          onMouseLeave={() => engine.setHovered(null)}
        >
          <div className="cal-picker__row cal-picker__row--head" role="row">
            {useWeeks && (
              <div className="cal-picker__weeknum-header" role="columnheader">
                Wk
              </div>
            )}
            {monthGrid.weekdayHeaders.map(w => (
              <div key={w} className="cal-picker__weekday" role="columnheader">
                {fmt.formatWeekday(w, 'short')}
              </div>
            ))}
          </div>
          {monthGrid.weeks.map((week, weekIdx) => {
            const first = week[0];
            return (
              <div
                key={first ? `${first.date.year}-${first.date.month}-${first.date.day}` : weekIdx}
                className="cal-picker__row"
                role="row"
              >
                {useWeeks && (
                  <div className="cal-picker__weeknum">
                    {monthGrid.weekNumbers?.[weekIdx] ?? (first ? isoWeekOfYear(first.date) : '')}
                  </div>
                )}
                {week.map(cell => renderDayCell(cell, focusedMonth))}
              </div>
            );
          })}
        </div>
      );
    };

    return (
      <div
        ref={rootRef}
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
          {engine.headerSelectors && state.view === 'day' ? (
            <div className="cal-picker__selectors">
              <select
                className="cal-picker__select"
                aria-label="Month"
                value={state.focused.month}
                onChange={e => engine.setMonth(Number(e.target.value))}
              >
                {Array.from({ length: engine.calendar.monthsInYear }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {engine.calendar.monthName(m, 'long', engine.locale.locale)}
                  </option>
                ))}
              </select>
              <select
                className="cal-picker__select"
                aria-label="Year"
                value={state.focused.year}
                onChange={e => engine.setYear(Number(e.target.value))}
              >
                {(() => {
                  const [start, end] = engine.yearRange();
                  const out: React.ReactNode[] = [];
                  for (let y = start; y <= end; y += 1) {
                    out.push(
                      <option key={y} value={y}>
                        {engine.calendar.formatDay(y, engine.locale.locale)}
                      </option>,
                    );
                  }
                  return out;
                })()}
              </select>
            </div>
          ) : (
            <button
              type="button"
              className="cal-picker__title"
              onClick={() => engine.drillUp()}
              disabled={terminalView}
            >
              {title}
            </button>
          )}
          <button
            type="button"
            className="cal-picker__nav"
            aria-label="Next"
            onClick={() => engine.pageNext()}
          >
            ›
          </button>
        </div>

        {state.view === 'day' ? (
          <div className="cal-picker__months">
            {Array.from({ length: monthsToRender }, (_, i) =>
              renderDayGrid(i === 0 ? state.focused : engine.calendar.addMonths(state.focused, i)),
            )}
          </div>
        ) : (
          <div className="cal-picker__grid cal-picker__grid--period" role="grid">
            {chunkCells(periodGrid?.cells ?? [], 4).map((row, rowIdx) => (
              <div
                key={row[0] ? `${row[0].date.year}-${row[0].date.month}` : rowIdx}
                className="cal-picker__row"
                role="row"
              >
                {row.map(cell => (
                  <button
                    key={`${cell.date.year}-${cell.date.month}`}
                    type="button"
                    role="gridcell"
                    className="cal-picker__cell cal-picker__cell--period"
                    tabIndex={cell.isFocused ? 0 : -1}
                    aria-label={cell.longLabel}
                    data-selected={cell.isFocused || undefined}
                    data-today={cell.isToday || undefined}
                    data-outside={cell.outside || undefined}
                    onClick={() => handlePeriodClick(cell.date)}
                  >
                    {cell.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {engine.withTime && <TimeRow engine={engine} state={state} />}

        {!hideFooter && resolved.length > 0 && (
          <div className="cal-picker__footer">
            <div className="cal-picker__presets">
              {resolved.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="cal-picker__preset"
                  onClick={() => p.apply(engine)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';

const TimeRow = ({
  engine,
  state,
}: {
  engine: ReturnType<typeof useDatePicker>['engine'];
  state: EngineState;
}): React.JSX.Element => {
  const t = state.time ?? { hour: 0, minute: 0, second: 0 };
  const hour12 = engine.use12HourClock;
  const showSeconds = engine.showSeconds;
  const step = Math.max(1, engine.timeStep);
  const displayHour = hour12 ? ((t.hour + 11) % 12) + 1 : t.hour;
  const isPm = t.hour >= 12;

  const update = (next: Partial<typeof t>): void => {
    engine.setTime({ ...t, ...next });
  };

  return (
    <div className="cal-picker__time">
      <span className="cal-picker__time-label">Time</span>
      <input
        className="cal-picker__time-field"
        type="number"
        min={hour12 ? 1 : 0}
        max={hour12 ? 12 : 23}
        step={1}
        value={String(displayHour).padStart(2, '0')}
        onChange={e => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v)) return;
          const h = hour12 ? (v % 12) + (isPm ? 12 : 0) : Math.max(0, Math.min(23, v));
          update({ hour: h });
        }}
      />
      <span className="cal-picker__time-sep">:</span>
      <input
        className="cal-picker__time-field"
        type="number"
        min={0}
        max={59}
        step={step}
        value={String(t.minute).padStart(2, '0')}
        onChange={e => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v)) return;
          update({ minute: Math.max(0, Math.min(59, Math.round(v / step) * step)) });
        }}
      />
      {showSeconds && (
        <>
          <span className="cal-picker__time-sep">:</span>
          <input
            className="cal-picker__time-field"
            type="number"
            min={0}
            max={59}
            step={1}
            value={String(t.second).padStart(2, '0')}
            onChange={e => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              update({ second: Math.max(0, Math.min(59, v)) });
            }}
          />
        </>
      )}
      {hour12 && (
        <button
          type="button"
          className="cal-picker__time-period"
          onClick={() => update({ hour: (t.hour + 12) % 24 })}
        >
          {isPm ? 'PM' : 'AM'}
        </button>
      )}
    </div>
  );
};
