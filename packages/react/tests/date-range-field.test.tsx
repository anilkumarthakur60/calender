import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateRangeField } from '../src/date-range-field.js';

const type = (input: HTMLElement, value: string): void => {
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

describe('<DateRangeField>', () => {
  it('publishes a combined eu-format value and populates hidden inputs', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateRangeField format="eu" nameStart="from" nameEnd="to" onChange={onChange} />,
    );
    const [startInput, endInput] = screen.getAllByRole('textbox');

    type(startInput as HTMLElement, '01/02/2026');
    // Half a range is not a combined value yet.
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLInputElement>('input[name="from"]')?.value).toBe(
      '01/02/2026',
    );

    type(endInput as HTMLElement, '05/02/2026');
    expect(onChange).toHaveBeenCalledWith('01/02/2026 – 05/02/2026');
    expect(container.querySelector<HTMLInputElement>('input[name="from"]')?.value).toBe(
      '01/02/2026',
    );
    expect(container.querySelector<HTMLInputElement>('input[name="to"]')?.value).toBe('05/02/2026');
  });

  it('decomposes a controlled non-ISO value into both fields', () => {
    render(<DateRangeField format="eu" value="01/02/2026 – 05/02/2026" />);
    const [startInput, endInput] = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(startInput?.value).toBe('01/02/2026');
    expect(endInput?.value).toBe('05/02/2026');
  });

  it('round-trips iso storage with an eu display format', () => {
    const onChange = vi.fn();
    render(<DateRangeField format="eu" valueFormat="iso" onChange={onChange} />);
    const [startInput, endInput] = screen.getAllByRole('textbox');
    type(startInput as HTMLElement, '01/02/2026');
    type(endInput as HTMLElement, '05/02/2026');
    expect(onChange).toHaveBeenCalledWith('2026-02-01/2026-02-05');
  });

  it('clears the end date when the new start passes it', () => {
    render(<DateRangeField defaultValue="2026-02-01/2026-02-05" />);
    const [startInput, endInput] = screen.getAllByRole('textbox') as HTMLInputElement[];
    type(startInput as HTMLElement, '2026-02-10');
    expect(endInput?.value).toBe('');
  });

  it('enforces minRangeDays through the end field bounds', () => {
    const onChange = vi.fn();
    render(
      <DateRangeField defaultValue="2026-02-01/2026-02-10" minRangeDays={5} onChange={onChange} />,
    );
    const [, endInput] = screen.getAllByRole('textbox') as HTMLInputElement[];
    // End must be at least start + 4 days (2026-02-05).
    type(endInput as HTMLElement, '2026-02-03');
    expect(onChange).not.toHaveBeenCalled();
    expect(endInput?.getAttribute('aria-invalid')).toBe('true');

    type(endInput as HTMLElement, '2026-02-06');
    expect(onChange).toHaveBeenCalledWith('2026-02-01/2026-02-06');
  });

  it('enforces maxRangeDays through the end field bounds', () => {
    const onChange = vi.fn();
    render(
      <DateRangeField defaultValue="2026-02-01/2026-02-03" maxRangeDays={4} onChange={onChange} />,
    );
    const [, endInput] = screen.getAllByRole('textbox') as HTMLInputElement[];
    type(endInput as HTMLElement, '2026-02-10'); // > start + 3
    expect(onChange).not.toHaveBeenCalled();
    expect(endInput?.getAttribute('aria-invalid')).toBe('true');
  });
});
