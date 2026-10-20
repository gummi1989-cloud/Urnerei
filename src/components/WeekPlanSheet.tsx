import React from 'react';
import { usePlan } from '../context/PlanContext';
import { getWinterthurHolidays, getDateOfWeekday, formatDayWithDate, formatWeekDateRange } from '../utils/holidays';
import { DayOfWeek, TurningSession } from '../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Palmtree,
  Wrench,
  CalendarCheck
} from 'lucide-react';

interface WeekPlanSheetProps {
  onOpenDisruptionModal: (weekNumber: number, day: DayOfWeek, sessionNumber: number, session?: TurningSession) => void;
  onJumpToYearPlan: () => void;
}

export const WeekPlanSheet: React.FC<WeekPlanSheetProps> = ({
  onOpenDisruptionModal,
  onJumpToYearPlan,
}) => {
  const {
    state,
    setSelectedWeek,
    setYear,
    goToToday,
    recordSessionDisruption,
    updateSessionDetails,
    resetSessionOverride,
  } = usePlan();
  const currentWeek = state.selectedWeek;
  const currentYear = state.year;

  // Check if this week has a planned revision
  const currentWeekRevision = state.revisions?.find(r => r.weekNumber === currentWeek);

  // Find holidays for current week in Winterthur / ZH
  const allHolidays = getWinterthurHolidays(currentYear);
    const singleDaysThisWeek = (state.vacations || [])
      .filter(v => v.isSingleDay && v.startWeek === currentWeek && v.dayOfWeek)
      .map(v => ({
        name: v.name,
        date: v.dateStr ? new Date(v.dateStr + "T12:00:00") : new Date(),
        weekNumber: currentWeek,
        dayOfWeek: v.dayOfWeek as any
      }));
    const weekHolidays = [...allHolidays.filter(h => h.weekNumber === currentWeek), ...singleDaysThisWeek];
    const moHoliday = weekHolidays.find(h => h.dayOfWeek === 'Mo');
    const diHoliday = weekHolidays.find(h => h.dayOfWeek === 'Di');
    const miHoliday = weekHolidays.find(h => h.dayOfWeek === 'Mi');
    const doHoliday = weekHolidays.find(h => h.dayOfWeek === 'Do');
    const frHoliday = weekHolidays.find(h => h.dayOfWeek === 'Fr');

    // Vacation check
    const vacationInfo = state.vacations.find(
      v => !v.isSingleDay && currentWeek >= v.startWeek && currentWeek <= v.endWeek
    );

  // Planned totals for this week from Sheet 1 Grobplanung
  const weekEntries = state.yearPlanEntries.filter(e => e.weekNumber === currentWeek && (e.year ?? 2026) === currentYear);
  const plannedHardGrob = weekEntries.reduce((s, e) => s + e.typeA, 0);
  const plannedSolubleGrob = weekEntries.reduce((s, e) => s + e.typeB, 0);
  const plannedUrnsGrob = plannedHardGrob + plannedSolubleGrob;
  const plannedPlatesGrob = weekEntries.reduce((s, e) => s + e.plates, 0);

  // Winterthur Holiday Compensation Logic
  const isBufferSessionTriggered = (!!moHoliday || !!diHoliday) && !miHoliday;
  const doubleHolidayOverflow = (!!moHoliday && !!diHoliday) || (!!moHoliday && !!miHoliday);

  // Session definition per day
  interface AutoSlot {
    customerId?: string;
    productType: 'Urne hart' | 'Urne loeslich';
    effectiveCount: number;
    targetCount: number;
  }
  const autoSlots: Record<string, AutoSlot> = {};
  const hardBatches: { customerId: string; amount: number }[] = [];
  const solubleBatches: { customerId: string; amount: number }[] = [];
  let remainingPlates = 0;

  weekEntries.forEach(entry => {
    const cust = state.customers.find(cu => cu.id === entry.customerId);
    const pType = cust?.productType || (cust?.targetPlates ? 'plaettli' : (cust?.targetB ? 'loeslich' : 'hart'));
    const totalAmount = entry.amount ?? ((entry.typeA || 0) + (entry.typeB || 0) + (entry.plates || 0));
    if (pType === 'hart' || (!cust && entry.typeA > 0)) {
      const qty = entry.typeA || totalAmount;
      if (qty > 0) hardBatches.push({ customerId: entry.customerId, amount: qty });
    } else if (pType === 'loeslich' || (!cust && entry.typeB > 0)) {
      const qty = entry.typeB || totalAmount;
      if (qty > 0) solubleBatches.push({ customerId: entry.customerId, amount: qty });
    } else if (pType === 'plaettli' || (!cust && entry.plates > 0)) {
      remainingPlates += entry.plates || totalAmount;
    }
  });

  const autoPlatesPerDay: Record<string, number> = {};
  const daysOrder: DayOfWeek[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
  daysOrder.forEach(d => {
    if (remainingPlates > 0) {
      const dayQty = Math.min(100, remainingPlates);
      autoPlatesPerDay[d] = dayQty;
      remainingPlates -= dayQty;
    } else {
      autoPlatesPerDay[d] = 0;
    }
  });

  const orderedSlots: { slotKey: string; day: DayOfWeek; sessionNumber: number }[] = [];
  ['Mo', 'Di', 'Mi'].forEach((dStr) => {
    const d = dStr as DayOfWeek;
    const count = d === 'Mo' ? (moHoliday ? 0 : 3) : d === 'Di' ? (diHoliday ? 0 : 3) : (miHoliday ? 0 : (isBufferSessionTriggered ? 3 : 2));
    for (let s = 1; s <= count; s++) {
      orderedSlots.push({ slotKey: `${currentWeek}_${d}_${s}`, day: d, sessionNumber: s });
    }
  });

  let slotIndex = 0;
  hardBatches.forEach(batch => {
    let toAssign = batch.amount;
    while (toAssign > 0 && slotIndex < orderedSlots.length) {
      const curSlot = orderedSlots[slotIndex];
      const count = Math.min(24, toAssign);
      autoSlots[curSlot.slotKey] = { customerId: batch.customerId, productType: 'Urne hart', effectiveCount: count, targetCount: 24 };
      toAssign -= count;
      slotIndex++;
    }
  });

  solubleBatches.forEach(batch => {
    let toAssign = batch.amount;
    while (toAssign > 0 && slotIndex < orderedSlots.length) {
      const curSlot = orderedSlots[slotIndex];
      const count = Math.min(24, toAssign);
      autoSlots[curSlot.slotKey] = { customerId: batch.customerId, productType: 'Urne loeslich', effectiveCount: count, targetCount: 24 };
      toAssign -= count;
      slotIndex++;
    }
  });

  while (slotIndex < orderedSlots.length) {
    const curSlot = orderedSlots[slotIndex];
    autoSlots[curSlot.slotKey] = { productType: 'Urne hart', effectiveCount: 0, targetCount: 0 };
    slotIndex++;
  };

  const daysConfig: {
    day: DayOfWeek;
    name: string;
    sessionsCount: number;
    isHoliday: boolean;
    holidayName?: string;
  }[] = [
    { day: 'Mo', name: 'Montag', sessionsCount: moHoliday ? 0 : 3, isHoliday: !!moHoliday, holidayName: moHoliday?.name },
    { day: 'Di', name: 'Dienstag', sessionsCount: diHoliday ? 0 : 3, isHoliday: !!diHoliday, holidayName: diHoliday?.name },
    { day: 'Mi', name: 'Mittwoch', sessionsCount: miHoliday ? 0 : (isBufferSessionTriggered ? 3 : 2), isHoliday: !!miHoliday, holidayName: miHoliday?.name },
    { day: 'Do', name: 'Donnerstag', sessionsCount: 0, isHoliday: !!doHoliday, holidayName: doHoliday?.name },
    { day: 'Fr', name: 'Freitag', sessionsCount: 0, isHoliday: !!frHoliday, holidayName: frHoliday?.name },
  ];

  let totalWeekNominalCapacity = 0;
  let totalWeekEffectiveProduced = 0;
  let sessionsRunCount = 0;
  let totalDisruptionShortfall = 0;
  let totalCarriedOverAmount = 0;

  daysConfig.forEach(d => {
    if (d.sessionsCount > 0) {
      for (let s = 1; s <= d.sessionsCount; s++) {
        const slotKey = `${currentWeek}_${d.day}_${s}`;
        const session = state.sessionOverrides[slotKey];
        const autoSlot = autoSlots[slotKey]; const target = session?.targetCount ?? (autoSlot ? autoSlot.targetCount : 0);
        const effective = session?.effectiveCount ?? (autoSlot ? autoSlot.effectiveCount : 0);

        totalWeekNominalCapacity += target;
        totalWeekEffectiveProduced += effective;
        sessionsRunCount++;

        if (session?.disruption) {
          totalDisruptionShortfall += session.disruption.shortfall;
        }
        if (session?.carriedOverShortfall) {
          totalCarriedOverAmount += session.carriedOverShortfall.amount;
        }
      }
    }
  });

  const progressPercentage =
    totalWeekNominalCapacity > 0
      ? Math.round((totalWeekEffectiveProduced / totalWeekNominalCapacity) * 100)
      : 0;

  const handleQuickInlineChange = (
    day: DayOfWeek,
    sessionNumber: number,
    newEffective: number
  ) => {
    const slotKey = `${currentWeek}_${day}_${sessionNumber}`;
    const clamped = Math.max(0, Math.min(24, newEffective));

    if (clamped < 24) {
      const reason = 'Trocknungsriss / Scheibenstörung';
      recordSessionDisruption(currentWeek, day, sessionNumber, clamped, reason);
    } else {
      resetSessionOverride(slotKey);
    }
  };

  const handleCompleteAll = () => {
    daysConfig.forEach(d => {
      for (let s = 1; s <= d.sessionsCount; s++) {
        const slotKey = `${currentWeek}_${d.day}_${s}`;
        resetSessionOverride(slotKey);
      }
    });
  };

  // Helper to get effective customer for a session
  const getSessionCustomer = (day: DayOfWeek, sessionNumber: number, session?: TurningSession) => {
    if (session?.customerId) {
      const cust = state.customers.find(c => c.id === session.customerId);
      if (cust) return cust;
    }
    const slotKey = `${currentWeek}_${day}_${sessionNumber}`;
    const auto = autoSlots[slotKey];
    if (auto?.customerId) {
      return state.customers.find(c => c.id === auto.customerId);
    }
    return undefined;
  };

  const activeDays = daysConfig;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 space-y-2 overflow-hidden">
      {/* 1. Kompakte Steuerungs- & Statusleiste mit freundlichem Farbverlauf */}
      <div className="bg-gradient-to-r from-white via-amber-50/40 to-orange-50/25 rounded-xl px-4 py-2.5 border border-stone-200/90 shadow-xs shrink-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Titel, KW & Datumsbereich */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-extrabold text-stone-900 tracking-tight whitespace-nowrap">
              2. Wochenübersicht
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 text-amber-950 font-mono shadow-2xs">
              KW {currentWeek}
            </span>
            <span className="text-xs font-mono font-bold text-stone-800 bg-white border border-stone-200/90 px-2.5 py-0.5 rounded-md shadow-2xs">
              {formatWeekDateRange(currentYear, currentWeek)}
            </span>
            {vacationInfo && (
              <span className="text-[11px] font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                <Palmtree className="w-3 h-3 text-amber-700" />
                <span>{vacationInfo.name}</span>
              </span>
            )}
            {currentWeekRevision && (
              <span className="text-[11px] font-bold text-indigo-950 bg-gradient-to-r from-violet-100 to-indigo-100 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                <Wrench className="w-3 h-3 text-indigo-700" />
                <span>Revision: {currentWeekRevision.title}</span>
              </span>
            )}
          </div>

          {/* Steuerung: Jahr, KW & Aktionen */}
          <div className="flex items-center gap-2">
            {/* Jahr-Auswahl */}
            <div className="flex items-center bg-stone-100 border border-stone-200/90 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setYear(currentYear - 1)}
                className="p-1 hover:bg-white text-stone-600 hover:text-stone-900 rounded transition-colors"
                title="Vorheriges Jahr"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={currentYear}
                onChange={e => setYear(Number(e.target.value))}
                className="bg-transparent font-bold text-stone-900 px-1 py-0.5 text-xs focus:outline-none cursor-pointer border-none font-mono"
                title="Jahr auswählen"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>
                    Jahr {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setYear(currentYear + 1)}
                className="p-1 hover:bg-white text-stone-600 hover:text-stone-900 rounded transition-colors"
                title="Nächstes Jahr"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* KW-Auswahl */}
            <div className="flex items-center bg-stone-100 border border-stone-200/90 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSelectedWeek(currentWeek - 1)}
                disabled={currentWeek <= 1}
                className="p-1 hover:bg-white text-stone-600 hover:text-stone-900 disabled:opacity-30 rounded transition-colors"
                title="Vorherige KW"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={currentWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
                className="bg-transparent font-bold text-stone-900 px-1 py-0.5 text-xs focus:outline-none cursor-pointer border-none font-mono"
              >
                {Array.from({ length: 52 }, (_, i) => i + 1).map(kw => (
                  <option key={kw} value={kw}>
                    KW {kw}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedWeek(currentWeek + 1)}
                disabled={currentWeek >= 52}
                className="p-1 hover:bg-white text-stone-600 hover:text-stone-900 disabled:opacity-30 rounded transition-colors"
                title="Nächste KW"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Gehe zu heute Button */}
            <button
              type="button"
              onClick={goToToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-950 bg-gradient-to-r from-blue-50 to-pink-50 hover:from-blue-100 hover:to-pink-100 border border-indigo-200/90 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Auf aktuelle Kalenderwoche & aktuelles Jahr springen"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Heute</span>
            </button>

            {/* Soll wiederherstellen Button */}
            <button
              type="button"
              onClick={handleCompleteAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors border border-stone-200/80"
              title="Alle Sessions dieser Woche auf Standard 24 Urnen setzen"
            >
              <RefreshCw className="w-3 h-3 text-stone-500" />
              <span className="hidden sm:inline">Soll 24</span>
            </button>

            {/* Sprung zur Grobplanung */}
            <button
              type="button"
              onClick={onJumpToYearPlan}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-950 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-md transition-colors border border-indigo-200 shadow-2xs"
              title="Zur Grobplanung wechseln"
            >
              <span>Grobplan</span>
              <ArrowRight className="w-3 h-3 text-indigo-600" />
            </button>
          </div>
        </div>

        {/* 2. Schlanke Fortschritts- & Leistungssumme */}
        <div className="pt-1.5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900 text-sm tabular-nums">
              {totalWeekEffectiveProduced} / {totalWeekNominalCapacity} Urnen
            </span>
            <span className="text-stone-400 font-mono text-[11px]">
              ({sessionsRunCount} Sessions aktiv)
            </span>

            {/* Geplant aus Grobplanung */}
            <span className="text-stone-500 text-[11px] hidden md:inline ml-1">
              Â· Grobplanung: <strong className="text-stone-800">{plannedUrnsGrob} Urnen</strong> ({plannedHardGrob}h / {plannedSolubleGrob}l)
              {plannedPlatesGrob > 0 && (
                <span className="text-stone-400 font-normal"> Â· +{plannedPlatesGrob} Plättli (neutral)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {totalDisruptionShortfall > 0 && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                Manko: -{totalDisruptionShortfall} U
              </span>
            )}
            {totalCarriedOverAmount > 0 && (
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Nachrücker: +{totalCarriedOverAmount} U
              </span>
            )}

            {/* Kompakter Fortschrittsbalken */}
            <div className="w-24 sm:w-36 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/80 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(3, progressPercentage))}%`,
                  backgroundColor:
                    progressPercentage >= 100
                      ? '#059669'
                      : progressPercentage >= 75
                      ? '#B45309'
                      : '#E11D48',
                }}
              />
            </div>
            <span className="font-black text-amber-950 font-mono text-xs tabular-nums">
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Schlanker Session-Farblegende-Streifen zur schnellen Unterscheidung */}
        <div className="pt-1.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px]">Tages-Sessions:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                1. Session (Blau)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                2. Session (Indigo)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-pink-100 text-pink-900 border border-pink-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-600" />
                3. Session (Pink)
              </span>
              {isBufferSessionTriggered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  Puffer-Session (Bernstein)
                </span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-stone-400 font-medium">
            Jede Session = 24 Urnen (Standard-Durchgang)
          </div>
        </div>

        {/* Feiertags-Hinweis wenn vorhanden */}
        {weekHolidays.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-1 text-[11px] text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3 h-3 text-amber-700 shrink-0" />
              <span>
                <strong>Feiertag Winterthur:</strong> {weekHolidays.map(h => `${h.name} (${h.dayOfWeek})`).join(', ')}.
              </span>
              {isBufferSessionTriggered && (
                <span className="font-semibold text-amber-950">
                  â†’ Mi. Puffer-Session (3. Session) aktiv.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Tageskarten: Nur Tage einblenden, an denen eingedreht wird (Füllt Resthöhe ohne Scrollen) */}
      {activeDays.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center max-w-md mx-auto my-auto shadow-xs">
          <Calendar className="w-10 h-10 text-amber-800 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-stone-900">Keine Eindreh-Sessions in KW {currentWeek}</h3>
          <p className="text-xs text-stone-500 mt-1">
            Alle regulären Eindrehtage dieser Woche fallen auf Feiertage oder Betriebsferien.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 flex-1 min-h-0 h-full overflow-hidden">
          {activeDays.map(dayConfig => {
            const { day, name, sessionsCount, isHoliday, holidayName } = dayConfig;
            const dayDate = getDateOfWeekday(currentYear, currentWeek, day);
            const formattedDayDate = formatDayWithDate(day, dayDate);

            return (
              <div
                key={day}
                className="rounded-xl border border-stone-200/90 bg-white shadow-xs flex flex-col justify-between overflow-hidden h-full min-h-0"
              >
                {/* Day Header mit sichtbarem Datum (z.B. Mo. 19.10.2026) und Session-Farbpunkten */}
                <div className="px-3 py-2 border-b bg-stone-50/90 border-stone-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-900 text-xs">{name}</span>{isHoliday && (<span className="text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={holidayName}>Feiertag{holidayName ? `: ${holidayName}` : ''}</span>)}
                    <span className="text-[11px] font-bold text-stone-800 bg-white border border-stone-200/90 px-2 py-0.5 rounded font-mono shadow-2xs">
                      {formattedDayDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Farbindikatoren für die Sessions des Tages */}
                    <div className="flex items-center gap-1 mr-0.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-2xs" title="1. Session (Blau)" />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-2xs" title="2. Session (Indigo)" />
                      {sessionsCount >= 3 && (
                        <span
                          className={`w-2 h-2 rounded-full shadow-2xs ${
                            day === 'Mi' && isBufferSessionTriggered ? 'bg-amber-500' : 'bg-pink-500'
                          }`}
                          title={
                            day === 'Mi' && isBufferSessionTriggered
                              ? '3. Session (Puffer / Bernstein)'
                              : '3. Session (Pink)'
                          }
                        />
                      )}
                    </div>
                    {day === 'Mi' && isBufferSessionTriggered && (
                      <span className="text-[9px] font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
                        + Puffer
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold text-stone-700 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                      {sessionsCount} Sess. ({sessionsCount * 24} U)
                    </span>
                  </div>
                </div>

                {/* Day Sessions: Füllt die Höhe optimal aus mit individueller Farbkodierung */}
                <div className="p-1.5 gap-1.5 flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
                  {Array.from({ length: sessionsCount }, (_, sIdx) => {
                    const sessionNumber = sIdx + 1;
                    const slotKey = `${currentWeek}_${day}_${sessionNumber}`;
                    const session = state.sessionOverrides[slotKey];
                    const isBuffer = day === 'Mi' && sessionNumber === 3;
                    const autoSlot = autoSlots[slotKey]; const target = session?.targetCount ?? (autoSlot ? autoSlot.targetCount : 0);
                    const effective = session?.effectiveCount ?? (autoSlot ? autoSlot.effectiveCount : 0);
                    const hasDisruption = !!session?.disruption;
                    const hasCarryOver = !!session?.carriedOverShortfall;

                    const activeCustomer = getSessionCustomer(day, sessionNumber, session);
                    const defaultSessionAccent =
                      sessionNumber === 1 ? '#2563EB' : sessionNumber === 2 ? '#4F46E5' : isBuffer ? '#D97706' : '#DB2777';
                    const customerColor = activeCustomer?.accentColor || defaultSessionAccent;
                    const productType = session?.productType || autoSlot?.productType || (activeCustomer?.productType === 'loeslich' ? 'Urne loeslich' : 'Urne hart');

                    // Spezifisches Farbthema pro Session-Nummer für klare Differenzierung
                    let theme = {
                      cardBg: 'bg-gradient-to-br from-blue-50/90 via-sky-50/30 to-white border-blue-200/90 hover:border-blue-400 shadow-2xs',
                      badgeClass: 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-xs',
                      badgeDot: 'bg-sky-200',
                      badgeLabel: '1. Session',
                      stepperBg: 'bg-blue-100/50 border border-blue-200/80',
                    };

                    if (sessionNumber === 2) {
                      theme = {
                        cardBg: 'bg-gradient-to-br from-indigo-50/90 via-purple-50/30 to-white border-indigo-200/90 hover:border-indigo-400 shadow-2xs',
                        badgeClass: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs',
                        badgeDot: 'bg-indigo-200',
                        badgeLabel: '2. Session',
                        stepperBg: 'bg-indigo-100/50 border border-indigo-200/80',
                      };
                    } else if (sessionNumber === 3) {
                      if (isBuffer) {
                        theme = {
                          cardBg: 'bg-gradient-to-br from-amber-50/95 via-orange-50/40 to-white border-amber-300 hover:border-amber-400 shadow-2xs',
                          badgeClass: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs',
                          badgeDot: 'bg-amber-200',
                          badgeLabel: '3. Session Â· Puffer',
                          stepperBg: 'bg-amber-100/60 border border-amber-200/90',
                        };
                      } else {
                        theme = {
                          cardBg: 'bg-gradient-to-br from-pink-50/90 via-rose-50/30 to-white border-pink-200/90 hover:border-pink-400 shadow-2xs',
                          badgeClass: 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-xs',
                          badgeDot: 'bg-pink-200',
                          badgeLabel: '3. Session',
                          stepperBg: 'bg-pink-100/50 border border-pink-200/80',
                        };
                      }
                    }

                    if (hasDisruption) {
                      theme.cardBg = 'bg-gradient-to-br from-rose-50/90 via-white to-rose-50/50 border-rose-300 ring-2 ring-rose-300/80 shadow-2xs';
                      theme.stepperBg = 'bg-rose-100/60 border border-rose-200/90';
                    }

                    return (
                      <div
                        key={slotKey}
                        className={`rounded-lg p-1.5 border transition-all flex flex-col justify-between flex-1 min-h-0 ${theme.cardBg}`}
                        style={{
                          borderLeftWidth: '4.5px',
                          borderLeftColor: customerColor,
                        }}
                      >
                        {/* Session Header */}
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${theme.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${theme.badgeDot}`} />
                              <span>{theme.badgeLabel}</span>
                            </span>
                            {isBuffer && (
                              <span className="text-[9px] font-bold bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
                                +24 U Puffer
                              </span>
                            )}
                          </div>
                          {hasDisruption && (
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              Störung
                            </span>
                          )}
                        </div>

                        {/* Kunde & Urnentyp */}
                        <div className="flex items-center justify-between gap-1 mb-0.5 text-xs">
                          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                            {activeCustomer && (
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: customerColor }} />
                            )}
                            <span className="font-extrabold text-stone-900 truncate text-[13px]">
                              {activeCustomer ? (activeCustomer.shortName || activeCustomer.name) : <span className="text-stone-400 font-normal italic">Frei</span>}
                            </span>
                          </div>
                          {activeCustomer && (
                            <div className="shrink-0">
                              <span className={`py-0.5 px-2 rounded text-[10px] font-bold shadow-2xs ${productType === 'Urne löslich' ? 'bg-sky-700 text-white' : 'bg-amber-800 text-white'}`}>
                                {productType === 'Urne löslich' ? 'löslich' : 'hart'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Geplante Menge (Read-Only) */}
                        <div className={`flex items-center justify-between gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${theme.stepperBg}`}>
                          <span className="text-stone-600 font-medium">Produktion:</span>
                          <span className="font-mono font-extrabold text-stone-900 text-sm">
                            {effective > 0 ? `${effective} Urnen` : <span className="text-stone-400 font-normal">Keine</span>}
                          </span>
                        </div>
                        {/* Störungs-Meldung & Nachrücken falls vorhanden */}
                        {hasDisruption && session.disruption && (
                          <div className="mt-1 p-1 rounded bg-rose-100/70 border border-rose-200 text-[9.5px] text-rose-900 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                              <span>Manko: -{session.disruption.shortfall} U</span>
                            </span>
                            <span className="text-[9px] truncate max-w-[130px]">
                              {session.disruption.reason}
                            </span>
                          </div>
                        )}

                        {hasCarryOver && session.carriedOverShortfall && (
                          <div className="mt-1 p-1 rounded bg-amber-100/70 border border-amber-200 text-[9.5px] text-amber-950 flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1 text-amber-900">
                              <Sparkles className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                              <span>Nachrücker: +{session.carriedOverShortfall.amount} U</span>
                            </span>
                            <span className="text-[9px]">
                              aus {session.carriedOverShortfall.sourceDay}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Eigenes Tagesfeld: Tonplättli (nebenbei produziert) */}
                <div className="mx-1.5 my-1 p-1.5 rounded-md bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shadow-2xs" />
                    <span className="font-bold text-emerald-950">Tonplättli:</span>
                  </div>
                  {(() => {
                    const plateKey = `${currentWeek}_${day}_plates`;
                    const plateVal = state.sessionOverrides[plateKey]?.effectiveCount ?? (autoPlatesPerDay[day] ?? 0);
                    return (
                      <div className="flex items-center gap-1 font-mono font-extrabold text-xs text-emerald-950">
                        <span>{plateVal}</span>
                        <span className="text-[10px] font-semibold text-emerald-800">Stk.</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Day Footer Summary */}
                <div className="px-3 py-1.5 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between text-[11px] text-stone-600 font-mono shrink-0">
                  <span className="font-medium">Tagesleistung:</span>
                  <span className="font-extrabold text-stone-900">
                    {Array.from({ length: sessionsCount }, (_, sIdx) => {
                      const slotKey = `${currentWeek}_${day}_${sIdx + 1}`;
                      return state.sessionOverrides[slotKey]?.effectiveCount ?? 24;
                    }).reduce((a, b) => a + b, 0)}{' '}
                    / {sessionsCount * 24} Urnen
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
