import { Customer, DayOfWeek, HolidayWinterthur, ProductType, TurningSession, VacationPeriod, YearPlanEntry } from '../types';
import { getWinterthurHolidays } from './holidays';

export interface CustomerStats {
  customer: Customer;
  planA: number;
  planB: number;
  planPlates: number;
  totalPlanUrns: number;
  targetTotalUrns: number;
  urnsDiff: number; // totalPlanUrns - targetTotalUrns
  urnsReached: boolean;
  urnsPercentage: number;
  platesReached: boolean;
  platesPercentage: number;
  overallReached: boolean;
}

export function calculateCustomerStats(customer: Customer, entries: YearPlanEntry[]): CustomerStats {
  const custEntries = entries.filter(e => e.customerId === customer.id);
  const planA = custEntries.reduce((sum, e) => sum + (e.typeA || 0), 0);
  const planB = custEntries.reduce((sum, e) => sum + (e.typeB || 0), 0);
  const planPlates = custEntries.reduce((sum, e) => sum + (e.plates || 0), 0);

  const totalPlanUrns = planA + planB;
  const targetTotalUrns = customer.targetA + customer.targetB;
  const urnsDiff = totalPlanUrns - targetTotalUrns;
  const urnsReached = totalPlanUrns >= targetTotalUrns;
  const urnsPercentage = targetTotalUrns > 0 ? Math.round((totalPlanUrns / targetTotalUrns) * 100) : 100;

  const platesReached = planPlates >= customer.targetPlates;
  const platesPercentage = customer.targetPlates > 0 ? Math.round((planPlates / customer.targetPlates) * 100) : 100;

  const overallReached = urnsReached && platesReached;

  return {
    customer,
    planA,
    planB,
    planPlates,
    totalPlanUrns,
    targetTotalUrns,
    urnsDiff,
    urnsReached,
    urnsPercentage,
    platesReached,
    platesPercentage,
    overallReached,
  };
}

export interface WeekOverview {
  weekNumber: number;
  isVacation: boolean;
  vacationInfo?: VacationPeriod;
  holidays: HolidayWinterthur[];
  hasHolidayOnTurningDay: boolean; // Mo, Di, or Mi
  totalPlanA: number;
  totalPlanB: number;
  totalPlanPlates: number;
  totalPlanUrns: number;
  nominalCapacity: number; // standard capacity in urns for the week
  effectiveCapacity: number; // capacity after deducting holiday lost days + adding buffer sessions
  utilizationRate: number; // totalPlanUrns / effectiveCapacity
}

export function calculateWeekOverview(
  weekNumber: number,
  year: number,
  entries: YearPlanEntry[],
  vacations: VacationPeriod[]
): WeekOverview {
  const weekEntries = entries.filter(e => e.weekNumber === weekNumber);
  const totalPlanA = weekEntries.reduce((sum, e) => sum + (e.typeA || 0), 0);
  const totalPlanB = weekEntries.reduce((sum, e) => sum + (e.typeB || 0), 0);
  const totalPlanPlates = weekEntries.reduce((sum, e) => sum + (e.plates || 0), 0);
  const totalPlanUrns = totalPlanA + totalPlanB;

  const vacationInfo = vacations.find(v => weekNumber >= v.startWeek && weekNumber <= v.endWeek);
  const isVacation = !!vacationInfo;

  const yearHolidays = getWinterthurHolidays(year);
  const holidays = yearHolidays.filter(h => h.weekNumber === weekNumber);
  const turningDayHolidays = holidays.filter(h => h.dayOfWeek === 'Mo' || h.dayOfWeek === 'Di' || h.dayOfWeek === 'Mi');
  const hasHolidayOnTurningDay = turningDayHolidays.length > 0;

  // Standard Week Capacity:
  // Mo: 3 sessions * 24 = 72
  // Di: 3 sessions * 24 = 72
  // Mi: 2 sessions * 24 = 48
  // Total nominal = 192 urns
  let nominalCapacity = 192;
  let lostCapacity = 0;
  let bufferCapacity = 0;

  for (const h of turningDayHolidays) {
    if (h.dayOfWeek === 'Mo') lostCapacity += 72;
    if (h.dayOfWeek === 'Di') lostCapacity += 72;
    if (h.dayOfWeek === 'Mi') lostCapacity += 48;
  }

  // Pufferlogik Winterthur:
  // If Mo or Di is holiday and Mi is NOT a holiday, Mi gets an extra buffer session (+24 Urnen)
  const miIsHoliday = turningDayHolidays.some(h => h.dayOfWeek === 'Mi');
  const moOrDiIsHoliday = turningDayHolidays.some(h => h.dayOfWeek === 'Mo' || h.dayOfWeek === 'Di');

  if (moOrDiIsHoliday && !miIsHoliday) {
    bufferCapacity = 24; // Puffer session on Wednesday (increases from 2 to 3 sessions)
  }

  const effectiveCapacity = Math.max(0, nominalCapacity - lostCapacity + bufferCapacity);
  const utilizationRate = effectiveCapacity > 0 ? Math.round((totalPlanUrns / effectiveCapacity) * 100) : 0;

  return {
    weekNumber,
    isVacation,
    vacationInfo,
    holidays,
    hasHolidayOnTurningDay,
    totalPlanA,
    totalPlanB,
    totalPlanPlates,
    totalPlanUrns,
    nominalCapacity,
    effectiveCapacity,
    utilizationRate,
  };
}

export interface DaySessionSlot {
  slotKey: string;
  day: DayOfWeek;
  sessionNumber: number;
  isHoliday: boolean;
  holidayName?: string;
  isBuffer: boolean;
  isTurnOffDay: boolean; // Do & Fr default free for drying/kiln
  session?: TurningSession;
}

/**
 * Builds the structure of turning sessions for a specific calendar week,
 * integrating holiday compensations and disruptions.
 */
export function buildWeekSessions(
  weekNumber: number,
  year: number,
  sessionOverrides: Record<string, TurningSession>,
  weekUrnsTarget: number
): DaySessionSlot[] {
  const holidays = getWinterthurHolidays(year).filter(h => h.weekNumber === weekNumber);
  const moHoliday = holidays.find(h => h.dayOfWeek === 'Mo');
  const diHoliday = holidays.find(h => h.dayOfWeek === 'Di');
  const miHoliday = holidays.find(h => h.dayOfWeek === 'Mi');
  const doHoliday = holidays.find(h => h.dayOfWeek === 'Do');
  const frHoliday = holidays.find(h => h.dayOfWeek === 'Fr');

  const slots: DaySessionSlot[] = [];

  // Monday: 3 Sessions (72 urns)
  for (let s = 1; s <= 3; s++) {
    const key = `${weekNumber}_Mo_${s}`;
    slots.push({
      slotKey: key,
      day: 'Mo',
      sessionNumber: s,
      isHoliday: !!moHoliday,
      holidayName: moHoliday?.name,
      isBuffer: false,
      isTurnOffDay: false,
      session: sessionOverrides[key],
    });
  }

  // Tuesday: 3 Sessions (72 urns)
  for (let s = 1; s <= 3; s++) {
    const key = `${weekNumber}_Di_${s}`;
    slots.push({
      slotKey: key,
      day: 'Di',
      sessionNumber: s,
      isHoliday: !!diHoliday,
      holidayName: diHoliday?.name,
      isBuffer: false,
      isTurnOffDay: false,
      session: sessionOverrides[key],
    });
  }

  // Wednesday: 2 regular sessions + 1 buffer session if Monday or Tuesday is a holiday
  const hasMoOrDiHoliday = !!moHoliday || !!diHoliday;
  const wednesdayTotalSessions = (hasMoOrDiHoliday && !miHoliday) ? 3 : 2;

  for (let s = 1; s <= wednesdayTotalSessions; s++) {
    const key = `${weekNumber}_Mi_${s}`;
    const isBuffer = s === 3;
    slots.push({
      slotKey: key,
      day: 'Mi',
      sessionNumber: s,
      isHoliday: !!miHoliday,
      holidayName: miHoliday?.name,
      isBuffer,
      isTurnOffDay: false,
      session: sessionOverrides[key],
    });
  }

  // Thursday: Standardmässig frei (Trocknung & Schrühbrand)
  slots.push({
    slotKey: `${weekNumber}_Do_1`,
    day: 'Do',
    sessionNumber: 1,
    isHoliday: !!doHoliday,
    holidayName: doHoliday?.name,
    isBuffer: false,
    isTurnOffDay: true,
    session: sessionOverrides[`${weekNumber}_Do_1`],
  });

  // Friday: Standardmässig frei (Glasur & Glattbrand / Qualitätsprüfung)
  slots.push({
    slotKey: `${weekNumber}_Fr_1`,
    day: 'Fr',
    sessionNumber: 1,
    isHoliday: !!frHoliday,
    holidayName: frHoliday?.name,
    isBuffer: false,
    isTurnOffDay: true,
    session: sessionOverrides[`${weekNumber}_Fr_1`],
  });

  return slots;
}
