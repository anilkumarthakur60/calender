import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createCalendarDate } from '@anil-labs/core';
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
});
