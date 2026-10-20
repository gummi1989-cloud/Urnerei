import { DayOfWeek, HolidayWinterthur } from '../types';

/**
 * Calculates Easter Sunday for a given year using the Anonymous Gregorian algorithm.
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed (2 = March, 3 = April)
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}

/**
 * Calculates the ISO-8601 week number for a given Date.
 */
export function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfWeek(d: Date): DayOfWeek | null {
  const day = d.getUTCDay();
  switch (day) {
    case 1: return 'Mo';
    case 2: return 'Di';
    case 3: return 'Mi';
    case 4: return 'Do';
    case 5: return 'Fr';
    default: return null; // Saturday or Sunday
  }
}

/**
 * Returns all official public holidays for the City of Winterthur / Canton of Zurich for a given year.
 */
export function getWinterthurHolidays(year: number): HolidayWinterthur[] {
  const easter = getEasterSunday(year);

  const addDays = (base: Date, days: number): Date => {
    const res = new Date(base.getTime());
    res.setUTCDate(res.getUTCDate() + days);
    return res;
  };

  const carnivalMonday = addDays(easter, -48); // Fasnachtsmontag
  const goodFriday = addDays(easter, -2);
  const easterMonday = addDays(easter, 1);
  const ascensionDay = addDays(easter, 39); // Auffahrt
  const whitMonday = addDays(easter, 50);    // Pfingstmontag

  // Second Monday of September for Knabenschiessen (Zürich regional)
  const sepFirst = new Date(Date.UTC(year, 8, 1)); // Sept 1
  let sepFirstMonDay = 1 + ((8 - (sepFirst.getUTCDay() || 7)) % 7);
  if (sepFirst.getUTCDay() === 1) sepFirstMonDay = 1;
  const knabenschiessen = new Date(Date.UTC(year, 8, sepFirstMonDay + 7));

  const list: { name: string; date: Date; official: boolean }[] = [
    { name: 'Neujahr', date: new Date(Date.UTC(year, 0, 1)), official: true },
    { name: 'Berchtoldstag', date: new Date(Date.UTC(year, 0, 2)), official: true },
    { name: 'Fasnachtsmontag', date: carnivalMonday, official: true },
    { name: 'Karfreitag', date: goodFriday, official: true },
    { name: 'Ostermontag', date: easterMonday, official: true },
    { name: 'Tag der Arbeit (1. Mai)', date: new Date(Date.UTC(year, 4, 1)), official: true },
    { name: 'Auffahrt', date: ascensionDay, official: true },
    { name: 'Pfingstmontag', date: whitMonday, official: true },
    { name: 'Bundesfeiertag (1. August)', date: new Date(Date.UTC(year, 7, 1)), official: true },
    { name: 'Knabenschiessen (Brauchtum)', date: knabenschiessen, official: false },
    { name: 'Weihnachtstag', date: new Date(Date.UTC(year, 11, 25)), official: true },
    { name: 'Stephanstag', date: new Date(Date.UTC(year, 11, 26)), official: true },
  ];

  const holidays: HolidayWinterthur[] = [];

  for (const item of list) {
    const dayName = getDayOfWeek(item.date);
    if (dayName) {
      holidays.push({
        dateStr: item.date.toISOString().split('T')[0],
        name: item.name,
        dayOfWeek: dayName,
        weekNumber: getISOWeekNumber(item.date),
        isOfficialHoliday: item.official,
      });
    }
  }

  return holidays;
}

/**
 * Checks if a specific day in a week is a holiday in Winterthur.
 */
export function getHolidayForDay(year: number, weekNumber: number, day: DayOfWeek): HolidayWinterthur | undefined {
  const holidays = getWinterthurHolidays(year);
  return holidays.find(h => h.weekNumber === weekNumber && h.dayOfWeek === day);
}

/**
 * Returns the Monday (UTC Date) for a given ISO week number and year.
 */
export function getMondayOfISOWeek(year: number, weekNumber: number): Date {
  // Jan 4th is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // 1 = Monday, 7 = Sunday
  // Monday of ISO week 1:
  const monWeek1 = new Date(Date.UTC(year, 0, 4 - (dayOfWeek - 1)));
  // Monday of the requested weekNumber:
  return new Date(monWeek1.getTime() + (weekNumber - 1) * 7 * 86400000);
}

const DAY_OFFSET_MAP: Record<DayOfWeek, number> = {
  Mo: 0,
  Di: 1,
  Mi: 2,
  Do: 3,
  Fr: 4,
};

/**
 * Returns the Date for a given weekday in an ISO week of a year.
 */
export function getDateOfWeekday(year: number, weekNumber: number, day: DayOfWeek): Date {
  const mon = getMondayOfISOWeek(year, weekNumber);
  const offset = DAY_OFFSET_MAP[day] ?? 0;
  return new Date(mon.getTime() + offset * 86400000);
}

/**
 * Formats a Date as Swiss date: 'DD.MM.YYYY' (e.g. '19.10.2026')
 */
export function formatSwissDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Formats a day with Swiss date: e.g. 'Mo. 19.10.2026'
 */
export function formatDayWithDate(day: DayOfWeek, d: Date): string {
  return `${day}. ${formatSwissDate(d)}`;
}

/**
 * Formats the full week range, e.g. '19.10. – 25.10.2026'
 */
export function formatWeekDateRange(year: number, weekNumber: number): string {
  const mon = getMondayOfISOWeek(year, weekNumber);
  const sun = new Date(mon.getTime() + 6 * 86400000);
  const dd1 = String(mon.getUTCDate()).padStart(2, '0');
  const mm1 = String(mon.getUTCMonth() + 1).padStart(2, '0');
  const dd2 = String(sun.getUTCDate()).padStart(2, '0');
  const mm2 = String(sun.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = sun.getUTCFullYear();
  return `${dd1}.${mm1}. – ${dd2}.${mm2}.${yyyy}`;
}

/**
 * Formats a compact week date range for column headers: '19.10.–25.10.'
 */
export function formatShortWeekDateRange(year: number, weekNumber: number): string {
  const mon = getMondayOfISOWeek(year, weekNumber);
  const sun = new Date(mon.getTime() + 6 * 86400000);
  const dd1 = String(mon.getUTCDate()).padStart(2, '0');
  const mm1 = String(mon.getUTCMonth() + 1).padStart(2, '0');
  const dd2 = String(sun.getUTCDate()).padStart(2, '0');
  const mm2 = String(sun.getUTCMonth() + 1).padStart(2, '0');
  return `${dd1}.${mm1}.–${dd2}.${mm2}.`;
}
