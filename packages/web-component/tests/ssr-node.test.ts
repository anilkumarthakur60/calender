// @vitest-environment node
import { describe, expect, it } from 'vitest';

// Bug #1 regression: the module graph must be loadable in plain Node (SSR) 
// no `HTMLElement` reference at module scope. Element classes are created
// lazily inside the registration functions.
describe('SSR / plain Node import', () => {
  it('imports the entry without a DOM', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.defineCalenderPicker).toBe('function');
    expect(typeof mod.defineCalenderInput).toBe('function');
    expect(typeof mod.createPickerElementClass).toBe('function');
    expect(typeof mod.createInputElementClass).toBe('function');
  });

  it('define* registration functions are safe no-ops without a window', async () => {
    const mod = await import('../src/index.js');
    expect(() => mod.defineCalenderPicker()).not.toThrow();
    expect(() => mod.defineCalenderInput()).not.toThrow();
  });

  it('imports the auto-register entry without a DOM', async () => {
    await expect(import('../src/auto-register.js')).resolves.toBeDefined();
  });
});
