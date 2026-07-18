import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createCalendarDate } from '@anil-labs/core';
import { DatePicker, type DatePickerHandle } from '../src/date-picker.js';

describe('<DatePicker>', () => {
  it('renders the grid with cells for the focused month', () => {
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} />);
    expect(screen.getByRole('group', { name: /date picker/i })).toBeTruthy();
    expect(screen.getByRole('grid')).toBeTruthy();
    // Day 15 is present in the April 2025 grid
    expect(screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ })).toBeTruthy();
  });

  it('fires onSelect when a date is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} onSelect={onSelect} />);
    await user.click(screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ year: 2025, month: 4, day: 15 });
  });

  it('skips disabled dates', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <DatePicker
        initialFocused={createCalendarDate(2025, 4, 15)}
        min={createCalendarDate(2025, 4, 10)}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole('gridcell', { name: /April 5, 2025/ }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows the Today preset by default', () => {
    render(<DatePicker />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
  });

  it('respects hideFooter', () => {
    render(<DatePicker hideFooter />);
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} />);
    const focused = screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ });
    focused.focus();
    await user.keyboard('{ArrowRight}');
    // Tab focus moves; the new focused cell is April 16
    expect(screen.getByRole('gridcell', { name: /Wednesday, April 16, 2025/ })).toBeTruthy();
  });

  it('drills up to the month view when the title is clicked', async () => {
    const user = userEvent.setup();
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} />);
    const title = screen.getByRole('button', { name: /April 2025/ });
    await user.click(title);
    // Title changes to just the year
    expect(screen.getByRole('button', { name: '2025' })).toBeTruthy();
  });

  it('renders multi-month layout when months > 1', () => {
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} months={2} />);
    // Two grids
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('renders the time picker row when withTime is set', () => {
    render(<DatePicker withTime />);
    // Three or more time fields would be hour + minute (+ seconds in 12h with-seconds)
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('applies loosened min after a rerender (engine.setOptions)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <DatePicker
        initialFocused={createCalendarDate(2025, 4, 15)}
        min={createCalendarDate(2025, 4, 10)}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole('gridcell', { name: /April 5, 2025/ }));
    expect(onSelect).not.toHaveBeenCalled();

    rerender(
      <DatePicker
        initialFocused={createCalendarDate(2025, 4, 15)}
        min={createCalendarDate(2025, 4, 1)}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole('gridcell', { name: /April 5, 2025/ }));
    expect(onSelect).toHaveBeenCalledWith({ year: 2025, month: 4, day: 5 });
  });

  it('fires onSelect and onChange on keyboard Enter', async () => {
    const onSelect = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DatePicker
        initialFocused={createCalendarDate(2025, 4, 15)}
        onSelect={onSelect}
        onChange={onChange}
      />,
    );
    screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ }).focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({ year: 2025, month: 4, day: 15 });
    expect(onChange).toHaveBeenCalled();
  });

  it('wraps the weekday header and each week in role="row" containers', () => {
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} />);
    const rows = screen.getAllByRole('row');
    // 1 weekday header row + 6 fixed weeks
    expect(rows).toHaveLength(7);
    expect(rows[0]?.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
    expect(rows[1]?.querySelectorAll('[role="gridcell"]')).toHaveLength(7);
  });

  it('wraps period-grid cells in role="row" containers', async () => {
    const user = userEvent.setup();
    render(<DatePicker initialFocused={createCalendarDate(2025, 4, 15)} />);
    await user.click(screen.getByRole('button', { name: /April 2025/ }));
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // 12 months, 4 per row
    expect(rows[0]?.querySelectorAll('[role="gridcell"]')).toHaveLength(4);
  });

  it('renders the week-number column from grid.weekNumbers', () => {
    const { container } = render(
      <DatePicker initialFocused={createCalendarDate(2025, 4, 15)} weekNumbers />,
    );
    const nums = container.querySelectorAll('.cal-picker__weeknum');
    expect(nums).toHaveLength(6);
    // First row starts Sun Mar 30, 2025 → ISO week 13
    expect(nums[0]?.textContent).toBe('13');
  });

  it('exposes the engine and focus() through the forwarded ref', () => {
    const ref = createRef<DatePickerHandle>();
    render(<DatePicker ref={ref} initialFocused={createCalendarDate(2025, 4, 15)} />);
    expect(ref.current?.engine.state.focused).toEqual({ year: 2025, month: 4, day: 15 });
    ref.current?.focus();
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/April 15, 2025/);
  });
});
