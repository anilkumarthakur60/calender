export type ViewMode = 'day' | 'month' | 'year' | 'decade';

export const VIEW_HIERARCHY: ReadonlyArray<ViewMode> = ['day', 'month', 'year', 'decade'];

export const drillDown = (mode: ViewMode): ViewMode => {
  const i = VIEW_HIERARCHY.indexOf(mode);
  return i <= 0 ? 'day' : (VIEW_HIERARCHY[i - 1] as ViewMode);
};

export const drillUp = (mode: ViewMode): ViewMode => {
  const i = VIEW_HIERARCHY.indexOf(mode);
  return i < 0 || i >= VIEW_HIERARCHY.length - 1 ? 'decade' : (VIEW_HIERARCHY[i + 1] as ViewMode);
};
