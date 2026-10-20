import React, { useState, useMemo } from 'react';
import { Customer, YearPlanEntry } from '../types';
import {
  X,
  TrendingUp,
  BarChart3,
  LineChart,
  Calendar,
  Layers,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Plus
} from 'lucide-react';

export interface CustomerYearData {
  year: number;
  typeA: number;       // Urnentyp A (hart)
  typeB: number;       // Urnentyp B (löslich)
  totalUrns: number;   // typeA + typeB
  targetUrns: number;  // annual target
  plates: number;      // Tonplättli
  targetPlates: number;
}

export interface CustomerYearData {
  year: number;
  typeA: number;       // Urnentyp A (hart)
  typeB: number;       // Urnentyp B (löslich)
  totalUrns: number;   // typeA + typeB
  targetUrns: number;  // annual target
  plates: number;      // Tonplättli
  targetPlates: number;
  hasRealData: boolean; // whether actual historical data exists
}

interface CustomerAnalyticsModalProps {
  isOpen: boolean;
  customer?: Customer;
  currentYear: number;
  yearPlanEntries: YearPlanEntry[];
  onClose: () => void;
  onUpdateCustomer?: (customer: Customer) => void;
}

const HISTORY_STORAGE_PREFIX = 'urnenmanufaktur_cust_history_';

export const CustomerAnalyticsModal: React.FC<CustomerAnalyticsModalProps> = ({
  isOpen,
  customer,
  currentYear,
  yearPlanEntries,
  onClose,
  onUpdateCustomer,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [activeMetric, setActiveMetric] = useState<'total' | 'types' | 'plates'>('types');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [isEditingData, setIsEditingData] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [customHistory, setCustomHistory] = useState<Record<number, Partial<CustomerYearData>>>({});

  // Compute actual values for currentYear from current plan entries
  const currentYearActual = useMemo(() => {
    if (!customer) return { typeA: 0, typeB: 0, plates: 0, totalUrns: 0, targetUrns: 0, targetPlates: 0 };
    const entries = yearPlanEntries.filter(e => e.customerId === customer.id);
    const typeA = entries.reduce((s, e) => s + e.typeA, 0);
    const typeB = entries.reduce((s, e) => s + e.typeB, 0);
    const plates = entries.reduce((s, e) => s + e.plates, 0);
    return {
      typeA,
      typeB,
      plates,
      totalUrns: typeA + typeB,
      targetUrns: (customer.targetA || 0) + (customer.targetB || 0),
      targetPlates: customer.targetPlates || 0,
    };
  }, [customer, yearPlanEntries]);

  // Load any saved custom history from localStorage
  const savedOverrides = useMemo(() => {
    if (!customer) return {};
    try {
      const raw = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${customer.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }, [customer]);

  // Generate multi-year historical dataset (5 years: currentYear - 4 to currentYear)
  // LIVE MODE: No fake pseudo numbers! Only real saved data, or 0 if unrecorded.
  const historyData: CustomerYearData[] = useMemo(() => {
    if (!customer) return [];

    const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);

    return years.map(yr => {
      // If current year, use live actuals from yearPlanEntries unless edited in modal
      if (yr === currentYear) {
        const override = customHistory[yr] || savedOverrides[yr] || {};
        const typeA = override.typeA ?? currentYearActual.typeA;
        const typeB = override.typeB ?? currentYearActual.typeB;
        const plates = override.plates ?? currentYearActual.plates;
        return {
          year: yr,
          typeA,
          typeB,
          totalUrns: typeA + typeB,
          targetUrns: customer.targetA + customer.targetB,
          plates,
          targetPlates: customer.targetPlates,
          hasRealData: true,
        };
      }

      // Past years: check customer.history, modal state, or savedOverrides
      const savedHist = customer.history?.[yr];
      const custom = customHistory[yr] || savedOverrides[yr];

      const hasCustomA = custom && custom.typeA !== undefined;
      const hasCustomB = custom && custom.typeB !== undefined;
      const hasSavedA = savedHist && savedHist.typeA !== undefined;
      const hasSavedB = savedHist && savedHist.typeB !== undefined;

      if (hasCustomA || hasCustomB || hasSavedA || hasSavedB) {
        const typeA = custom?.typeA ?? savedHist?.typeA ?? 0;
        const typeB = custom?.typeB ?? savedHist?.typeB ?? 0;
        const plates = custom?.plates ?? savedHist?.plates ?? 0;
        return {
          year: yr,
          typeA,
          typeB,
          totalUrns: typeA + typeB,
          targetUrns: custom?.targetUrns ?? savedHist?.targetUrns ?? (customer.targetA + customer.targetB),
          plates,
          targetPlates: custom?.targetPlates ?? savedHist?.targetPlates ?? customer.targetPlates,
          hasRealData: true,
        };
      }

      // Live mode without pseudo numbers: clean 0 for past unrecorded years
      return {
        year: yr,
        typeA: 0,
        typeB: 0,
        totalUrns: 0,
        targetUrns: customer.targetA + customer.targetB,
        plates: 0,
        targetPlates: customer.targetPlates,
        hasRealData: false,
      };
    });
  }, [customer, currentYear, currentYearActual, customHistory, savedOverrides]);

  if (!isOpen || !customer) return null;

  // Max value for scaling SVG charts
  const maxUrnsVal = Math.max(
    ...historyData.map(d => Math.max(d.totalUrns, d.targetUrns, d.plates)),
    customer.targetA + customer.targetB,
    30
  );
  // Add 15% headroom for aesthetic spacing
  const chartCeil = Math.ceil((maxUrnsVal * 1.18) / 20) * 20;

  // Aggregate statistics based strictly on real data
  const yearsWithData = historyData.filter(d => d.totalUrns > 0 || (d.year === currentYear && currentYearActual.totalUrns > 0));
  const totalProducedUrnsAllYears = historyData.reduce((s, d) => s + d.totalUrns, 0);
  const currentTotal = historyData.find(d => d.year === currentYear)?.totalUrns || 0;
  const avgUrnsPerYear = yearsWithData.length > 0
    ? Math.round(totalProducedUrnsAllYears / yearsWithData.length)
    : currentTotal;
  const peakYearData = [...historyData].sort((a, b) => b.totalUrns - a.totalUrns)[0];
  const lastYearItem = historyData.find(d => d.year === currentYear - 1);
  const hasLastYearData = !!lastYearItem && lastYearItem.hasRealData && lastYearItem.totalUrns > 0;
  const lastYearTotal = lastYearItem?.totalUrns || 0;
  const growthRate = (hasLastYearData && lastYearTotal > 0)
    ? Math.round(((currentTotal - lastYearTotal) / lastYearTotal) * 100)
    : null;

  // SVG Chart Geometry
  const chartWidth = 620;
  const chartHeight = 260;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index + 0.5) * (innerWidth / historyData.length);
  const getY = (val: number) => paddingTop + innerHeight - (val / chartCeil) * innerHeight;

  const handleSaveCustomHistory = () => {
    try {
      const mergedOverrides = { ...savedOverrides, ...customHistory };
      localStorage.setItem(
        `${HISTORY_STORAGE_PREFIX}${customer.id}`,
        JSON.stringify(mergedOverrides)
      );
      if (onUpdateCustomer) {
        onUpdateCustomer({
          ...customer,
          history: mergedOverrides as Record<number, any>,
        });
      }
      setIsEditingData(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetHistory = () => {
    setShowResetConfirm(true);
  };

  const confirmResetHistory = () => {
    try {
      localStorage.removeItem(`${HISTORY_STORAGE_PREFIX}${customer.id}`);
      setCustomHistory({});
      if (onUpdateCustomer) {
        const copy = { ...customer };
        delete copy.history;
        onUpdateCustomer(copy);
      }
      setIsEditingData(false);
      setShowResetConfirm(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-indigo-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-pink-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: customer.accentColor }}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-indigo-200/80 text-indigo-950 font-mono">
                  {customer.shortName || customer.name}
                </span>
                <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                  â€¢ Mehrjahres-Mengenauswertung
                </span>
              </div>
              <h2 className="text-lg font-black text-stone-900 tracking-tight mt-0.5">
                {customer.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingData(!isEditingData)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                isEditingData
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-stone-700 hover:text-stone-950 border-stone-200/90 hover:bg-stone-50'
              }`}
              title="Mengenwerte der Vorjahre bearbeiten oder ergänzen"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Werte bearbeiten</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Stats KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/70 to-white border border-blue-200/70 shadow-2xs">
              <div className="flex items-center justify-between text-blue-900 text-xs font-semibold">
                <span>Gesamtvolumen</span>
                <Layers className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900 tabular-nums">
                  {totalProducedUrnsAllYears}
                </span>
                <span className="text-xs text-stone-500 font-medium">Urnen</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-1">Über 5 Jahre kumuliert</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-white border border-indigo-200/70 shadow-2xs">
              <div className="flex items-center justify-between text-indigo-900 text-xs font-semibold">
                <span>Jahresschnitt (âŒ€)</span>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900 tabular-nums">
                  {avgUrnsPerYear}
                </span>
                <span className="text-xs text-stone-500 font-medium">Urnen / Jahr</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-1">Solide Partnerschaft</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-pink-50/70 to-white border border-pink-200/70 shadow-2xs">
              <div className="flex items-center justify-between text-pink-900 text-xs font-semibold">
                <span>Spitzenjahr</span>
                <Award className="w-3.5 h-3.5 text-pink-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900 tabular-nums">
                  {peakYearData?.year}
                </span>
                <span className="text-xs text-pink-700 font-bold tabular-nums">
                  ({peakYearData?.totalUrns} U)
                </span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-1">Höchste Jahresproduktion</p>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/70 to-white border border-amber-200/70 shadow-2xs">
              <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">

                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900 tabular-nums">
                  {customer.targetA + customer.targetB}
                </span>
                <span className="text-xs text-stone-500 font-medium">Soll-Urnen</span>
              </div>
              <p className="text-[10.5px] text-stone-500 mt-1">
                {customer.targetA} hart Â· {customer.targetB} löslich
              </p>
            </div>
          </div>

          {/* Live Data Info Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 px-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-pink-50/40 border border-blue-200/80 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-blue-950 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Live-Modus:</strong> Ausschliesslich echte, gespeicherte Produktionsmengen (keine Zufalls- oder Pseudo-Zahlen). Jahre ohne Vorjahreseintrag weisen 0 Urnen aus.
              </span>
            </div>
            {!isEditingData && (
              <button
                type="button"
                onClick={() => setIsEditingData(true)}
                className="shrink-0 self-start sm:self-auto text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-2.5 py-1 rounded-md shadow-2xs cursor-pointer hover:bg-indigo-50/50 transition-colors"
              >
                + Vorjahre erfassen
              </button>
            )}
          </div>

          {/* Diagram Controls & Legend Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            
          </div>

          {/* Interactive SVG Diagram Box */}
          <div className="bg-white rounded-xl border border-indigo-100/90 p-4 shadow-xs relative">
            {/* Chart Top Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-xs">
              <div className="flex items-center gap-4">
                {activeMetric === 'types' && (
                  <>
                    
                    
                  </>
                )}
                {activeMetric === 'total' && (
                  <>
                    
                  </>
                )}
                {activeMetric === 'plates' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-stone-500 inline-block shadow-2xs" />
                      <span className="font-semibold text-stone-800">Tonplättli (Ist)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 border-t-2 border-dashed border-stone-400 inline-block" />
                      <span className="text-stone-500 font-medium">Soll Tonplättli</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-[11px] text-stone-400 font-mono">
                Einheit: Stück Â· Aktuelles Jahr {currentYear} hervorgehoben
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto max-h-[300px] select-none"
              >
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const val = Math.round(chartCeil * ratio);
                  const y = getY(val);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] fill-stone-400 font-mono font-medium"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bar Chart Mode */}
                {chartType === 'bar' && (
                  <g>
                    {historyData.map((d, idx) => {
                      const cx = getX(idx);
                      const barWidth = 42;
                      const isCurrent = d.year === currentYear;
                      const isHovered = hoveredYear === d.year;

                      if (activeMetric === 'types') {
                        const hA = (d.typeA / chartCeil) * innerHeight;
                        const hB = (d.typeB / chartCeil) * innerHeight;
                        const yA = paddingTop + innerHeight - hA;
                        const yB = yA - hB;
                        
                        

                        return (
                          <g
                            key={d.year}
                            onMouseEnter={() => setHoveredYear(d.year)}
                            onMouseLeave={() => setHoveredYear(null)}
                            className="cursor-pointer transition-all"
                          >
                            {/* Hover highlight background */}
                            <rect
                              x={cx - barWidth / 2 - 8}
                              y={paddingTop}
                              width={barWidth + 16}
                              height={innerHeight}
                              fill={isHovered ? '#EEF2FF' : 'transparent'}
                              rx="6"
                              className="transition-colors"
                            />

                            {d.totalUrns > 0 ? (
                              <>
                                {/* Stacked Bar Part 1: Typ A (hart) */}
                                {hA > 0 && (
                                  <rect
                                    x={cx - barWidth / 2}
                                    y={yA}
                                    width={barWidth}
                                    height={hA}
                                    fill="#B45309"
                                    rx="2"
                                    opacity={isHovered ? 1 : 0.9}
                                  />
                                )}

                                {/* Stacked Bar Part 2: Typ B (löslich) */}
                                {hB > 0 && (
                                  <rect
                                    x={cx - barWidth / 2}
                                    y={yB}
                                    width={barWidth}
                                    height={hB}
                                    fill="#0284C7"
                                    rx="3"
                                    opacity={isHovered ? 1 : 0.9}
                                  />
                                )}
                              </>
                            ) : (
                              /* Clean zero slot */
                              <rect
                                x={cx - barWidth / 2}
                                y={paddingTop + innerHeight - 16}
                                width={barWidth}
                                height={16}
                                fill="#F8FAFC"
                                stroke="#CBD5E1"
                                strokeWidth="1.5"
                                rx="3"
                              />
                            )}

                            {/* Target line indicator */}
                            

                            {/* Total quantity label above bar */}
                            <text
                              x={cx}
                              y={d.totalUrns > 0 ? yB - 6 : paddingTop + innerHeight - 20}
                              textAnchor="middle"
                              className={`text-[11px] font-mono font-bold ${
                                d.totalUrns === 0
                                  ? 'fill-stone-400 font-normal'
                                  : isCurrent
                                  ? 'fill-blue-900 font-black'
                                  : 'fill-stone-800'
                              }`}
                            >
                              {d.totalUrns}
                            </text>
                          </g>
                        );
                      } else if (activeMetric === 'total') {
                        const hTotal = (d.totalUrns / chartCeil) * innerHeight;
                        const yTotal = paddingTop + innerHeight - hTotal;
                        
                        

                        return (
                          <g
                            key={d.year}
                            onMouseEnter={() => setHoveredYear(d.year)}
                            onMouseLeave={() => setHoveredYear(null)}
                            className="cursor-pointer transition-all"
                          >
                            <rect
                              x={cx - barWidth / 2 - 8}
                              y={paddingTop}
                              width={barWidth + 16}
                              height={innerHeight}
                              fill={isHovered ? '#EEF2FF' : 'transparent'}
                              rx="6"
                              className="transition-colors"
                            />

                            {/* Single Bar Total with blue-pink gradient effect */}
                            <defs>
                              <linearGradient id={`barGrad_${d.year}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#EC4899" />
                                <stop offset="100%" stopColor="#2563EB" />
                              </linearGradient>
                            </defs>
                            {d.totalUrns > 0 ? (
                              <rect
                                x={cx - barWidth / 2}
                                y={yTotal}
                                width={barWidth}
                                height={hTotal}
                                fill={`url(#barGrad_${d.year})`}
                                rx="4"
                                opacity={isHovered ? 1 : 0.88}
                              />
                            ) : (
                              <rect
                                x={cx - barWidth / 2}
                                y={paddingTop + innerHeight - 16}
                                width={barWidth}
                                height={16}
                                fill="#F8FAFC"
                                stroke="#CBD5E1"
                                strokeWidth="1.5"
                                rx="3"
                              />
                            )}

                            

                            <text
                              x={cx}
                              y={d.totalUrns > 0 ? yTotal - 6 : paddingTop + innerHeight - 20}
                              textAnchor="middle"
                              className={`text-[11px] font-mono ${
                                d.totalUrns === 0 ? 'fill-stone-400 font-normal' : 'font-extrabold fill-stone-900'
                              }`}
                            >
                              {d.totalUrns}
                            </text>
                          </g>
                        );
                      } else {
                        // Plates
                        const hPlates = (d.plates / chartCeil) * innerHeight;
                        const yPlates = paddingTop + innerHeight - hPlates;
                        
                        

                        return (
                          <g
                            key={d.year}
                            onMouseEnter={() => setHoveredYear(d.year)}
                            onMouseLeave={() => setHoveredYear(null)}
                            className="cursor-pointer transition-all"
                          >
                            <rect
                              x={cx - barWidth / 2 - 8}
                              y={paddingTop}
                              width={barWidth + 16}
                              height={innerHeight}
                              fill={isHovered ? '#EEF2FF' : 'transparent'}
                              rx="6"
                            />
                            {d.totalUrns > 0 ? (
                              <rect
                                x={cx - barWidth / 2}
                                y={yPlates}
                                width={barWidth}
                                height={hPlates}
                                fill="#64748B"
                                rx="3"
                                opacity={isHovered ? 1 : 0.85}
                              />
                            ) : (
                              <rect
                                x={cx - barWidth / 2}
                                y={paddingTop + innerHeight - 16}
                                width={barWidth}
                                height={16}
                                fill="#F8FAFC"
                                stroke="#CBD5E1"
                                strokeWidth="1.5"
                                rx="3"
                              />
                            )}
                            
                            <text
                              x={cx}
                              y={d.totalUrns > 0 ? yPlates - 6 : paddingTop + innerHeight - 20}
                              textAnchor="middle"
                              className={`text-[11px] font-mono ${
                                d.totalUrns === 0 ? 'fill-stone-400 font-normal' : 'font-bold fill-stone-800'
                              }`}
                            >
                              {d.plates}
                            </text>
                          </g>
                        );
                      }
                    })}
                  </g>
                )}

                {/* Line Chart Mode */}
                {chartType === 'line' && (
                  <g>
                    {/* Area fill under curve */}
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Path points */}
                    {(() => {
                      const points = historyData.map((d, i) => {
                        const val = activeMetric === 'plates' ? d.plates : d.totalUrns;
                        return `${getX(i)},${getY(val)}`;
                      });
                      const areaPoints = [
                        `${getX(0)},${paddingTop + innerHeight}`,
                        ...points,
                        `${getX(historyData.length - 1)},${paddingTop + innerHeight}`,
                      ].join(' ');

                      const targetPoints = historyData.map((d, i) => {
                        const tVal = activeMetric === 'plates' ? d.targetPlates : d.targetUrns;
                        return `${getX(i)},${getY(tVal)}`;
                      }).join(' ');

                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#areaGrad)" />
                          {/* Target line */}
                          <polyline
                            points={targetPoints}
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="2"
                          />
                          {/* Actuals line */}
                          <polyline
                            points={points.join(' ')}
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      );
                    })()}

                    {/* Data Points on Line */}
                    {historyData.map((d, idx) => {
                      const cx = getX(idx);
                      const val = activeMetric === 'plates' ? d.plates : d.totalUrns;
                      const cy = getY(val);
                      const isHovered = hoveredYear === d.year;

                      return (
                        <g
                          key={d.year}
                          onMouseEnter={() => setHoveredYear(d.year)}
                          onMouseLeave={() => setHoveredYear(null)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 7 : 5}
                            fill="#FFFFFF"
                            stroke="#2563EB"
                            strokeWidth="3"
                            className="transition-all"
                          />
                          <text
                            x={cx}
                            y={cy - 10}
                            textAnchor="middle"
                            className="text-[11px] font-mono font-bold fill-stone-900"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* X-Axis: Year Labels */}
                {historyData.map((d, idx) => {
                  const cx = getX(idx);
                  const isCurrent = d.year === currentYear;
                  const isHovered = hoveredYear === d.year;

                  return (
                    <g key={d.year}>
                      {isCurrent && (
                        <rect
                          x={cx - 24}
                          y={paddingTop + innerHeight + 10}
                          width={48}
                          height={18}
                          rx="4"
                          fill="#EFF6FF"
                          stroke="#BFDBFE"
                          strokeWidth="1"
                        />
                      )}
                      <text
                        x={cx}
                        y={paddingTop + innerHeight + 23}
                        textAnchor="middle"
                        className={`text-xs font-mono transition-colors ${
                          isHovered
                            ? 'fill-indigo-600 font-extrabold'
                            : isCurrent
                            ? 'fill-blue-900 font-black'
                            : 'fill-stone-600 font-semibold'
                        }`}
                      >
                        {d.year}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip Box if a year is hovered */}
            {hoveredYear !== null && (
              (() => {
                const item = historyData.find(d => d.year === hoveredYear);
                if (!item) return null;
                const fulfillment = Math.round((item.totalUrns / (item.targetUrns || 1)) * 100);

                return (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-pink-50/80 border border-indigo-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-indigo-950 text-sm px-2 py-0.5 rounded bg-white border border-indigo-200 shadow-2xs">
                        Jahr {item.year}
                      </span>
                      <span className="text-stone-700 font-medium">
                        Detailauswertung für <strong>{customer.name}</strong>:
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-stone-500 font-sans text-[11px]">Typ A (hart):</span>{' '}
                        <strong className="text-amber-800">{item.typeA} U</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-sans text-[11px]">Typ B (löslich):</span>{' '}
                        <strong className="text-sky-700">{item.typeB} U</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 font-sans text-[11px]">Urnen Total:</span>{' '}
                        <strong className="text-stone-900">{item.totalUrns}</strong>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-white border border-indigo-200 font-bold text-indigo-950">
                        {fulfillment}% Soll
                      </div>
                      <div>
                        <span className="text-stone-500 font-sans text-[11px]">Tonplättli:</span>{' '}
                        <strong className="text-stone-700">{item.plates} / {item.targetPlates}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Data Table View (with Edit Mode if active) */}
          <div className="bg-stone-50/60 rounded-xl border border-stone-200/90 overflow-hidden">
            <div className="p-3.5 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-700" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Jahresmengen im Überblick ({historyData.length} Jahre)
                </h3>
              </div>

              {isEditingData && (
                <div className="flex items-center gap-2">
                  {showResetConfirm ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px]">
                      <span className="text-rose-900 font-medium">Historie leeren?</span>
                      <button
                        type="button"
                        onClick={confirmResetHistory}
                        className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                      >
                        Ja, löschen
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="text-stone-600 hover:text-stone-900 cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetHistory}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Zurücksetzen</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveCustomHistory}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 px-3 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                    <span>Speichern</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold bg-white">
                    <th className="py-2.5 px-4">Jahr</th>
                    <th className="py-2.5 px-3 text-right">Menge (Ist)</th>
                    
                    
                    
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {historyData.map(row => {
                    const isCurrent = row.year === currentYear;
                    

                    

                    return (
                      <tr
                        key={row.year}
                        className={`transition-colors ${
                          isCurrent ? 'bg-blue-50/40 font-semibold' : 'hover:bg-stone-50'
                        }`}
                      >
<td className="py-2.5 px-4 font-mono font-medium text-stone-900">{row.year}{isCurrent ? " (Aktuell)" : ""}</td><td className="py-2.5 px-3 text-right font-mono">{isEditingData ? (<input type="number" min="0" className="w-24 px-2 py-1 text-right border border-stone-300 rounded font-mono text-xs bg-white" value={customHistory[row.year]?.totalUrns ?? row.totalUrns ?? 0} onChange={e => { const v = parseInt(e.target.value) || 0; setCustomHistory(prev => ({ ...prev, [row.year]: { ...prev[row.year], totalUrns: v, typeA: v } })); }} />) : (<span className="font-bold text-stone-900">{row.totalUrns}</span>)}</td><td className="py-2.5 px-4 text-center"><span className={"inline-block px-2 py-0.5 rounded text-[11px] font-semibold " + (row.totalUrns > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-stone-100 text-stone-400")}>{row.totalUrns > 0 ? "Produziert" : "Keine Daten"}</span></td>
</tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Klick auf einen Balken oder Punkt zeigt die genaue Aufschlüsselung.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
};
