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
