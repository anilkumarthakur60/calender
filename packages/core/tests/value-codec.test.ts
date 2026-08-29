import { describe, expect, it } from 'vitest';
import {
  createCalendarDate,
  decodeSelectionValue,
  encodeSelectionValue,
  formatSelection,
  GregorianCalendar,
  parseSelection,
  type FormatPreset,
  type SelectionValue,
} from '../src/index.js';

const greg = new GregorianCalendar();

const single: SelectionValue = { mode: 'single', value: createCalendarDate(2025, 1, 1) };
const range: SelectionValue = {
  mode: 'range',
  value: { start: createCalendarDate(2025, 1, 1), end: createCalendarDate(2025, 1, 10) },
  anchor: null,
};
const multi: SelectionValue = {
  mode: 'multi',
  value: [
    createCalendarDate(2025, 1, 1),
    createCalendarDate(2025, 2, 14),
    createCalendarDate(2025, 12, 31),
  ],
};

const PRESETS: FormatPreset[] = ['iso', 'us', 'eu', 'short', 'medium', 'long'];

describe('encodeSelectionValue → decodeSelectionValue round-trip', () => {
  it('single', () => {
    const txt = encodeSelectionValue(single, greg);
    expect(decodeSelectionValue(txt, 'single')?.single).toEqual({ year: 2025, month: 1, day: 1 });
  });

  it('range  "/" separator does not split inside ISO dates', () => {
    const txt = encodeSelectionValue(range, greg);
    expect(txt).toBe('2025-01-01/2025-01-10');
    const back = decodeSelectionValue(txt, 'range');
    expect(back?.range?.start).toEqual({ year: 2025, month: 1, day: 1 });
    expect(back?.range?.end).toEqual({ year: 2025, month: 1, day: 10 });
  });

  it('multi', () => {
    const txt = encodeSelectionValue(multi, greg);
    const back = decodeSelectionValue(txt, 'multi');
    expect(back?.multi).toHaveLength(3);
    expect(back?.multi?.[2]).toEqual({ year: 2025, month: 12, day: 31 });
  });
});

describe('decodeSelectionValue  separator-safe range splitting', () => {
  it('US slashes with spaced dash', () => {
    const back = decodeSelectionValue('01/01/2025 - 01/10/2025', 'range', 'en-US');
    expect(back?.range?.start).toEqual({ year: 2025, month: 1, day: 1 });
    expect(back?.range?.end).toEqual({ year: 2025, month: 1, day: 10 });
  });

  it('US slashes with en-dash', () => {
    const back = decodeSelectionValue('01/01/2025 – 01/10/2025', 'range', 'en-US');
    expect(back?.range?.end).toEqual({ year: 2025, month: 1, day: 10 });
  });

  it('"to" separator', () => {
    const back = decodeSelectionValue('2025-01-01 to 2025-01-10', 'range');
    expect(back?.range?.end).toEqual({ year: 2025, month: 1, day: 10 });
  });

  it('bare "-" between ISO dates picks the split where both halves parse', () => {
    const back = decodeSelectionValue('2025-01-01-2025-01-10', 'range');
    expect(back?.range?.start).toEqual({ year: 2025, month: 1, day: 1 });
    expect(back?.range?.end).toEqual({ year: 2025, month: 1, day: 10 });
  });
});

describe('formatSelection → parseSelection round-trip (every preset × mode)', () => {
  for (const preset of PRESETS) {
    it(`single × ${preset}`, () => {
      const txt = formatSelection(single, { pattern: preset, locale: 'en-US' });
      const back = parseSelection(txt, 'single', { pattern: preset, locale: 'en-US' });
      expect(back?.single).toEqual({ year: 2025, month: 1, day: 1 });
    });

    it(`range × ${preset}`, () => {
      const txt = formatSelection(range, { pattern: preset, locale: 'en-US' });
      const back = parseSelection(txt, 'range', { pattern: preset, locale: 'en-US' });
      expect(back?.range?.start).toEqual({ year: 2025, month: 1, day: 1 });
      expect(back?.range?.end).toEqual({ year: 2025, month: 1, day: 10 });
    });

    it(`multi × ${preset}`, () => {
      const txt = formatSelection(multi, { pattern: preset, locale: 'en-US' });
      const back = parseSelection(txt, 'multi', { pattern: preset, locale: 'en-US' });
      expect(back?.multi).toHaveLength(3);
      expect(back?.multi?.[0]).toEqual({ year: 2025, month: 1, day: 1 });
      expect(back?.multi?.[1]).toEqual({ year: 2025, month: 2, day: 14 });
      expect(back?.multi?.[2]).toEqual({ year: 2025, month: 12, day: 31 });
    });
  }

  it('multi × medium  commas inside "Jan 1, 2025" do not split items', () => {
    const txt = formatSelection(multi, { pattern: 'medium', locale: 'en-US' });
    expect(txt).toBe('Jan 1, 2025; Feb 14, 2025; Dec 31, 2025');
    const back = parseSelection(txt, 'multi', { pattern: 'medium', locale: 'en-US' });
    expect(back?.multi).toHaveLength(3);
  });
});
