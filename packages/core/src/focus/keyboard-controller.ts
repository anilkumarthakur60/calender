import type { KeyboardAction } from './keyboard-action.js';

export interface KeyboardEventLike {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

/**
 * Pure key→action mapper. No DOM, no preventDefault  that's the renderer's
 * responsibility. Direction is the physical arrow key pressed; the ENGINE
 * (`DatePickerEngine.handleKey`) swaps left/right for RTL locales itself, so
 * renderers must NOT swap  doing so would double-swap.
 */
export const interpretKey = (event: KeyboardEventLike): KeyboardAction | null => {
  switch (event.key) {
    case 'ArrowLeft':
      return { type: 'move', direction: 'left', amount: 1 };
    case 'ArrowRight':
      return { type: 'move', direction: 'right', amount: 1 };
    case 'ArrowUp':
      return { type: 'move', direction: 'up', amount: 1 };
    case 'ArrowDown':
      return { type: 'move', direction: 'down', amount: 1 };
    case 'Home':
      return event.ctrlKey
        ? { type: 'jump', target: 'monthStart' }
        : { type: 'jump', target: 'rowStart' };
    case 'End':
      return event.ctrlKey
        ? { type: 'jump', target: 'monthEnd' }
        : { type: 'jump', target: 'rowEnd' };
    case 'PageUp':
      return { type: 'page', direction: 'prev', large: event.shiftKey };
    case 'PageDown':
      return { type: 'page', direction: 'next', large: event.shiftKey };
    case 'Enter':
    case ' ':
      return { type: 'select' };
    case 'Escape':
      return { type: 'cancel' };
    case '+':
      return { type: 'drillUp' };
    case '-':
      return { type: 'drillDown' };
    default:
      return null;
  }
};
