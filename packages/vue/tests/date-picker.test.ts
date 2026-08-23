import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { mount } from '@vue/test-utils';
import userEvent from '@testing-library/user-event';
import {
  createCalendarDate,
  createCalendarSystem,
  type DatePickerEngine,
} from '@anil-labs/calendar-core';
import { DatePicker } from '../src/DatePicker.js';

describe('<DatePicker>', () => {
  it('renders the grid for the focused month', () => {
    render(DatePicker, {
      props: { initialFocused: createCalendarDate(2025, 4, 15) },
    });
    expect(screen.getByRole('group', { name: /date picker/i })).toBeTruthy();
    expect(screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ })).toBeTruthy();
  });

  it('emits select when a cell is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(DatePicker, {
      props: { initialFocused: createCalendarDate(2025, 4, 15) },
      attrs: { onSelect },
    });
    await user.click(screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ }));
    expect(onSelect).toHaveBeenCalledWith({ year: 2025, month: 4, day: 15 });
  });

  it('shows the Today preset by default', () => {
    render(DatePicker);
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
  });

  it('respects hideFooter', () => {
    render(DatePicker, { props: { hideFooter: true } });
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('drills up to month view via the title button', async () => {
    const user = userEvent.setup();
    render(DatePicker, { props: { initialFocused: createCalendarDate(2025, 4, 15) } });
    const title = screen.getByRole('button', { name: /April 2025/ });
    await user.click(title);
    expect(screen.getByRole('button', { name: '2025' })).toBeTruthy();
  });

  it('renders header dropdowns when headerSelectors is true', () => {
    render(DatePicker, {
      props: {
        initialFocused: createCalendarDate(2025, 4, 15),
        headerSelectors: true,
      },
    });
    expect(screen.getByRole('combobox', { name: 'Month' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Year' })).toBeTruthy();
  });

  it('renders multi-month layout when months > 1', () => {
    render(DatePicker, {
      props: { initialFocused: createCalendarDate(2025, 4, 15), months: 2 },
    });
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('applies loosened min after a prop change (engine.setOptions)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(DatePicker, {
      props: {
        initialFocused: createCalendarDate(2025, 4, 15),
        min: createCalendarDate(2025, 4, 10),
      },
      attrs: { onSelect },
    });
    await user.click(screen.getByRole('gridcell', { name: /April 5, 2025/ }));
    expect(onSelect).not.toHaveBeenCalled();

    await rerender({ min: createCalendarDate(2025, 4, 1) });
    await user.click(screen.getByRole('gridcell', { name: /April 5, 2025/ }));
    expect(onSelect).toHaveBeenCalledWith({ year: 2025, month: 4, day: 5 });
  });

  it('emits select and change on keyboard Enter', async () => {
    const user = userEvent.setup();
    const { emitted } = render(DatePicker, {
      props: { initialFocused: createCalendarDate(2025, 4, 15) },
    });
    screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ }).focus();
    await user.keyboard('{Enter}');
    expect(emitted('select')?.at(-1)).toEqual([{ year: 2025, month: 4, day: 15 }]);
    expect(emitted('change')?.length).toBeGreaterThan(0);
  });

  it('wraps the weekday header and each week in role="row" containers', () => {
    render(DatePicker, { props: { initialFocused: createCalendarDate(2025, 4, 15) } });
    const rows = screen.getAllByRole('row');
    // 1 weekday header row + 6 fixed weeks
    expect(rows).toHaveLength(7);
    expect(rows[0]?.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
    expect(rows[1]?.querySelectorAll('[role="gridcell"]')).toHaveLength(7);
  });

  it('wraps period-grid cells in role="row" containers', async () => {
    const user = userEvent.setup();
    render(DatePicker, { props: { initialFocused: createCalendarDate(2025, 4, 15) } });
    await user.click(screen.getByRole('button', { name: /April 2025/ }));
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // 12 months, 4 per row
    expect(rows[0]?.querySelectorAll('[role="gridcell"]')).toHaveLength(4);
  });

  it('renders the week-number column from grid.weekNumbers', () => {
    const { container } = render(DatePicker, {
      props: { initialFocused: createCalendarDate(2025, 4, 15), weekNumbers: true },
    });
    const nums = container.querySelectorAll('.cal-picker__weeknum');
    expect(nums).toHaveLength(6);
    // First row starts Sun Mar 30, 2025 → ISO week 13
    expect(nums[0]?.textContent).toBe('13');
  });

  it('accepts a CalendarSystem object for the calendar prop', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(DatePicker, {
      props: {
        calendar: createCalendarSystem('gregorian'),
        initialFocused: createCalendarDate(2025, 4, 15),
      },
    });
    expect(screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ })).toBeTruthy();
    expect(warn.mock.calls.some(c => String(c[0]).includes('type check failed'))).toBe(false);
    warn.mockRestore();
  });

  it('seeds from modelValue and emits update:modelValue on selection', async () => {
    const user = userEvent.setup();
    const { emitted } = render(DatePicker, {
      props: { modelValue: '2025-04-15', initialFocused: createCalendarDate(2025, 4, 15) },
    });
    const seeded = screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ });
    expect(seeded.getAttribute('aria-selected')).toBe('true');

    await user.click(screen.getByRole('gridcell', { name: /Wednesday, April 16, 2025/ }));
    expect(emitted('update:modelValue')?.at(-1)).toEqual(['2025-04-16']);
  });

  it('applies external modelValue writes to the engine', async () => {
    const { rerender } = render(DatePicker, {
      props: { modelValue: '', initialFocused: createCalendarDate(2025, 4, 15) },
    });
    await rerender({ modelValue: '2025-04-16' });
    const cell = screen.getByRole('gridcell', { name: /Wednesday, April 16, 2025/ });
    expect(cell.getAttribute('aria-selected')).toBe('true');
  });

  it('exposes engine and focus() via the component instance', () => {
    const wrapper = mount(DatePicker, {
      props: { initialFocused: createCalendarDate(2025, 4, 15) },
      attachTo: document.body,
    });
    const vm = wrapper.vm as unknown as { engine: DatePickerEngine; focus: () => void };
    expect(vm.engine.state.focused).toEqual({ year: 2025, month: 4, day: 15 });
    vm.focus();
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/April 15, 2025/);
    wrapper.unmount();
  });
});
