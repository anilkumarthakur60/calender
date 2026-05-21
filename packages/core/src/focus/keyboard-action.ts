/**
 * Logical action emitted by the keyboard controller. Renderers map these to
 * imperative engine calls; consumers can intercept them for analytics or
 * preventDefault on certain combos.
 */
export type KeyboardAction =
  | {
      readonly type: 'move';
      readonly direction: 'left' | 'right' | 'up' | 'down';
      readonly amount: number;
    }
  | { readonly type: 'jump'; readonly target: 'rowStart' | 'rowEnd' | 'monthStart' | 'monthEnd' }
  | { readonly type: 'page'; readonly direction: 'prev' | 'next'; readonly large: boolean }
  | { readonly type: 'select' }
  | { readonly type: 'cancel' }
  | { readonly type: 'drillDown' }
  | { readonly type: 'drillUp' };
