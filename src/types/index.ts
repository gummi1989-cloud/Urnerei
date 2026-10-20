export interface CustomerYearHistory {
  typeA: number;
  typeB: number;
  plates: number;
  targetUrns?: number;
  targetPlates?: number;
}

export type ProductType = 'hart' | 'loeslich' | 'plaettli';

export interface Customer {
  productType?: ProductType;
  targetQuantity?: number;
  id: string;
  name: string;
  shortName: string;
  category?: string; // Optional (not needed per user request)
  location?: string; // Optional (not needed per user request)
  contactPerson: string;
  email: string;
  phone: string;
  targetA: number;       // Jahressoll Urnentyp A (hart)
  targetB: number;       // Jahressoll Urnentyp B (löslich)
  targetPlates: number;  // Jahressoll Tonplättli
  accentColor: string;   // Unique vibrant color per customer
  history?: Record<number, CustomerYearHistory>; // Echte historische Werte vergangener Jahre
}

export interface YearPlanEntry {
  amount?: number;
  year?: number;
  id: string;
  customerId: string;
  weekNumber: number; // 1 to 52
  typeA: number;      // Geplante Urnen hart (Typ A)
  typeB: number;      // Geplante Urnen löslich (Typ B)
  plates: number;     // Geplante Tonplättli
  notes?: string;
}

export interface VacationPeriod {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  type: 'summer' | 'winter' | 'custom';
  description: string;
  isSingleDay?: boolean;
  dateStr?: string; // YYYY-MM-DD
  dayOfWeek?: DayOfWeek;
}

export type DayOfWeek = 'Mo' | 'Di' | 'Mi' | 'Do' | 'Fr';

export interface HolidayWinterthur {
  dateStr: string;
  name: string;
  dayOfWeek: DayOfWeek;
  weekNumber: number;
  isOfficialHoliday: boolean; // Gesetzlicher Ruhetag in Winterthur / ZH
}

export interface SessionDisruption {
  reason: string;
  targetCount: number;
  effectiveCount: number;
  shortfall: number; // targetCount - effectiveCount
  reportedAt: string;
  notes?: string;
}

export interface TurningSession {
  id: string;
  weekNumber: number;
  day: DayOfWeek;
  sessionNumber: number; // 1, 2, or 3
  isBufferSession?: boolean; // Puffer-Session am Mittwoch
  isHolidayCompensated?: boolean;
  holidayReason?: string;
  isTurnOffDay?: boolean; // Thursday or Friday default free
  targetCount: number; // Standard 24 Urnen
  effectiveCount: number; // Ist-Produktion (default 24 or lower if disruption)
  customerId?: string;
  productType: 'Urne hart' | 'Urne löslich' | 'Gemischt';
  disruption?: SessionDisruption;
  carriedOverShortfall?: {
    sourceSessionId: string;
    sourceDay: DayOfWeek;
    sourceWeek: number;
    amount: number;
  };
  notes?: string;
}

export interface RevisionEntry {
  id: string;
  weekNumber: number; // 1 to 52
  title: string;
  notes?: string;
  type?: 'oven' | 'machinery' | 'general';
}

export interface AppState {
  year: number;
  activeSheet: 'yearPlan' | 'weekPlan' | 'customers';
  selectedWeek: number;
  customers: Customer[];
  yearPlanEntries: YearPlanEntry[];
  vacations: VacationPeriod[];
  revisions: RevisionEntry[];
  sessionOverrides: Record<string, TurningSession>; // keyed by `${weekNumber}_${day}_${sessionNumber}`
}
