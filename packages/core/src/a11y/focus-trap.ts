/**
 * Pure focus-trap helper. Renderers wire it up: call `activate(container)`
 * when a popover opens, get back a function to call on close.
 *
 * Doesn't compete with browser focus or do anything other than enforce the
 * "Tab/Shift+Tab cycle inside this element" invariant. No DOM mutations.
 */

const FOCUSABLE = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
].join(',');

const focusableWithin = (container: HTMLElement): HTMLElement[] => {
  const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE);
  return Array.from(nodes).filter(el => el.offsetParent !== null || el === document.activeElement);
};

export interface FocusTrap {
  /** Remove all listeners and restore document focus to the previously-active element. */
  deactivate(): void;
}

export const activateFocusTrap = (container: HTMLElement): FocusTrap => {
  const previousActive = document.activeElement as HTMLElement | null;

  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const nodes = focusableWithin(container);
    if (nodes.length === 0) {
      event.preventDefault();
      return;
    }
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKey);

  return {
    deactivate(): void {
      container.removeEventListener('keydown', onKey);
      // Restore focus to the previously-active element if it still exists.
      if (previousActive && document.body.contains(previousActive)) {
        previousActive.focus({ preventScroll: true });
      }
    },
  };
};
