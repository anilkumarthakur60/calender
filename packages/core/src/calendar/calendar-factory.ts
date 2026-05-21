import { BikramSambatCalendar } from './bikram-sambat-calendar.js';
import { BuddhistCalendar } from './buddhist-calendar.js';
import type { CalendarId, CalendarSystem } from './calendar-system.js';
import { GregorianCalendar } from './gregorian-calendar.js';
import { PersianCalendar } from './persian-calendar.js';

export const createCalendarSystem = (
  id: CalendarId | CalendarSystem = 'gregorian',
): CalendarSystem => {
  if (typeof id !== 'string') return id;
  switch (id) {
    case 'gregorian':
      return new GregorianCalendar();
    case 'bikram-sambat':
      return new BikramSambatCalendar();
    case 'buddhist':
      return new BuddhistCalendar();
    case 'persian':
      return new PersianCalendar();
  }
};
