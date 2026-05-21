import { BikramSambatCalendar } from './bikram-sambat-calendar.js';
import type { CalendarId, CalendarSystem } from './calendar-system.js';
import { GregorianCalendar } from './gregorian-calendar.js';

export const createCalendarSystem = (
  id: CalendarId | CalendarSystem = 'gregorian',
): CalendarSystem => {
  if (typeof id !== 'string') return id;
  switch (id) {
    case 'gregorian':
      return new GregorianCalendar();
    case 'bikram-sambat':
      return new BikramSambatCalendar();
  }
};
