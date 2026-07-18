import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createCalendarDate } from '@anil-labs/core';
import type * as CoreModule from '@anil-labs/core';
import { DateField, type DateFieldHandle } from '../src/date-field.js';

vi.mock('@anil-labs/core', async importOriginal => {
  const actual = await importOriginal<typeof CoreModule>();
  return { ...actual, announce: vi.fn() };
});

const { announce } = await import('@anil-labs/core');

beforeEach(() => {
  vi.mocked(announce).mockClear();
});

describe('<DateField>', () => {
  it('shows the committed value as selected when the popover reopens', async () => {
    const user = userEvent.setup();
    render(<DateField defaultValue="2025-04-15" />);
    await user.click(screen.getByRole('textbox'));
    const cell = await screen.findByRole('gridcell', { name: /Tuesday, April 15, 2025/ });
    expect(cell.getAttribute('aria-selected')).toBe('true');
    expect(cell.getAttribute('data-selected')).toBe('true');
  });

  it('seeds the popover range selection in range mode', async () => {
    const user = userEvent.setup();
    render(<DateField mode="range" defaultValue="2025-04-10/2025-04-15" />);
    await user.click(screen.getByRole('textbox'));
    const start = await screen.findByRole('gridcell', { name: /April 10, 2025/ });
    const end = screen.getByRole('gridcell', { name: /Tuesday, April 15, 2025/ });
    expect(start.getAttribute('data-range-start')).toBe('true');
    expect(end.getAttribute('data-range-end')).toBe('true');
  });

  it('keeps the caret position on mid-string edits', async () => {
    const user = userEvent.setup();
    render(<DateField format="eu" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, '0102');
    expect(input.value).toBe('01/02');
    // Place the caret after "01" and insert a digit mid-string.
    await user.type(input, '5', { initialSelectionStart: 2, initialSelectionEnd: 2 });
    expect(input.selectionStart).toBe(4); // right after the inserted digit
    expect(input.selectionStart).not.toBe(input.value.length);
  });

  it('rejects blur commits that violate min', () => {
    const onChange = vi.fn();
    render(<DateField min={createCalendarDate(2025, 4, 10)} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2025-04-05' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('2025-04-05'); // text kept for correction
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('true');
  });

  it('rejects blur commits on disabled weekdays', () => {
    const onChange = vi.fn();
    // 2025-04-13 is a Sunday (weekday 0)
    render(<DateField disabledWeekdays={[0]} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2025-04-13' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('still commits valid dates on blur', () => {
    const onChange = vi.fn();
    render(<DateField min={createCalendarDate(2025, 4, 10)} onChange={onChange} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2025-04-12' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith('2025-04-12');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('composes inputProps handlers instead of overwriting internal ones', async () => {
    const userChange = vi.fn();
    const user = userEvent.setup();
    render(<DateField inputProps={{ onChange: userChange, 'data-testid': 'df' } as never} />);
    const input = screen.getByTestId('df') as HTMLInputElement;
    await user.type(input, '2025');
    // Internal masking still ran (value tracked) AND the user's handler fired.
    expect(input.value).toBe('2025');
    expect(userChange).toHaveBeenCalled();
  });

  it('does not announce on mount and announces the display value on change', () => {
    render(<DateField defaultValue="2025-04-15" format="eu" valueFormat="iso" />);
    expect(announce).not.toHaveBeenCalled();

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('15/04/2025');
    fireEvent.change(input, { target: { value: '16/04/2025' } });
    fireEvent.blur(input);
    expect(announce).toHaveBeenCalledWith('Selected 16/04/2025');
  });

  it('preserves separators while typing multiple dates in multi mode', () => {
    render(<DateField mode="multi" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2025-04-05, 2025-04-07' } });
    expect(input.value).toBe('2025-04-05, 2025-04-07');
  });

  it('exposes focus() and the popover engine through the forwarded ref', async () => {
    const ref = createRef<DateFieldHandle>();
    const user = userEvent.setup();
    render(<DateField ref={ref} defaultValue="2025-04-15" />);
    expect(ref.current?.engine).toBeNull(); // popover closed
    act(() => ref.current?.focus());
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
    await user.click(screen.getByRole('textbox'));
    await screen.findByRole('grid');
    expect(ref.current?.engine?.state.focused).toEqual({ year: 2025, month: 4, day: 15 });
  });
});
