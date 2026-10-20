import { Customer, VacationPeriod, YearPlanEntry, TurningSession } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [];

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Krematorium & Friedhof Rosenberg',
    shortName: 'Krematorium Rosenberg',
    category: 'Krematorium',
    location: 'Winterthur (ZH)',
    contactPerson: 'Marc Baumgartner',
    email: 'rosenberg@stadt.winterthur.ch',
    phone: '+41 52 267 55 10',
    targetA: 180,
    targetB: 120,
    targetPlates: 400,
    accentColor: '#B45309', // Warm amber terracotta
  },
  {
    id: 'cust-2',
    name: 'Bestattungs- & Friedhofsamt Stadt Zürich',
    shortName: 'Stadt Zürich Bestattungen',
    category: 'Friedhofsamt',
    location: 'Zürich (ZH)',
    contactPerson: 'Beatrix Vontobel',
    email: 'bestattungen@zuerich.ch',
    phone: '+41 44 412 11 11',
    targetA: 260,
    targetB: 190,
    targetPlates: 650,
    accentColor: '#1E3A8A', // Deep slate blue
  },
  {
    id: 'cust-3',
    name: 'Bestattungsinstitut Gerber & Co.',
    shortName: 'Gerber Bestattungen',
    category: 'Bestattungsinstitut',
    location: 'Winterthur & Lindberg',
    contactPerson: 'Ursula Gerber',
    email: 'kontakt@gerber-bestattungen.ch',
    phone: '+41 52 212 88 40',
    targetA: 95,
    targetB: 80,
    targetPlates: 180,
    accentColor: '#047857', // Sage / forest
  },
  {
    id: 'cust-4',
    name: 'Krematorium Nordheim',
    shortName: 'Nordheim Zürich',
    category: 'Krematorium',
    location: 'Zürich-Nord (ZH)',
    contactPerson: 'Daniel Meier',
    email: 'nordheim@zuerich.ch',
    phone: '+41 44 412 80 00',
    targetA: 140,
    targetB: 110,
    targetPlates: 320,
    accentColor: '#7C3AED', // Muted violet
  },
  {
    id: 'cust-5',
    name: 'Friedhofsverwaltung Stadt St. Gallen',
    shortName: 'Friedhöfe St. Gallen',
    category: 'Friedhofsamt',
    location: 'St. Gallen (SG)',
    contactPerson: 'Corinne Zuber',
    email: 'friedhoefe@stadt.sg.ch',
    phone: '+41 71 224 51 51',
    targetA: 110,
    targetB: 70,
    targetPlates: 220,
    accentColor: '#0E7490', // Deep teal
  },
  {
    id: 'cust-6',
    name: 'Bestattungen Schaffhausen & Klettgau',
    shortName: 'Schaffhausen & Klettgau',
    category: 'Bestattungsinstitut',
    location: 'Schaffhausen (SH)',
    contactPerson: 'Stefan Hallauer',
    email: 'info@bestattungen-sh.ch',
    phone: '+41 52 625 30 30',
    targetA: 75,
    targetB: 50,
    targetPlates: 150,
    accentColor: '#C2410C', // Rust terracotta
  },
  {
    id: 'cust-7',
    name: 'Krematorium & Friedhof Aarau',
    shortName: 'Krematorium Aarau',
    category: 'Krematorium',
    location: 'Aarau (AG)',
    contactPerson: 'Matthias Frey',
    email: 'krematorium@aarau.ch',
    phone: '+41 62 836 05 55',
    targetA: 90,
    targetB: 65,
    targetPlates: 200,
    accentColor: '#475569', // Slate
  },
  {
    id: 'cust-8',
    name: 'Bestattungsdienst Basel-Stadt',
    shortName: 'Basel-Stadt Bestattungen',
    category: 'Friedhofsamt',
    location: 'Basel (BS)',
    contactPerson: 'Lukas Herzog',
    email: 'bestattungsdienst@bs.ch',
    phone: '+41 61 267 81 81',
    targetA: 130,
    targetB: 95,
    targetPlates: 280,
    accentColor: '#9D174D', // Deep berry
  },
  {
    id: 'cust-9',
    name: 'Atelier Urne & Abschied',
    shortName: 'Atelier Urne & Abschied',
    category: 'Partneratelier',
    location: 'Luzern (LU)',
    contactPerson: 'Elena Bucher',
    email: 'elena@urne-abschied.ch',
    phone: '+41 41 310 90 20',
    targetA: 50,
    targetB: 90,
    targetPlates: 120,
    accentColor: '#059669', // Emerald
  },
  {
    id: 'cust-10',
    name: 'Bestattungsdienst Thurgau Frauenfeld',
    shortName: 'Frauenfeld & Thurgau',
    category: 'Bestattungsinstitut',
    location: 'Frauenfeld (TG)',
    contactPerson: 'Jörg Schuler',
    email: 'service@bestattungen-thurgau.ch',
    phone: '+41 52 721 44 22',
    targetA: 60,
    targetB: 45,
    targetPlates: 110,
    accentColor: '#D97706', // Ochre
  },
  {
    id: 'cust-11',
    name: 'Bestattungsinstitut Uster & Oberland',
    shortName: 'Uster & Oberland',
    category: 'Bestattungsinstitut',
    location: 'Uster (ZH)',
    contactPerson: 'Monika Egli',
    email: 'egli@uster-bestattungen.ch',
    phone: '+41 44 940 18 18',
    targetA: 70,
    targetB: 55,
    targetPlates: 140,
    accentColor: '#2563EB', // Cobalt blue
  },
  {
    id: 'cust-12',
    name: 'Bestattungsdienst Zürcher Unterland',
    shortName: 'Zürcher Unterland Bülach',
    category: 'Bestattungsinstitut',
    location: 'Bülach (ZH)',
    contactPerson: 'Reto Siegenthaler',
    email: 'info@unterland-abschied.ch',
    phone: '+41 44 860 33 00',
    targetA: 85,
    targetB: 60,
    targetPlates: 170,
    accentColor: '#0891B2', // Cyan
  },
  {
    id: 'cust-13',
    name: 'Bestattungen Seen & Wülflingen',
    shortName: 'Seen & Wülflingen',
    category: 'Bestattungsinstitut',
    location: 'Winterthur-Seen (ZH)',
    contactPerson: 'Barbara Keller',
    email: 'keller@seen-bestattung.ch',
    phone: '+41 52 233 45 67',
    targetA: 55,
    targetB: 40,
    targetPlates: 90,
    accentColor: '#9333EA', // Purple
  },
  {
    id: 'cust-14',
    name: 'Krematorium Baden-Liebegg',
    shortName: 'Krematorium Baden',
    category: 'Krematorium',
    location: 'Baden (AG)',
    contactPerson: 'Patrick Weiss',
    email: 'liebegg@baden.ch',
    phone: '+41 56 200 85 00',
    targetA: 100,
    targetB: 70,
    targetPlates: 210,
    accentColor: '#4338CA', // Indigo
  }
];

export const INITIAL_VACATIONS: VacationPeriod[] = [
  {
    id: 'vac-summer',
    name: 'Sommer-Betriebsferien',
    startWeek: 29,
    endWeek: 31,
    type: 'summer',
    description: 'Sommer-Revisionspause Brennöfen & Betriebsferien Werkstatt Winterthur',
  },
  {
    id: 'vac-winter',
    name: 'Weihnachts-Betriebsferien',
    startWeek: 51,
    endWeek: 52,
    type: 'winter',
    description: 'Weihnachts- und Neujahrsruhe Manufaktur',
  },
];

/**
 * Generates initial year plan entries (empty by default as requested).
 */
export function generateInitialYearPlan(): YearPlanEntry[] {
  return [];
}

/**
 * Initial session overrides (empty by default as requested).
 */
export function generateInitialSessionOverrides(): Record<string, TurningSession> {
  return {};
}

/**
 * Optional sample data for testing or demo restoration.
 */
export function generateSampleYearPlan(): YearPlanEntry[] {
  const entries: YearPlanEntry[] = [];
  let entryId = 1;

  const clientBatches: { [custId: string]: { weeks: number[]; batchSizeA: number; batchSizeB: number; plates: number } } = {
    'cust-1': { weeks: [2, 6, 11, 16, 22, 27, 34, 38, 43, 47], batchSizeA: 18, batchSizeB: 12, plates: 40 },
    'cust-2': { weeks: [3, 7, 12, 17, 23, 28, 35, 40, 44, 48], batchSizeA: 26, batchSizeB: 19, plates: 65 },
    'cust-3': { weeks: [4, 10, 18, 25, 36, 42, 49], batchSizeA: 14, batchSizeB: 12, plates: 26 },
    'cust-4': { weeks: [5, 13, 20, 26, 37, 45], batchSizeA: 24, batchSizeB: 19, plates: 54 },
  };

  for (const [custId, config] of Object.entries(clientBatches)) {
    for (const kw of config.weeks) {
      entries.push({
        id: `ype-${entryId++}`,
        customerId: custId,
        weekNumber: kw,
        typeA: config.batchSizeA,
        typeB: config.batchSizeB,
        plates: config.plates,
      });
    }
  }

  return entries;
}

export function generateSampleSessionOverrides(): Record<string, TurningSession> {
  return {};
}

export const INITIAL_REVISIONS = [
  {
    id: 'rev-1',
    weekNumber: 10,
    title: 'Scheiben- & Werkzeugwartung',
    notes: 'Drehscheiben-Lager schmieren und Riemen nachspannen',
    type: 'machinery' as const,
  },
  {
    id: 'rev-2',
    weekNumber: 29,
    title: 'Ofen- & Brennkammer-Revision',
    notes: 'Heizspiralen prüfen, Thermoelemente kalibrieren',
    type: 'oven' as const,
  },
];
