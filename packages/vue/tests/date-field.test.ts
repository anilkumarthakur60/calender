import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { h } from 'vue';
import { createCalendarDate } from '@anil-labs/core';
import { DateField } from '../src/DateField.js';

describe('<DateField>', () => {
  it('keeps a stable input id across re-renders', async () => {
    const { rerender } = render(DateField, { props: { label: 'Date' } });
    const input = screen.getByLabelText('Date');
    const id = input.getAttribute('id');
    expect(id).toBeTruthy();

    await rerender({ label: 'Date', helperText: 'pick a day' });
    expect(screen.getByLabelText('Date').getAttribute('id')).toBe(id);
  });

  it('honors an explicit id prop', () => {
    render(DateField, { props: { label: 'Date', id: 'my-date' } });
    expect(screen.getByLabelText('Date').getAttribute('id')).toBe('my-date');
  });

  it('shows the committed modelValue as selected when the popover opens', async () => {
    const user = userEvent.setup();
    render(DateField, { props: { modelValue: '2025-04-15' } });
    await user.click(screen.getByRole('textbox'));
    const cell = await screen.findByRole('gridcell', { name: /Tuesday, April 15, 2025/ });
    expect(cell.getAttribute('aria-selected')).toBe('true');
    expect(cell.getAttribute('data-selected')).toBe('true');
  });

  it('seeds the popover range selection in range mode', async () => {
    const user = userEvent.setup();
    render(DateField, { props: { mode: 'range', modelValue: '2025-04-10/2025-04-15' } });
    await user.click(screen.getByRole('textbox'));
    const start = await screen.findByRole('gridcell', { name: /April 10, 2025/ });
    const end = screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ });
    expect(start.getAttribute('data-range-start')).toBe('true');
    expect(end.getAttribute('data-range-end')).toBe('true');
  });

  it('keeps the caret position on mid-string edits', async () => {
    const user = userEvent.setup();
    render(DateField, { props: { format: 'eu' } });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, '0102');
    expect(input.value).toBe('01/02');
    // Place the caret after "01" and insert a digit mid-string.
    await user.type(input, '5', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    expect(input.selectionStart).toBe(4); // right after the inserted digit
    expect(input.selectionStart).not.toBe(input.value.length);
  });

  it('rejects blur commits that violate min', async () => {
    const { emitted } = render(DateField, {
      props: { min: createCalendarDate(2025, 4, 10) },
    });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.update(input, '2025-04-05');
    await fireEvent.blur(input);
    expect(emitted('update:modelValue')).toBeUndefined();
    expect(input.value).toBe('2025-04-05'); // text kept for correction
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('true');
  });

  it('rejects blur commits on disabled weekdays', async () => {
    const { emitted } = render(DateField, { props: { disabledWeekdays: [0] } });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // 2025-04-13 is a Sunday (weekday 0)
    await fireEvent.update(input, '2025-04-13');
    await fireEvent.blur(input);
    expect(emitted('update:modelValue')).toBeUndefined();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('still commits valid dates on blur', async () => {
    const { emitted } = render(DateField, {
      props: { min: createCalendarDate(2025, 4, 10) },
    });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.update(input, '2025-04-12');
    await fireEvent.blur(input);
    expect(emitted('update:modelValue')?.at(-1)).toEqual(['2025-04-12']);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('preserves separators while typing multiple dates in multi mode', async () => {
    render(DateField, { props: { mode: 'multi' } });
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.update(input, '2025-04-05, 2025-04-07');
    expect(input.value).toBe('2025-04-05, 2025-04-07');
  });

  it('forwards the cell slot and hideFooter to the popover picker', async () => {
    const user = userEvent.setup();
    render(DateField, {
      props: { modelValue: '2025-04-15', hideFooter: true },
      slots: {
        cell: (ctx: { defaultLabel: string }) =>
          h('span', { 'data-testid': 'custom-cell' }, ctx.defaultLabel),
      },
    });
    await user.click(screen.getByRole('textbox'));
    await screen.findByRole('grid');
    expect(screen.getAllByTestId('custom-cell').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });
});
