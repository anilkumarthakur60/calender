import type { CalendarDate } from '../domain/calendar-date.js';
import { createCalendarDate, fromIso } from '../domain/calendar-date.js';

/**
 * Lenient string parser. Recognises ISO-8601 dates and falls back to
 * Intl-derived format tokens (yyyy/MM/dd, MM/dd/yyyy, dd/MM/yyyy) by inspecting
 * the locale's resolved format.
 */
export const parseDate = (input: string, locale: string = 'en-US'): CalendarDate | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    try {
      return fromIso(trimmed);
    } catch {
      return null;
    }
  }

  const order = detectDateOrder(locale);
  const parts = trimmed.split(/[\/.\-\s]/).filter(Boolean);
  if (parts.length !== 3) return null;

  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;
  for (let i = 0; i < 3; i += 1) {
    const role = order[i];
    const value = Number(parts[i]);
    if (!Number.isFinite(value)) return null;
    if (role === 'year') year = value < 100 ? 2000 + value : value;
    else if (role === 'month') month = value;
    else day = value;
  }

  if (year === undefined || month === undefined || day === undefined) return null;
  try {
    return createCalendarDate(year, month, day);
  } catch {
    return null;
  }
};

type Role = 'year' | 'month' | 'day';

const detectDateOrder = (locale: string): ReadonlyArray<Role> => {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2024, 0, 2));
    const roles: Role[] = [];
    for (const p of parts) {
      if (p.type === 'year') roles.push('year');
      else if (p.type === 'month') roles.push('month');
      else if (p.type === 'day') roles.push('day');
    }
    if (roles.length === 3) return roles;
  } catch {
    /* fall through */
  }
  return ['month', 'day', 'year'];
};
