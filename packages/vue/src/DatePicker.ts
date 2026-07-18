import { defineComponent, h, ref, watch, type PropType, type VNode } from 'vue';
import {
  type CalendarDate,
  type DatePickerEngineOptions,
  type DecodedSelection,
  type EngineState,
  type InitialSelected,
  type PeriodCell,
  type PresetSpec,
  buildMonthGrid,
  buildPeriodGrid,
  createRange,
  decodeSelectionValue,
  encodeSelectionValue,
  isInRange,
  isSameDay,
  isoWeekOfYear,
  resolvePresets,
} from '@anil-labs/core';
import { useDatePicker } from './use-date-picker.js';

/** Number of columns in the month/year/decade period grids. */
const PERIOD_COLUMNS = 4;

const decodedToInitial = (decoded: DecodedSelection | null): InitialSelected | undefined => {
  if (!decoded) return undefined;
  if (decoded.single) return decoded.single;
  if (decoded.range) return { start: decoded.range.start, end: decoded.range.end };
  return decoded.multi;
};

export const DatePicker = defineComponent({
  name: 'DatePicker',
  props: {
    /** v-model: the encoded selection value (same wire format as DateField storage: ISO). */
    modelValue: { type: String, default: undefined },
    mode: { type: String as PropType<DatePickerEngineOptions['mode']>, default: undefined },
    initialFocused: { type: Object as PropType<CalendarDate>, default: undefined },
    initialSelected: {
      type: [Object, Array] as PropType<InitialSelected>,
      default: undefined,
    },
    min: { type: Object as PropType<CalendarDate>, default: undefined },
    max: { type: Object as PropType<CalendarDate>, default: undefined },
    locale: {
      type: [String, Object] as PropType<DatePickerEngineOptions['locale']>,
      default: undefined,
    },
    disabledWeekdays: { type: Array as PropType<ReadonlyArray<number>>, default: undefined },
    calendar: {
      type: [String, Object] as PropType<DatePickerEngineOptions['calendar']>,
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
    rangeOverDisabled: {
      type: String as PropType<DatePickerEngineOptions['rangeOverDisabled']>,
      default: undefined,
    },
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
    'update:modelValue': (_value: string) => true,
  },
  setup(props, { emit, slots, expose }) {
    // Reconfigurable engine options — everything except the construction-only
    // initial* fields. Also used as a reactive watch source for setOptions.
    const reconfigurableOptions = (): DatePickerEngineOptions => ({
      ...(props.mode !== undefined ? { mode: props.mode } : {}),
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
      ...(props.rangeOverDisabled !== undefined
        ? { rangeOverDisabled: props.rangeOverDisabled }
        : {}),
      ...(props.highlights !== undefined ? { highlights: props.highlights } : {}),
      headerSelectors: props.headerSelectors,
      ...(props.yearRange !== undefined ? { yearRange: props.yearRange } : {}),
    });

    const localeString =
      typeof props.locale === 'string' ? props.locale : (props.locale?.locale ?? 'en-US');
    const initialSelected =
      props.initialSelected ??
      (props.modelValue
        ? decodedToInitial(
            decodeSelectionValue(props.modelValue, props.mode ?? 'single', localeString),
          )
        : undefined);

    const { engine, state } = useDatePicker({
      ...reconfigurableOptions(),
      ...(props.initialFocused !== undefined ? { initialFocused: props.initialFocused } : {}),
      ...(initialSelected !== undefined ? { initialSelected } : {}),
    });

    // Events come from the ENGINE so keyboard selection (Enter/Space),
    // presets and programmatic changes all emit — not just clicks.
    engine.on('select', ({ focused, selection }) => {
      emit('select', focused);
      emit('update:modelValue', encodeSelectionValue(selection, engine.calendar));
    });
    engine.on('change', ({ state: next }) => emit('change', next));

    // Live prop changes reconfigure the engine.
    watch(reconfigurableOptions, opts => engine.setOptions(opts));

    // External v-model writes apply to the engine.
    watch(
      () => props.modelValue,
      v => {
        if (v === undefined) return;
        const encoded = encodeSelectionValue(engine.state.selection, engine.calendar);
        if (v === encoded) return;
        const decoded = v ? decodeSelectionValue(v, engine.state.mode, engine.locale.locale) : null;
        if (!decoded) {
          engine.clearSelection();
          return;
        }
        if (decoded.single) {
          engine.select(decoded.single);
        } else if (decoded.range) {
          engine.selectRange(decoded.range.start, decoded.range.end);
        } else if (decoded.multi) {
          engine.clearSelection();
          for (const d of decoded.multi) engine.select(d);
        }
      },
    );

    const rootRef = ref<HTMLElement | null>(null);
    expose({
      engine,
      focus: (): void => {
        const cell = rootRef.value?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
        (cell ?? rootRef.value)?.focus();
      },
    });

    return () => {
      const s = state.value;
      const fmt = engine.formatter;

      const onDayClick = (date: CalendarDate): void => {
        if (!engine.isPickable(date)) return;
        engine.select(date);
      };

      const onPeriodClick = (date: CalendarDate): void => {
        engine.pickInView(date);
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
              weekNumbers: useWeeks,
            });

        const headCells: VNode[] = [];
        if (useWeeks)
          headCells.push(
            h('div', { class: 'cal-picker__weeknum-header', role: 'columnheader' }, 'Wk'),
          );
        for (const w of monthGrid.weekdayHeaders) {
          headCells.push(
            h(
              'div',
              { class: 'cal-picker__weekday', role: 'columnheader' },
              fmt.formatWeekday(w, 'short'),
            ),
          );
        }
        const rows: VNode[] = [
          h('div', { class: 'cal-picker__row cal-picker__row--head', role: 'row' }, headCells),
        ];
        monthGrid.weeks.forEach((week, weekIdx) => {
          const cells: VNode[] = [];
          if (useWeeks && week[0]) {
            cells.push(
              h(
                'div',
                { class: 'cal-picker__weeknum' },
                String(monthGrid.weekNumbers?.[weekIdx] ?? isoWeekOfYear(week[0].date)),
              ),
            );
          }
          for (const cell of week) cells.push(renderDayCell(cell, focusedMonth));
          const first = week[0];
          rows.push(
            h(
              'div',
              {
                key: first ? `${first.date.year}-${first.date.month}-${first.date.day}` : weekIdx,
                class: 'cal-picker__row',
                role: 'row',
              },
              cells,
            ),
          );
        });
        return h(
          'div',
          {
            key: `${focusedMonth.year}-${focusedMonth.month}`,
            class: `cal-picker__grid${useWeeks ? ' cal-picker__grid--with-weeks' : ''}`,
            role: 'grid',
            onMouseleave: () => engine.setHovered(null),
          },
          rows,
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
        const rows: VNode[] = [];
        for (let i = 0; i < period.cells.length; i += PERIOD_COLUMNS) {
          const rowCells = period.cells.slice(i, i + PERIOD_COLUMNS);
          rows.push(
            h(
              'div',
              {
                key: rowCells[0] ? `${rowCells[0].date.year}-${rowCells[0].date.month}` : i,
                class: 'cal-picker__row',
                role: 'row',
              },
              rowCells.map((cell: PeriodCell) =>
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
            ),
          );
        }
        return h('div', { class: 'cal-picker__grid cal-picker__grid--period', role: 'grid' }, rows);
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
                  onClick: () => p.apply(engine),
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
          ref: rootRef,
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
