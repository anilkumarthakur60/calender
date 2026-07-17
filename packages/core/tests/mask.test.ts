import { describe, expect, it } from 'vitest';
import { applyMask, isMaskable } from '../src/index.js';

describe('applyMask', () => {
  it('inserts separators for iso (yyyy-MM-dd)', () => {
    expect(applyMask('2025', 'iso').value).toBe('2025');
    expect(applyMask('20250', 'iso').value).toBe('2025-0');
    expect(applyMask('20250415', 'iso').value).toBe('2025-04-15');
  });

  it('inserts separators for US (MM/dd/yyyy)', () => {
    expect(applyMask('04152025', 'us').value).toBe('04/15/2025');
  });

  it('inserts separators for EU (dd/MM/yyyy)', () => {
    expect(applyMask('15042025', 'eu').value).toBe('15/04/2025');
  });

  it('strips non-digits before applying the mask', () => {
    expect(applyMask('2025-04-15', 'iso').value).toBe('2025-04-15');
    expect(applyMask('20-25-04-1-5', 'iso').value).toBe('2025-04-15');
    expect(applyMask('abc20250415def', 'iso').value).toBe('2025-04-15');
  });

  it('does not append a trailing separator', () => {
    expect(applyMask('2025', 'iso').value).toBe('2025'); // not "2025-"
    expect(applyMask('202504', 'iso').value).toBe('2025-04'); // not "2025-04-"
  });

  it('stops at the pattern length', () => {
    expect(applyMask('202504151234', 'iso').value).toBe('2025-04-15');
  });

  it('isMaskable false for patterns with name tokens', () => {
    expect(isMaskable('iso')).toBe(true);
    expect(isMaskable('yyyy-MM-dd')).toBe(true);
    expect(isMaskable('MMM d, yyyy')).toBe(false);
    expect(isMaskable('MMMM d, yyyy')).toBe(false);
    expect(isMaskable('h:mm a')).toBe(false);
  });

  it('passes through unchanged when pattern is not maskable', () => {
    expect(applyMask('Apr 15, 2025', 'medium').value).toBe('Apr 15, 2025');
  });
});

describe('applyMask — single-digit tokens (M/d in "short")', () => {
  it('regression: 12/3/2025 stays 12/3/2025 (was 1/2/3202)', () => {
    expect(applyMask('12/3/2025', 'short')).toEqual({ value: '12/3/2025', caret: 9 });
  });

  it('separator commits a 1-digit month', () => {
    expect(applyMask('1/3/2025', 'short').value).toBe('1/3/2025');
  });

  it('digit stream without separators still splits on max values', () => {
    // "1232025" → M=12 (≤12), d=3 ("32" > 31), yyyy=2025
    expect(applyMask('1232025', 'short').value).toBe('12/3/2025');
  });

  it('auto-commits when no second digit can fit (M=3 → 30 > 12)', () => {
    expect(applyMask('342025', 'short').value).toBe('3/4/2025');
  });

  it('partial input never gains a trailing separator', () => {
    expect(applyMask('12', 'short').value).toBe('12');
    expect(applyMask('12/3', 'short').value).toBe('12/3');
  });
});
