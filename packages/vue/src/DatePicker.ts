import { defineComponent, h, type PropType } from 'vue';
import {
  type CalendarDate,
  type DatePickerEngineOptions,
  isSameDay,
  isInRange,
} from '@calender/core';
import { useDatePicker } from './use-date-picker.js';

/**
 * Render-function based component (no SFC) — keeps the build single-file and
 * sidesteps needing a Vue SFC compiler in the library pipeline.
 */
export const DatePicker = defineComponent({
  name: 'DatePicker',
  props: {
    mode: { type: String as PropType<DatePickerEngineOptions['mode']>, default: undefined },
    min: { type: Object as PropType<CalendarDate>, default: undefined },
    max: { type: Object as PropType<CalendarDate>, default: undefined },
    locale: {
      type: [String, Object] as PropType<DatePickerEngineOptions['locale']>,
      default: undefined,
    },
    disabledWeekdays: { type: Array as PropType<ReadonlyArray<number>>, default: undefined },
  },
  emits: {
    select: (_date: CalendarDate) => true,
  },
  setup(props, { emit }) {
    const options: DatePickerEngineOptions = {
      ...(props.mode !== undefined ? { mode: props.mode } : {}),
      ...(props.min !== undefined ? { min: props.min } : {}),
      ...(props.max !== undefined ? { max: props.max } : {}),
      ...(props.locale !== undefined ? { locale: props.locale } : {}),
      ...(props.disabledWeekdays !== undefined ? { disabledWeekdays: props.disabledWeekdays } : {}),
    };

    const { engine, state } = useDatePicker(options);

    return () => {
      const s = state.value;
      const fmt = engine.formatter;

      const weekdayHeaders = s.grid.weekdayHeaders.map(w =>
        h(
          'div',
          { class: 'cal-picker__weekday', role: 'columnheader' },
          fmt.formatWeekday(w, 'short'),
        ),
      );

      const cells = s.grid.weeks.flatMap(week =>
        week.map(cell => {
          const selected = engine.isSelected(cell.date);
          const disabled = engine.isDisabled(cell.date);
          const focused = isSameDay(cell.date, s.focused);
          const range = s.selection.mode === 'range' ? s.selection.value : null;
          const isStart = range ? isSameDay(cell.date, range.start) : false;
          const isEnd = range ? isSameDay(cell.date, range.end) : false;
          const isMid = range ? isInRange(cell.date, range, true) && !isStart && !isEnd : false;
          return h(
            'button',
            {
              key: `${cell.date.year}-${cell.date.month}-${cell.date.day}`,
              type: 'button',
              role: 'gridcell',
              class: 'cal-picker__cell',
              tabindex: focused ? 0 : -1,
              'aria-selected': selected || undefined,
              'aria-disabled': disabled || undefined,
              'aria-label': fmt.formatFull(cell.date),
              'data-outside': !cell.inCurrentMonth ? 'true' : undefined,
              'data-today': cell.isToday ? 'true' : undefined,
              'data-weekend': cell.isWeekend ? 'true' : undefined,
              'data-selected': selected ? 'true' : undefined,
              'data-disabled': disabled ? 'true' : undefined,
              'data-range-start': isStart ? 'true' : undefined,
              'data-range-end': isEnd ? 'true' : undefined,
              'data-range-mid': isMid ? 'true' : undefined,
              onClick: () => {
                if (disabled) return;
                engine.select(cell.date);
                emit('select', cell.date);
              },
            },
            fmt.formatDay(cell.date),
          );
        }),
      );

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
          h('div', { class: 'cal-picker__header' }, [
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
            h(
              'button',
              { type: 'button', class: 'cal-picker__title', onClick: () => engine.drillUp() },
              fmt.formatMonthYear(s.focused),
            ),
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
          ]),
          h('div', { class: 'cal-picker__grid', role: 'grid' }, [...weekdayHeaders, ...cells]),
        ],
      );
    };
  },
});
