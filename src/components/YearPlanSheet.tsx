import React, { useState, useMemo } from 'react';
import { usePlan } from '../context/PlanContext';
import { calculateWeekOverview } from '../utils/calculations';
import { YearPlanEntry, Customer } from '../types';
import {
  Calendar, Copy,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Move,
  Clock,
  Palmtree,
  Search,
  Layers,
  GripVertical,
  Wrench,
  Users,
  CalendarCheck,
  X
} from 'lucide-react';
import { formatShortWeekDateRange, formatWeekDateRange, getISOWeekNumber } from '../utils/holidays';

interface YearPlanSheetProps {
  onOpenVacationModal: () => void;
  onOpenEntryModal: (customerId: string, weekNumber: number, entry?: YearPlanEntry) => void;
  onJumpToWeek: (weekNumber: number) => void;
}

export const YearPlanSheet: React.FC<YearPlanSheetProps> = ({

  onOpenVacationModal,
  onOpenEntryModal,
  onJumpToWeek,
}) => {
  const {
    state,
    setActiveSheet,
    moveYearPlanEntry,
    addOrUpdateYearPlanEntry,
    setYear,
    setSelectedWeek,
    goToToday,
    addOrUpdateRevision,
    moveRevision,
    deleteRevision
  } = usePlan();
  const [selectedQuarter, setSelectedQuarter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  const [isCustomerListOpen, setIsCustomerListOpen] = useState<boolean>(true);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [dragOverCell, setDragOverCell] = useState<{ customerId?: string; weekNumber: number } | null>(null);

    const copyPrevYearPlan = () => {};

  const isQuarterView = selectedQuarter !== 'all';

  const currentRealWeek = useMemo(() => {
    return Math.min(52, Math.max(1, getISOWeekNumber(new Date())));
  }, []);

  const handleGoToToday = () => {
    goToToday();
    const now = new Date();
    const kw = getISOWeekNumber(now);
    if (kw <= 13) setSelectedQuarter('q1');
    else if (kw <= 26) setSelectedQuarter('q2');
    else if (kw <= 39) setSelectedQuarter('q3');
    else setSelectedQuarter('q4');
  };

  // Determine week range based on quarter selection
  const weekRange = useMemo(() => {
    switch (selectedQuarter) {
      case 'q1': return Array.from({ length: 13 }, (_, i) => i + 1);       // 1..13
      case 'q2': return Array.from({ length: 13 }, (_, i) => i + 14);      // 14..26
      case 'q3': return Array.from({ length: 13 }, (_, i) => i + 27);      // 27..39
      case 'q4': return Array.from({ length: 13 }, (_, i) => i + 40);      // 40..52
      default: return Array.from({ length: 52 }, (_, i) => i + 1);         // 1..52
    }
  }, [selectedQuarter]);

  // Compute week summaries
  const weekOverviews = useMemo(() => {
    return Array.from({ length: 52 }, (_, i) => {
      const kw = i + 1;
      return calculateWeekOverview(kw, state.year, state.yearPlanEntries.filter(e => (e.year ?? 2026) === state.year), state.vacations);
    });
  }, [state.year, state.yearPlanEntries, state.vacations]);

  // Filtered customer list for the compact chip bar
  const filteredDrawerCustomers = useMemo(() => {
    if (!customerSearch.trim()) return state.customers;
    const q = customerSearch.toLowerCase();
    return state.customers.filter(
      c => c.name.toLowerCase().includes(q) || (c.shortName && c.shortName.toLowerCase().includes(q))
    );
  }, [state.customers, customerSearch]);

  // Drag handler for customer tile
  const handleDragStartCustomerTile = (e: React.DragEvent, customerId: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'customer_tile',
        customerId,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Drag handler for the Revision tile
  const handleDragStartRevisionTile = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'revision_tile',
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Drag handler for moving an existing block
  const handleDragStartExistingEntry = (e: React.DragEvent, entry: YearPlanEntry) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'move_entry',
        entryId: entry.id,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag handler for moving an existing revision block
  const handleDragStartExistingRevision = (e: React.DragEvent, revId: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'move_revision',
        revisionId: revId,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCell = (e: React.DragEvent, weekNum: number, custId?: string) => {
    e.preventDefault();
    if (!dragOverCell || dragOverCell.weekNumber !== weekNum || dragOverCell.customerId !== custId) {
      setDragOverCell({ weekNumber: weekNum, customerId: custId });
    }
  };

  const handleDragLeaveCell = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverCell(null);
  };

  const handleDropOnCell = (e: React.DragEvent, targetWeek: number, cellCustomerId?: string) => {
    e.preventDefault();
    setDragOverCell(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.type === 'revision_tile') {
        addOrUpdateRevision(targetWeek, 'Werkstatt- & Ofenrevision', 'Maschinen- & Ofenservice');
      } else if (data.type === 'move_revision' && data.revisionId) {
        moveRevision(data.revisionId, targetWeek);
      } else if (data.type === 'move_entry' && data.entryId) {
        moveYearPlanEntry(data.entryId, targetWeek);
      } else if (data.type === 'customer_tile' && data.customerId) {
        const targetCustId = data.customerId;
        const existing = state.yearPlanEntries.find(e => e.customerId === targetCustId && e.weekNumber === targetWeek && (e.year ?? 2026) === state.year);
        onOpenEntryModal(targetCustId, targetWeek, existing);
      }
    } catch (err) {
      console.error('Drop handling error', err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 space-y-2 overflow-hidden">
      {/* 1. Kompakte Steuerungsleiste mit freundlichem Farbverlauf */}
      <div className="bg-gradient-to-r from-white via-amber-50/40 to-orange-50/25 rounded-xl px-4 py-2.5 border border-stone-200/90 shadow-xs shrink-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Titel, Jahr-Auswahl & Quartal-Filter */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-extrabold text-stone-900 tracking-tight whitespace-nowrap">
              1. Grobplanung
            </h1>

            {/* Jahr-Auswahl direkt im Jahresplaner */}
            <div className="flex items-center bg-stone-100 border border-stone-200/90 rounded-lg p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setYear(state.year - 1)}
                className="p-1 hover:bg-white text-stone-600 hover:text-stone-900 rounded transition-colors"
                title="Vorheriges Jahr"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={state.year}
                onChange={(e) => setYear(Number(e.target.value))}
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
                onClick={() => setYear(state.year + 1)}
                className="p-1 hover:bg-white text-stone-600 hover:text-stone-900 rounded transition-colors"
                title="Nächstes Jahr"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Gehe zu heute Button */}
            <button
              type="button"
              onClick={handleGoToToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-950 bg-gradient-to-r from-blue-50 to-pink-50 hover:from-blue-100 hover:to-pink-100 border border-indigo-200/90 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95 ml-1"
              title="Auf aktuellen Tag / aktuelle Kalenderwoche springen"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Heute (KW {currentRealWeek})</span>
            </button>

            {/* Quarter Filter Segment (Quartale ohne horizontales Scrollen) */}
            <div className="flex items-center p-0.5 bg-stone-100/90 rounded-lg text-xs font-medium ml-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedQuarter('all')}
                className={`px-2.5 py-1 rounded transition-all ${
                  selectedQuarter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Alle 52 Kalenderwochen (mit horizontalem Kalender-Scrollen)"
              >
                Alle (52 KW)
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuarter('q1')}
                className={`px-2.5 py-1 rounded transition-all ${
                  selectedQuarter === 'q1'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Quartal 1: KW 1–13 (kompakt ohne horizontales Scrollen)"
              >
                Q1
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuarter('q2')}
                className={`px-2.5 py-1 rounded transition-all ${
                  selectedQuarter === 'q2'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Quartal 2: KW 14–26 (kompakt ohne horizontales Scrollen)"
              >
                Q2
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuarter('q3')}
                className={`px-2.5 py-1 rounded transition-all ${
                  selectedQuarter === 'q3'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Quartal 3: KW 27–39 (kompakt ohne horizontales Scrollen)"
              >
                Q3
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuarter('q4')}
                className={`px-2.5 py-1 rounded transition-all ${
                  selectedQuarter === 'q4'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Quartal 4: KW 40–52 (kompakt ohne horizontales Scrollen)"
              >
                Q4
              </button>
            </div>
          </div>

          {/* Quick Legend & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-3 text-[11px] text-stone-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-50 border border-amber-300 inline-block" />
                <span>Ferien</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shadow-2xs" />
                <span className="font-bold text-indigo-950">Revision</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-700 inline-block" />
                <span className="font-semibold text-stone-700">hart</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                <span className="font-semibold text-stone-700">löslich</span>
              </div>
              <div className="flex items-center gap-1" title="Tonplättli werden neben den Urnen gefertigt und haben 0% Einfluss auf die Kapazität">
                <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" />
                <span className="font-medium text-stone-600">Tonplättli</span>
                <span className="text-[10px] text-stone-400 font-normal">(kapazitätsneutral)</span>
              </div>
            </div>

            <button type="button" onClick={copyPrevYearPlan} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200 shadow-2xs" title={`Grobplanung aus dem Vorjahr (${state.year - 1}) übernehmen`}><Copy className="w-3.5 h-3.5 text-stone-600" /><span>Aus {state.year - 1} kopieren</span></button>
            <button
              type="button"
              onClick={onOpenVacationModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-md transition-colors shadow-2xs"
              title="Betriebsferien einstellen"
            >
              <Palmtree className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ferien</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomerListOpen(!isCustomerListOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all shadow-2xs cursor-pointer ${
                isCustomerListOpen
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 text-white'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${isCustomerListOpen ? 'text-blue-600' : 'text-white'}`} />
              <span>Kacheln ({state.customers.length + 1})</span>
              {isCustomerListOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 2. Schlanke Kundenkacheln & REVISION-KACHEL in mehreren Reihen OHNE horizontales Scrollen */}
        {isCustomerListOpen && (
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 pt-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Kacheln:
              </span>
              <div className="relative w-32 sm:hidden">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Filtern..."
                  className="w-full pl-6 pr-2 py-0.5 text-[11px] bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
                />
              </div>
            </div>

            {/* Kundenkacheln & Revision-Kachel: kleiner und in mehreren Reihen (flex-wrap) - KEIN horizontales Scrollen */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1 max-h-24 overflow-y-auto pr-1">
              {/* Kachel 'Revision' mit entsprechendem Wrench-Icon per Benutzerwunsch */}
              <div
                draggable
                onDragStart={handleDragStartRevisionTile}
                onClick={() => {
                  const kw = prompt('Auf welche Kalenderwoche (1–52) soll die Revision gesetzt werden?', String(state.selectedWeek));
                  if (kw) {
                    const num = parseInt(kw, 10);
                    if (num >= 1 && num <= 52) {
                      addOrUpdateRevision(num, 'Werkstatt- & Ofenrevision', 'Maschinenservice & Wartung');
                    }
                  }
                }}
                className="px-2.5 py-0.5 rounded-md border bg-gradient-to-r from-violet-100 via-indigo-50 to-indigo-100 border-indigo-300 hover:border-indigo-500 text-indigo-950 flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-2xs group text-[11px] font-bold shrink-0 ring-1 ring-indigo-200/80"
                style={{
                  borderLeftWidth: '3.5px',
                  borderLeftColor: '#6366F1',
                }}
                title="Kachel 'Revision' – Auf beliebige Kalenderwoche ziehen (oder klicken) zum Einfügen"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Wrench className="w-2.5 h-2.5" />
                </div>
                <span className="font-extrabold text-indigo-900 group-hover:text-indigo-950">Revision</span>
                <GripVertical className="w-2.5 h-2.5 text-indigo-400 group-hover:text-indigo-600 shrink-0" />
              </div>

              {filteredDrawerCustomers.map(cust => (
                <div
                  key={cust.id}
                  draggable
                  onDragStart={e => handleDragStartCustomerTile(e, cust.id)}
                  className="px-2 py-0.5 rounded-md border bg-stone-50 hover:bg-amber-50/70 hover:border-amber-400 text-stone-900 flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:scale-102 transition-all shadow-2xs group text-[11px]"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: cust.accentColor,
                  }}
                  title={`${cust.name} – Auf Kalenderwoche ziehen zum Eintragen`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: cust.accentColor }}
                  />
                  <span className="font-bold truncate max-w-[110px] group-hover:text-amber-900">
                    {cust.shortName || cust.name}
                  </span>
                  <GripVertical className="w-2.5 h-2.5 text-stone-400 group-hover:text-stone-600 shrink-0" />
                </div>
              ))}

              {filteredDrawerCustomers.length === 0 && (
                <span className="text-[11px] text-stone-400 italic px-2">
                  {state.customers.length === 0 ? 'Noch keine Kunden angelegt' : 'Keine Kunden gefunden'}
                </span>
              )}
            </div>

            <div className="relative w-36 shrink-0 hidden sm:block pt-0.5">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Kunden filtern..."
                className="w-full pl-6 pr-2 py-0.5 text-xs bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Matrix: Bei Quartalsansicht KEIN horizontales Scrollen, bei 52-Wochen horizontales Scrollen */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className={`${isQuarterView ? 'overflow-x-hidden' : 'overflow-x-auto'} overflow-y-auto flex-1 relative select-none`}>
          <table className={`w-full text-left text-xs border-collapse ${isQuarterView ? 'table-fixed' : ''}`}>
            {/* Table Header: Calendar Weeks */}
            <thead className="sticky top-0 z-30 bg-stone-100 text-stone-700 shadow-xs">
              <tr className="border-b border-stone-200">
                {/* Sticky customer column */}
                <th
                  className={`sticky left-0 z-40 bg-stone-100 py-2 px-2.5 font-bold text-stone-900 border-r border-stone-200 ${
                    isQuarterView ? 'w-[14%] min-w-[125px] max-w-[160px]' : 'min-w-[210px] max-w-[210px]'
                  }`}
                >
                  <div className="truncate">Kunde / Soll</div>
                </th>

                {weekRange.map(kw => {
                  const ov = weekOverviews[kw - 1];
                  const isCurrentActiveWeek = state.selectedWeek === kw;
                  const isWeekHeaderTarget = dragOverCell?.weekNumber === kw;

                  return (
                    <th
                      key={kw}
                      onDragOver={e => handleDragOverCell(e, kw)}
                      onDragLeave={handleDragLeaveCell}
                      onDrop={e => handleDropOnCell(e, kw, '')}
                      className={`py-1.5 px-1 text-center border-r border-stone-200/60 transition-colors ${
                        isQuarterView ? 'w-[6.6%] min-w-0' : 'min-w-[115px] max-w-[115px]'
                      } ${
                        isWeekHeaderTarget
                          ? 'bg-amber-100 border-2 border-dashed border-amber-600'
                          : ov.isVacation
                          ? 'bg-amber-50/70'
                          : isCurrentActiveWeek
                          ? 'bg-indigo-50/90 text-indigo-950 font-bold border-b-2 border-b-indigo-600'
                          : kw === currentRealWeek && state.year === new Date().getFullYear()
                          ? 'bg-blue-50/70 text-blue-950'
                          : 'bg-stone-50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-stone-900 text-xs">KW {kw}</span>
                          {kw === currentRealWeek && state.year === new Date().getFullYear() && (
                            <span className="text-[7.5px] font-black uppercase tracking-tight bg-blue-600 text-white px-1 py-0.2 rounded shadow-2xs" title="Aktuelle Kalenderwoche">
                              Heute
                            </span>
                          )}
                          {ov.isVacation && (
                            <span title={ov.vacationInfo?.name}>
                              <Palmtree className="w-3 h-3 text-amber-700 shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Sichtbares Kalenderdatum (z.B. 19.10.–25.10.) */}
                        <div
                          className="text-[9.5px] font-mono text-stone-500 font-semibold tracking-tight whitespace-nowrap"
                          title={`KW ${kw}: ${formatWeekDateRange(state.year, kw)}`}
                        >
                          {formatShortWeekDateRange(state.year, kw)}
                        </div>

                        {/* Holiday Marker if any */}
                        {ov.hasHolidayOnTurningDay && (
                          <span
                            className="text-[8.5px] font-semibold text-rose-800 bg-rose-100/90 px-1 rounded truncate max-w-full"
                            title={ov.holidays.map(h => `${h.name} (${h.dayOfWeek})`).join(', ')}
                          >
                            Feiertag
                          </span>
                        )}

                        {/* Revision Marker if any */}
                        {state.revisions?.some(r => r.weekNumber === kw) && (
                          <span
                            className="text-[8.5px] font-bold text-indigo-950 bg-indigo-100 border border-indigo-200 px-1 rounded truncate max-w-full flex items-center gap-0.5 shadow-2xs"
                            title={state.revisions.find(r => r.weekNumber === kw)?.title}
                          >
                            <Wrench className="w-2 h-2 text-indigo-700 shrink-0" />
                              <span>Revision</span>
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Weekly Capacity & Utilization Row */}
              <tr className="bg-stone-50/95 border-b border-stone-200 text-[10px] font-mono">
                <th
                  className={`sticky left-0 z-40 bg-stone-50 py-1 px-2.5 font-semibold text-stone-700 border-r border-stone-200 ${
                    isQuarterView ? 'w-[14%]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="truncate">Auslastung (192)</span>
                  </div>
                  <div className="text-[8.5px] font-normal text-stone-400 font-sans truncate">
                    Plättli neutral
                  </div>
                </th>
                {weekRange.map(kw => {
                  const ov = weekOverviews[kw - 1];
                  const isOverbooked = ov.utilizationRate > 100;
                  const isOptimal = ov.utilizationRate > 0 && ov.utilizationRate <= 100;

                  return (
                    <td
                      key={`cap-${kw}`}
                      className={`py-1 px-0.5 text-center border-r border-stone-200/60 ${
                        isQuarterView ? 'w-[6.6%]' : ''
                      } ${ov.isVacation ? 'bg-amber-50/40' : ''}`}
                    >
                      <div className="font-bold text-stone-900 tabular-nums text-[10px] truncate">
                        {ov.totalPlanUrns}{' '}
                        <span className="text-[8.5px] font-normal text-stone-400">/{ov.effectiveCapacity}</span>
                      </div>
                      <div
                        className={`text-[8.5px] font-bold px-1 rounded inline-block ${
                          isOverbooked
                            ? 'bg-rose-100 text-rose-800'
                            : isOptimal
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'text-stone-400'
                        }`}
                      >
                        {ov.utilizationRate}%
                      </div>
                      {ov.totalPlanPlates > 0 && (
                        <div
                          className="text-[8px] text-stone-500 font-mono truncate max-w-full mx-auto"
                          title={`${ov.totalPlanPlates} Tonplättli werden nebenher produziert (0% Einfluss auf Eindreh-Kapazität)`}
                        >
                          +{ov.totalPlanPlates}p
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Revision & Werkstatt-Wartung Row in thead */}
              <tr className="bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-stone-50 border-b border-indigo-200/60 text-[10px] font-mono">
                <th
                  className={`sticky left-0 z-40 bg-indigo-50/95 py-1 px-2.5 font-bold text-indigo-950 border-r border-indigo-200/80 ${
                    isQuarterView ? 'w-[14%]' : ''
                  }`}
                  style={{ borderLeftWidth: '3.5px', borderLeftColor: '#6366F1' }}
                >
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold truncate">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Revision</span>
                  </div>
                  <div className="text-[8.5px] font-normal text-indigo-700/80 font-sans truncate">
                    Kachel hier ablegen
                  </div>
                </th>
                {weekRange.map(kw => {
                  const rev = state.revisions?.find(r => r.weekNumber === kw);
                  const isRevTarget = dragOverCell?.weekNumber === kw;

                  return (
                    <td
                        key={`rev-${kw}`}
                        onDragOver={e => handleDragOverCell(e, kw)}
                        onDragLeave={handleDragLeaveCell}
                        onDrop={e => handleDropOnCell(e, kw)}
                        onClick={() => {
                          const current = state.revisions?.find(r => r.weekNumber === kw);
                          const input = prompt(current ? `Tätigkeit für KW ${kw} anpassen (leer lassen zum Löschen):` : `Freitext / Tätigkeit für KW ${kw} eingeben:`, current ? current.title : '');
                          if (input !== null) {
                            const trimmed = input.trim();
                            if (trimmed === '') {
                              if (current) deleteRevision(current.id);
                            } else {
                              addOrUpdateRevision(kw, trimmed, '');
                            }
                          }
                        }}
                        className={`h-7 px-1 text-center border-b border-r border-stone-200 transition-colors select-none cursor-pointer hover:bg-indigo-50/60 ${
                          isRevTarget ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-inset' : ''
                        }`}
                        title={rev ? `${rev.title} (Klicken zum Bearbeiten)` : `Klicken, um Revision für KW ${kw} einzutragen`}
                      >
                        {rev ? (
                          <div
                            draggable
                            onDragStart={e => handleDragStartExistingRevision(e, rev.id)}
                            className="group relative p-1 rounded bg-gradient-to-r from-violet-100 to-indigo-100 border border-indigo-300 text-indigo-950 shadow-2xs hover:shadow-xs transition-all cursor-grab active:cursor-grabbing flex items-center justify-between"
                            title={`${rev.title} (Ziehen zum Verschieben)`}
                          >
                            <div className="flex items-center gap-1 truncate text-[9px] font-bold flex-1">
                              <Wrench className="w-2.5 h-2.5 text-indigo-700 shrink-0" />
                              <span className="truncate">{rev.title || 'Revision'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                deleteRevision(rev.id);
                              }}
                              className="text-indigo-400 hover:text-rose-600 p-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                              title="Löschen"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-stone-300 group-hover:text-stone-400 font-mono">–</span>
                        )}
                      </td>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: Customers x Calendar Weeks */}
            <tbody className="divide-y divide-stone-100">
              {state.customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={weekRange.length + 1}
                    className="py-14 text-center text-stone-500 bg-stone-50/40"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-blue-100/80 flex items-center justify-center text-blue-700">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-stone-800 text-sm">
                          Keine Kunden und eingetragenen Aufträge vorhanden
                        </p>
                        <p className="text-xs text-stone-500">
                          Legen Sie in der Kundenübersicht Kunden an, um sie hier im Jahresplan per Drag &amp; Drop oder Klick Kalenderwochen zuzuweisen.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSheet('customers')}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 rounded-lg shadow-2xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Zur Kundenübersicht wechseln</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                state.customers.map(customer => {
                  const customerColor = customer.accentColor || '#78716C';

                  return (
                    <tr key={customer.id} className="hover:bg-stone-50/50 transition-colors">
                    {/* Sticky Customer Header Cell */}
                    <td
                      className={`sticky left-0 z-20 bg-white py-1.5 px-2 border-r border-stone-200 shadow-xs ${
                        isQuarterView ? 'w-[14%]' : ''
                      }`}
                      style={{ borderLeftWidth: '3.5px', borderLeftColor: customerColor }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: customerColor }}
                        />
                        <div className="font-bold text-stone-900 truncate max-w-[170px]" title={customer.name}>
                          {customer.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-stone-500 font-mono pl-4">
                        <span className="text-amber-900 font-semibold">{customer.targetA}h</span>
                        <span>·</span>
                        <span className="text-sky-900 font-semibold">{customer.targetB}l</span>
                        <span>·</span>
                        <span>{customer.targetPlates}p</span>
                      </div>
                    </td>

                    {/* Matrix Cells (KW 1..52) */}
                    {weekRange.map(kw => {
                      const entry = state.yearPlanEntries.find(e => e.customerId === customer.id && e.weekNumber === kw && (e.year ?? 2026) === state.year);
                      const isVacationWeek = weekOverviews[kw - 1].isVacation;
                      const isCellTarget = dragOverCell?.weekNumber === kw && dragOverCell?.customerId === customer.id;
                      const hasProduction = entry && (entry.typeA > 0 || entry.typeB > 0 || entry.plates > 0);

                      return (
                        <td
                          key={`${customer.id}-${kw}`}
                          onDragOver={e => handleDragOverCell(e, kw, customer.id)}
                          onDragLeave={handleDragLeaveCell}
                          onDrop={e => handleDropOnCell(e, kw, customer.id)}
                          onClick={() => onOpenEntryModal(customer.id, kw, entry)}
                          className={`py-1 px-1 align-top border-r border-stone-100 cursor-pointer transition-all ${
                            isQuarterView ? 'w-[6.6%]' : ''
                          } ${
                            isCellTarget
                              ? 'bg-amber-100/90 border-2 border-dashed border-amber-500 scale-[0.98]'
                              : isVacationWeek
                              ? 'bg-amber-50/30 hover:bg-amber-100/40'
                              : 'hover:bg-stone-100/60'
                          }`}
                        >
                          {hasProduction ? (
                            /* Draggable Production Block with CUSTOMER COLOR */
                            <div
                              draggable
                              onDragStart={e => handleDragStartExistingEntry(e, entry)}
                              className="group relative p-1 rounded-md text-stone-900 shadow-2xs hover:shadow-xs transition-all active:cursor-grabbing cursor-grab"
                              style={{
                                backgroundColor: `${customerColor}18`,
                                borderColor: `${customerColor}70`,
                                borderWidth: '1px',
                                borderLeftWidth: '3px',
                                borderLeftColor: customerColor,
                              }}
                              title="Ziehen, um in andere KW zu verschieben. Klicken zum Bearbeiten."
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                                <span className="font-bold text-stone-900 truncate">{entry.amount ?? (entry.typeA + entry.typeB + entry.plates)} Stk.</span>
                                <Move className="w-2.5 h-2.5 text-stone-400 group-hover:text-stone-700 transition-colors shrink-0" />
                              </div>
                              {(() => {
                                const pType = customer.productType || (customer.targetPlates > 0 ? 'plaettli' : (customer.targetB > 0 ? 'loeslich' : 'hart'));
                                const badgeLabel = pType === 'plaettli' ? (isQuarterView ? 'Pl' : 'Plaettli') : (pType === 'loeslich' ? (isQuarterView ? 'L' : 'Loeslich') : (isQuarterView ? 'H' : 'Hart'));
                                const badgeClass = pType === 'plaettli' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : (pType === 'loeslich' ? 'bg-sky-50 text-sky-900 border-sky-200' : 'bg-amber-50 text-amber-950 border-amber-200');
                                return (
                                  <div className={`mt-0.5 text-[9px] font-mono font-bold text-center py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}>
                                    {badgeLabel}
                                  </div>
                                );
                              })()}</div>
                            ) : (
                            <div className="h-10 rounded border border-dashed border-stone-200/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-700 hover:border-amber-400">
                              <Plus className="w-3 h-3" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
