import type { SelectionMode, SelectionStrategy } from './selection-strategy.js';
import { SingleSelectionStrategy } from './single-selection.js';
import { RangeSelectionStrategy, type RangeSelectionOptions } from './range-selection.js';
import { MultiSelectionStrategy, type MultiSelectionOptions } from './multi-selection.js';

export interface SelectionFactoryOptions {
  readonly range?: RangeSelectionOptions;
  readonly multi?: MultiSelectionOptions;
}

export const createSelectionStrategy = (
  mode: SelectionMode,
  options: SelectionFactoryOptions = {},
): SelectionStrategy => {
  switch (mode) {
    case 'single':
      return new SingleSelectionStrategy();
    case 'range':
      return new RangeSelectionStrategy(options.range);
    case 'multi':
      return new MultiSelectionStrategy(options.multi);
  }
};
