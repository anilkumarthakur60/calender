/**
 * Polite ARIA live region for screen-reader announcements. Lazily creates a
 * singleton off-screen region on first use. Messages are debounced  a rapid
 * burst (e.g. arrow-key spam) collapses to the latest one.
 */

let region: HTMLElement | null = null;
let pendingTimer: number | null = null;

const ensureRegion = (): HTMLElement => {
  if (region && document.body.contains(region)) return region;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.style.position = 'absolute';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.padding = '0';
  el.style.margin = '-1px';
  el.style.overflow = 'hidden';
  el.style.clip = 'rect(0,0,0,0)';
  el.style.whiteSpace = 'nowrap';
  el.style.border = '0';
  document.body.appendChild(el);
  region = el;
  return el;
};

export const announce = (message: string, debounceMs = 60): void => {
  if (typeof document === 'undefined') return;
  const el = ensureRegion();
  if (pendingTimer !== null) {
    window.clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  pendingTimer = window.setTimeout(() => {
    // Force a content change so screen readers re-announce even identical text.
    el.textContent = '';
    el.textContent = message;
    pendingTimer = null;
  }, debounceMs);
};
