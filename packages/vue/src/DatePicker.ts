import { defineComponent, h, type PropType, type VNode } from 'vue';
import {
  type CalendarDate,
  type DatePickerEngineOptions,
  type EngineState,
  type PeriodCell,
  type PresetSpec,
  buildMonthGrid,
  buildPeriodGrid,
  createRange,
  isInRange,
  isSameDay,
  isoWeekOfYear,
  resolvePresets,
} from '@anil-labs/core';
import { useDatePicker } from './use-date-picker.js';

export const DatePicker = defineComponent({
  name: 'DatePicker',
  props: {
    mode: { type: String as PropType<DatePickerEngineOptions['mode']>, default: undefined },
    initialFocused: { type: Object as PropType<CalendarDate>, default: undefined },
    min: { type: Object as PropType<CalendarDate>, default: undefined },
    max: { type: Object as PropType<CalendarDate>, default: undefined },
    locale: {
      type: [String, Object] as PropType<DatePickerEngineOptions['locale']>,
      default: undefined,
    },
    disabledWeekdays: { type: Array as PropType<ReadonlyArray<number>>, default: undefined },
    calendar: {
      type: String as PropType<DatePickerEngineOptions['calendar']>,
      default: undefined,
    },
    months: { type: Number, default: 1 },
    weekNumbers: { type: Boolean, default: false },
    withTime: { type: Boolean, default: false },
    timeStep: { type: Number, default: 1 },
    use12HourClock: { type: Boolean, default: false },
    showSeconds: { type: Boolean, default: false },
    granularity: {
      type: String as PropType<DatePickerEngineOptions['granularity']>,
      default: undefined,
    },
    minRangeDays: { type: Number, default: undefined },
    maxRangeDays: { type: Number, default: undefined },
    highlights: {
      type: Array as PropType<DatePickerEngineOptions['highlights']>,
      default: undefined,
    },
    presets: {
      type: Array as PropType<ReadonlyArray<PresetSpec>>,
      default: () => ['today'],
    },
    hideFooter: { type: Boolean, default: false },
    headerSelectors: { type: Boolean, default: false },
    yearRange: {
      type: Array as unknown as PropType<readonly [number, number]>,
      default: undefined,
    },
  },
  emits: {
    select: (_date: CalendarDate) => true,
    change: (_state: EngineState) => true,
  },
  setup(props, { emit, slots }) {
    const options: DatePickerEngineOptions = {
      ...(props.mode !== undefined ? { mode: props.mode } : {}),
      ...(props.initialFocused !== undefined ? { initialFocused: props.initialFocused } : {}),
      ...(props.min !== undefined ? { min: props.min } : {}),
      ...(props.max !== undefined ? { max: props.max } : {}),
      ...(props.locale !== undefined ? { locale: props.locale } : {}),
      ...(props.disabledWeekdays !== undefined ? { disabledWeekdays: props.disabledWeekdays } : {}),
      ...(props.calendar !== undefined ? { calendar: props.calendar } : {}),
      months: props.months,
      weekNumbers: props.weekNumbers,
      withTime: props.withTime,
      timeStep: props.timeStep,
      use12HourClock: props.use12HourClock,
      showSeconds: props.showSeconds,
      ...(props.granularity !== undefined ? { granularity: props.granularity } : {}),
      ...(props.minRangeDays !== undefined ? { minRangeDays: props.minRangeDays } : {}),
      ...(props.maxRangeDays !== undefined ? { maxRangeDays: props.maxRangeDays } : {}),
      ...(props.highlights !== undefined ? { highlights: props.highlights } : {}),
      headerSelectors: props.headerSelectors,
      ...(props.yearRange !== undefined ? { yearRange: props.yearRange } : {}),
    };

    const { engine, state } = useDatePicker(options);

    return () => {
      const s = state.value;
      const fmt = engine.formatter;

      const onDayClick = (date: CalendarDate): void => {
        if (!engine.isPickable(date)) return;
        engine.select(date);
        emit('select', date);
        emit('change', engine.state);
      };

      const onPeriodClick = (date: CalendarDate): void => {
        engine.pickInView(date);
        emit('change', engine.state);
      };

      const renderHeader = () => {
        let title: string;
        if (s.view === 'day') {
          if (engine.months <= 1) title = fmt.formatMonthYear(s.focused);
          else {
            const last = engine.calendar.addMonths(s.focused, engine.months - 1);
            title = `${fmt.formatMonthYear(s.focused)} — ${fmt.formatMonthYear(last)}`;
          }
        } else {
          title = buildPeriodGrid(s.focused, s.view, engine.calendar, engine.locale.locale).title;
        }
        const terminal = s.view === 'decade';

        const centerNode =
          engine.headerSelectors && s.view === 'day'
            ? h('div', { class: 'cal-picker__selectors' }, [
                h(
                  'select',
                  {
                    class: 'cal-picker__select',
                    'aria-label': 'Month',
                    value: s.focused.month,
                    onChange: (e: Event) =>
                      engine.setMonth(Number((e.target as HTMLSelectElement).value)),
                  },
                  Array.from({ length: engine.calendar.monthsInYear }, (_, i) =>
                    h(
                      'option',
                      { value: i + 1 },
                      engine.calendar.monthName(i + 1, 'long', engine.locale.locale),
                    ),
                  ),
                ),
                h(
                  'select',
                  {
                    class: 'cal-picker__select',
                    'aria-label': 'Year',
                    value: s.focused.year,
                    onChange: (e: Event) =>
                      engine.setYear(Number((e.target as HTMLSelectElement).value)),
                  },
                  (() => {
                    const [start, end] = engine.yearRange();
                    const out: VNode[] = [];
                    for (let y = start; y <= end; y += 1) {
                      out.push(
                        h(
                          'option',
                          { value: y },
                          engine.calendar.formatDay(y, engine.locale.locale),
                        ),
                      );
                    }
                    return out;
                  })(),
                ),
              ])
            : h(
                'button',
                {
                  type: 'button',
                  class: 'cal-picker__title',
                  disabled: terminal,
                  onClick: () => engine.drillUp(),
                },
                title,
              );

        return h('div', { class: 'cal-picker__header' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'cal-picker__nav',
              'aria-label': 'Previous',
              onClick: () => engine.pagePrev(),
            },
            '‹',
          ),
          centerNode,
          h(
            'button',
            {
              type: 'button',
              class: 'cal-picker__nav',
              'aria-label': 'Next',
              onClick: () => engine.pageNext(),
            },
            '›',
          ),
        ]);
      };

      const renderDayCell = (
        cell: ReturnType<typeof buildMonthGrid>['weeks'][number][number],
        focusedMonth: CalendarDate,
      ) => {
        const inThisMonth =
          cell.date.year === focusedMonth.year && cell.date.month === focusedMonth.month;
        const selected = engine.isSelected(cell.date);
        const pickable = engine.isPickable(cell.date);
        const focused = isSameDay(cell.date, s.focused);
        const range = s.selection.mode === 'range' ? s.selection.value : null;
        const isStart = range ? isSameDay(cell.date, range.start) : false;
        const isEnd = range ? isSameDay(cell.date, range.end) : false;
        const isMid = range ? isInRange(cell.date, range, true) && !isStart && !isEnd : false;

        let previewStart = false,
          previewEnd = false,
          previewMid = false;
        if (
          s.selection.mode === 'range' &&
          s.selection.anchor !== null &&
          s.selection.value === null &&
          s.hovered !== null
        ) {
          const p = createRange(s.selection.anchor, s.hovered);
          previewStart = isSameDay(cell.date, p.start);
          previewEnd = isSameDay(cell.date, p.end);
          previewMid = isInRange(cell.date, p, true) && !previewStart && !previewEnd;
        }

        const highlight = engine.getHighlight(cell.date);
        let label = fmt.formatFull(cell.date);
        if (highlight?.label) label += ` — ${highlight.label}`;

        return h(
          'button',
          {
            key: `${cell.date.year}-${cell.date.month}-${cell.date.day}`,
            type: 'button',
            role: 'gridcell',
            class: 'cal-picker__cell',
            tabindex: focused ? 0 : -1,
            'aria-selected': selected || undefined,
            'aria-disabled': !pickable || undefined,
            'aria-label': label,
            'data-outside': !inThisMonth ? 'true' : undefined,
            'data-today': cell.isToday ? 'true' : undefined,
            'data-weekend': cell.isWeekend ? 'true' : undefined,
            'data-selected': selected ? 'true' : undefined,
            'data-disabled': !pickable ? 'true' : undefined,
            'data-range-start': isStart ? 'true' : undefined,
            'data-range-end': isEnd ? 'true' : undefined,
            'data-range-mid': isMid ? 'true' : undefined,
            'data-range-preview-start': previewStart ? 'true' : undefined,
            'data-range-preview-end': previewEnd ? 'true' : undefined,
            'data-range-preview-mid': previewMid ? 'true' : undefined,
            'data-highlight': highlight ? 'true' : undefined,
            style: highlight?.color ? `--cal-highlight-color: ${highlight.color}` : undefined,
            onClick: () => onDayClick(cell.date),
            onMouseenter: () => {
              if (s.selection.mode === 'range' && s.selection.anchor !== null) {
                engine.setHovered(cell.date);
              }
            },
          },
          slots.cell
            ? slots.cell({
                cell,
                defaultLabel: fmt.formatDay(cell.date),
                selected,
                disabled: !pickable,
                inRange: isStart || isEnd || isMid,
              })
            : fmt.formatDay(cell.date),
        );
      };

      const renderDayGrid = (focusedMonth: CalendarDate) => {
        const useWeeks = engine.weekNumbers;
        const sameMonth =
          focusedMonth.year === s.focused.year && focusedMonth.month === s.focused.month;
        const monthGrid = sameMonth
          ? s.grid
          : buildMonthGrid(focusedMonth, {
              firstDayOfWeek: engine.locale.firstDayOfWeek,
              fixedWeeks: true,
              calendar: engine.calendar,
            });
        const cells: VNode[] = [];
        if (useWeeks) cells.push(h('div', { class: 'cal-picker__weeknum-header' }, 'Wk'));
        for (const w of monthGrid.weekdayHeaders) {
          cells.push(
            h(
              'div',
              { class: 'cal-picker__weekday', role: 'columnheader' },
              fmt.formatWeekday(w, 'short'),
            ),
          );
        }
        for (const week of monthGrid.weeks) {
          if (useWeeks && week[0]) {
            cells.push(
              h('div', { class: 'cal-picker__weeknum' }, String(isoWeekOfYear(week[0].date))),
            );
          }
          for (const cell of week) cells.push(renderDayCell(cell, focusedMonth));
        }
        return h(
          'div',
          {
            key: `${focusedMonth.year}-${focusedMonth.month}`,
            class: `cal-picker__grid${useWeeks ? ' cal-picker__grid--with-weeks' : ''}`,
            role: 'grid',
            onMouseleave: () => engine.setHovered(null),
          },
          cells,
        );
      };

      const renderMonths = () => {
        const months = Math.max(1, engine.months);
        const grids = Array.from({ length: months }, (_, i) => {
          const f = i === 0 ? s.focused : engine.calendar.addMonths(s.focused, i);
          return renderDayGrid(f);
        });
        return h('div', { class: 'cal-picker__months' }, grids);
      };

      const renderPeriodGrid = () => {
        const period = buildPeriodGrid(
          s.focused,
          s.view as 'month' | 'year' | 'decade',
          engine.calendar,
          engine.locale.locale,
        );
        return h(
          'div',
          { class: 'cal-picker__grid cal-picker__grid--period', role: 'grid' },
          period.cells.map((cell: PeriodCell) =>
            h(
              'button',
              {
                key: `${cell.date.year}-${cell.date.month}`,
                type: 'button',
                role: 'gridcell',
                class: 'cal-picker__cell cal-picker__cell--period',
                tabindex: cell.isFocused ? 0 : -1,
                'aria-label': cell.longLabel,
                'data-selected': cell.isFocused ? 'true' : undefined,
                'data-today': cell.isToday ? 'true' : undefined,
                'data-outside': cell.outside ? 'true' : undefined,
                onClick: () => onPeriodClick(cell.date),
              },
              cell.label,
            ),
          ),
        );
      };

      const renderTime = () => {
        const t = s.time ?? { hour: 0, minute: 0, second: 0 };
        const hour12 = engine.use12HourClock;
        const showSec = engine.showSeconds;
        const step = Math.max(1, engine.timeStep);
        const displayHour = hour12 ? ((t.hour + 11) % 12) + 1 : t.hour;
        const isPm = t.hour >= 12;
        const update = (next: Partial<typeof t>): void => engine.setTime({ ...t, ...next });

        const fields: VNode[] = [
          h('span', { class: 'cal-picker__time-label' }, 'Time'),
          h('input', {
            class: 'cal-picker__time-field',
            type: 'number',
            min: hour12 ? 1 : 0,
            max: hour12 ? 12 : 23,
            step: 1,
            value: String(displayHour).padStart(2, '0'),
            onChange: (e: Event) => {
              const v = Number((e.target as HTMLInputElement).value);
              if (!Number.isFinite(v)) return;
              const h = hour12 ? (v % 12) + (isPm ? 12 : 0) : Math.max(0, Math.min(23, v));
              update({ hour: h });
            },
          }),
          h('span', { class: 'cal-picker__time-sep' }, ':'),
          h('input', {
            class: 'cal-picker__time-field',
            type: 'number',
            min: 0,
            max: 59,
            step,
            value: String(t.minute).padStart(2, '0'),
            onChange: (e: Event) => {
              const v = Number((e.target as HTMLInputElement).value);
              if (!Number.isFinite(v)) return;
              update({ minute: Math.max(0, Math.min(59, Math.round(v / step) * step)) });
            },
          }),
        ];
        if (showSec) {
          fields.push(
            h('span', { class: 'cal-picker__time-sep' }, ':'),
            h('input', {
              class: 'cal-picker__time-field',
              type: 'number',
              min: 0,
              max: 59,
              step: 1,
              value: String(t.second).padStart(2, '0'),
              onChange: (e: Event) => {
                const v = Number((e.target as HTMLInputElement).value);
                if (!Number.isFinite(v)) return;
                update({ second: Math.max(0, Math.min(59, v)) });
              },
            }),
          );
        }
        if (hour12) {
          fields.push(
            h(
              'button',
              {
                type: 'button',
                class: 'cal-picker__time-period',
                onClick: () => update({ hour: (t.hour + 12) % 24 }),
              },
              isPm ? 'PM' : 'AM',
            ),
          );
        }
        return h('div', { class: 'cal-picker__time' }, fields);
      };

      const renderFooter = () => {
        const resolved = resolvePresets(props.presets);
        if (resolved.length === 0) return null;
        return h('div', { class: 'cal-picker__footer' }, [
          h(
            'div',
            { class: 'cal-picker__presets' },
            resolved.map(p =>
              h(
                'button',
                {
                  type: 'button',
                  class: 'cal-picker__preset',
                  onClick: () => {
                    p.apply(engine);
                    emit('change', engine.state);
                  },
                },
                p.label,
              ),
            ),
          ),
        ]);
      };

      return h(
        'div',
        {
          class: 'cal-picker',
          role: 'group',
          'aria-label': 'Date picker',
          dir: engine.locale.direction,
          'data-view': s.view,
          'data-mode': s.mode,
          onKeydown: (e: KeyboardEvent) => {
            const action = engine.handleKey(e);
            if (action) e.preventDefault();
          },
        },
        [
          renderHeader(),
          s.view === 'day' ? renderMonths() : renderPeriodGrid(),
          engine.withTime ? renderTime() : null,
          props.hideFooter ? null : renderFooter(),
        ],
      );
    };
  },
});
