import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { calculateCustomerStats, CustomerStats } from '../utils/calculations';
import { Customer } from '../types';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  BarChart3
} from 'lucide-react';
import { CustomerAnalyticsModal } from './CustomerAnalyticsModal';

interface CustomerSheetProps {
  onOpenCustomerModal: (customer?: Customer) => void;
  onJumpToYearPlan: (customerId: string) => void;
}

export const CustomerSheet: React.FC<CustomerSheetProps> = ({
  onOpenCustomerModal,
  onJumpToYearPlan,
}) => {
  const { state, updateCustomer, deleteCustomer, clearAllCustomersAndOrders } = usePlan();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'reached'>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'table'>('grid');
  const [selectedCustomerForAnalytics, setSelectedCustomerForAnalytics] = useState<Customer | undefined>(undefined);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  const handleOpenAnalytics = (customer: Customer) => {
    setSelectedCustomerForAnalytics(customer);
    setIsAnalyticsModalOpen(true);
  };

  // Compute stats for all customers
  const allStats: CustomerStats[] = state.customers.map(c =>
    calculateCustomerStats(c, state.yearPlanEntries)
  );

  // Global KPIs
  const totalTargetA = state.customers.reduce((s, c) => s + c.targetA, 0);
  const totalTargetB = state.customers.reduce((s, c) => s + c.targetB, 0);
  const totalTargetUrns = totalTargetA + totalTargetB;
  const totalTargetPlates = state.customers.reduce((s, c) => s + c.targetPlates, 0);

  const totalPlanA = allStats.reduce((s, st) => s + st.planA, 0);
  const totalPlanB = allStats.reduce((s, st) => s + st.planB, 0);
  const totalPlanUrns = totalPlanA + totalPlanB;
  const totalPlanPlates = allStats.reduce((s, st) => s + st.planPlates, 0);

  const globalUrnsPercentage = totalTargetUrns > 0 ? Math.round((totalPlanUrns / totalTargetUrns) * 100) : 0;
  const customersReachedCount = allStats.filter(st => st.urnsReached).length;

  // Filtered stats
  const filteredStats = allStats.filter(st => {
    const matchesSearch =
      st.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.customer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterMode === 'all'
        ? true
        : filterMode === 'reached'
        ? st.urnsReached
        : !st.urnsReached;

    return matchesSearch && matchesFilter;
  });

  const handleDeleteClick = (c: Customer) => {
    setCustomerToDelete(c);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const handleClearAllClick = () => {
    setIsClearAllConfirmOpen(true);
  };

  const confirmClearAll = () => {
    clearAllCustomersAndOrders();
    setIsClearAllConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick KPI Strip */}
      <div className="bg-gradient-to-r from-white via-blue-50/40 to-pink-50/30 rounded-xl p-6 border border-indigo-100/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-indigo-50">
          <div>
            <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
              3. Kundenübersicht
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Jahressoll {state.year} für Urnen (hart &amp; löslich) sowie Tonplättli ({state.customers.length} Partner)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {state.customers.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllClick}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Alle Kunden und eingetragenen Aufträge löschen"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Alle löschen</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenCustomerModal()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Neuen Kunden erfassen</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-5">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200/70">
            <span className="text-xs font-medium text-stone-500">Kunden Gesamt</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-stone-900 tabular-nums">{state.customers.length}</span>
              <span className="text-xs text-stone-500">
                ({customersReachedCount} Soll erfüllt)
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200/60">
            <span className="text-xs font-semibold text-amber-950">Urnentyp A (hart)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-stone-900 tabular-nums">{totalPlanA}</span>
              <span className="text-xs text-stone-500 tabular-nums">/ {totalTargetA} Soll</span>
            </div>
          </div>

          <div className="p-3.5 bg-sky-50/50 rounded-lg border border-sky-200/60">
            <span className="text-xs font-semibold text-sky-950">Urnentyp B (löslich)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-stone-900 tabular-nums">{totalPlanB}</span>
              <span className="text-xs text-stone-500 tabular-nums">/ {totalTargetB} Soll</span>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">Tonplättli</span>
              <span className="text-[10px] text-stone-400">neutral</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-stone-900 tabular-nums">{totalPlanPlates}</span>
              <span className="text-xs text-stone-500 tabular-nums">/ {totalTargetPlates} Soll</span>
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-blue-600 via-indigo-600 to-pink-500 text-white rounded-lg shadow-sm border border-indigo-400/30 col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-white/90">Gesamt-Urnenerfüllung</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-white tabular-nums">{globalUrnsPercentage}%</span>
              <span className="text-xs text-blue-100 tabular-nums">
                ({totalPlanUrns} / {totalTargetUrns})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Kunde, Ortschaft oder Ansprechpartner suchen..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 text-stone-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-end">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-stone-100 rounded-lg text-xs font-medium shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterMode === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Alle ({allStats.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                filterMode === 'pending'
                  ? 'bg-rose-50 text-rose-800 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Soll offen ({allStats.filter(s => !s.urnsReached).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('reached')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                filterMode === 'reached'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Soll erfüllt ({customersReachedCount})
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-stone-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setViewStyle('grid')}
              title="Kartenansicht"
              className={`p-1.5 rounded-md transition-all ${
                viewStyle === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('table')}
              title="Tabellenansicht"
              className={`p-1.5 rounded-md transition-all ${
                viewStyle === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cards Grid View */}
      {viewStyle === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStats.map(st => {
            const { customer, planA, planB, planPlates, totalPlanUrns, targetTotalUrns, urnsDiff, urnsReached, urnsPercentage, platesReached, platesPercentage } = st;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top Banner with Status Badge (Klickbar für Mengenauswertung) */}
                <div className="p-5 pb-4 border-b border-stone-100">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => handleOpenAnalytics(customer)}
                      className="cursor-pointer group/title flex-1"
                      title="Klicken für Mehrjahres-Mengenauswertung & Diagramm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: customer.accentColor }}
                        />
                        <span className="text-xs font-semibold text-stone-700">
                          {customer.shortName || customer.name}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60 opacity-0 group-hover/title:opacity-100 transition-opacity">
                          Diagramm
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-1 leading-snug group-hover/title:text-indigo-600 transition-colors flex items-center gap-1.5">
                        <span>{customer.name}</span>
                        <BarChart3 className="w-4 h-4 text-indigo-500 opacity-60 group-hover/title:opacity-100 transition-opacity" />
                      </h3>
                    </div>

                    {/* Visual Status Indicator: Soft-Rot vs. Frisches Grün */}
                    <div>
                      {urnsReached ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Erfüllt ({urnsPercentage}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-200/70 whitespace-nowrap">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{urnsDiff} offen ({urnsPercentage}%)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar for Overall Urns */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-stone-700">Produktionssoll</span>
                      <span className="font-mono tabular-nums text-stone-800 font-semibold">
                        {totalPlanUrns} / {targetTotalUrns} Urnen
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          urnsReached ? 'bg-emerald-600' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, urnsPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Middle: Produktspezifische Anzeige */}
                  <div className="p-5 py-4 bg-stone-50/50">
                    {customer.productType === 'plaettli' ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                          <span className="font-bold text-stone-800">Tonplättli</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-stone-900 font-medium">{planPlates} / {customer.targetPlates} Stk.</span>
                          <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${platesReached ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'}`}>{platesPercentage}%</span>
                        </div>
                      </div>
                    ) : customer.productType === 'loeslich' ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-xs bg-sky-600" />
                          <span className="font-bold text-stone-800">Urnen löslich</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-stone-900 font-medium">{planB} / {customer.targetB} Urnen</span>
                          <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${planB >= customer.targetB ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'}`}>{customer.targetB > 0 ? Math.round((planB / customer.targetB) * 100) : 100}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-xs bg-amber-700" />
                          <span className="font-bold text-stone-800">Urnen hart</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums text-stone-900 font-medium">{planA} / {customer.targetA} Urnen</span>
                          <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${planA >= customer.targetA ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'}`}>{customer.targetA > 0 ? Math.round((planA / customer.targetA) * 100) : 100}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Contact & Actions */}
                <div className="p-4 bg-white border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="text-stone-500 truncate max-w-[150px]">
                    <span className="font-medium text-stone-700">{customer.contactPerson}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Auswertungs-Button mit Diagramm-Icon */}
                    <button
                      type="button"
                      onClick={() => handleOpenAnalytics(customer)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-950 bg-gradient-to-r from-blue-50 to-pink-50 hover:from-blue-100 hover:to-pink-100 border border-indigo-200/90 px-2 py-1 rounded-md transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Mengenauswertung über die letzten Jahre (Diagramm)"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Auswertung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onJumpToYearPlan(customer.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-950 px-2 py-1 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Im 52-Wochen-Jahresplaner anzeigen"
                    >
                      <span>Planen</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenCustomerModal(customer)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Sollmengen & Stammdaten bearbeiten"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClick(customer)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Kunde löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Dense Table View */}
      {viewStyle === 'table' && (
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="py-3 px-4">Kunde</th>
                  <th className="py-3 px-3 text-right">Typ A hart (Ist / Soll)</th>
                  <th className="py-3 px-3 text-right">Typ B löslich (Ist / Soll)</th>
                  <th className="py-3 px-3 text-right">Tonplättli (Ist / Soll)</th>
                  <th className="py-3 px-4 text-right">Total Urnen</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStats.map(st => {
                  const { customer, planA, planB, planPlates, totalPlanUrns, targetTotalUrns, urnsDiff, urnsReached, urnsPercentage, platesReached } = st;
                  return (
                    <tr key={customer.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => handleOpenAnalytics(customer)}
                          className="flex items-center gap-2 cursor-pointer group"
                          title="Klicken für Mengenauswertung & Diagramm"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: customer.accentColor }}
                          />
                          <div className="font-semibold text-stone-900 group-hover:text-indigo-600 group-hover:underline transition-colors flex items-center gap-1.5">
                            <span>{customer.name}</span>
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-500 opacity-70 group-hover:opacity-100" />
                          </div>
                        </div>
                        <div className="text-[11px] text-stone-500 pl-4">{customer.contactPerson}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-stone-900">{planA}</span>
                        <span className="text-stone-400"> / {customer.targetA}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-stone-900">{planB}</span>
                        <span className="text-stone-400"> / {customer.targetB}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="font-semibold text-stone-900">{planPlates}</span>
                        <span className="text-stone-400"> / {customer.targetPlates}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className="font-bold text-stone-900">{totalPlanUrns}</span>
                        <span className="text-stone-400"> / {targetTotalUrns}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {urnsReached ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{urnsPercentage}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>{urnsDiff} ({urnsPercentage}%)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAnalytics(customer)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-950 bg-gradient-to-r from-blue-50 to-pink-50 hover:from-blue-100 hover:to-pink-100 rounded border border-indigo-200/90 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Mengenauswertung über die letzten Jahre (Diagramm)"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Auswertung</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onJumpToYearPlan(customer.id)}
                            className="px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Planen
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenCustomerModal(customer)}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(customer)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Kunde löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredStats.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-indigo-100/80 shadow-xs">
          <Building2 className="w-12 h-12 text-blue-600/70 mx-auto mb-3" />
          {state.customers.length === 0 ? (
            <>
              <h3 className="text-base font-bold text-stone-900">Keine Kunden vorhanden</h3>
              <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
                Alle Kunden und eingetragenen Aufträge wurden gelöscht. Sie können jetzt neue Kunden mit ihren individuellen Sollmengen (Typ A, Typ B, Tonplättli) erfassen.
              </p>
              <button
                type="button"
                onClick={() => onOpenCustomerModal()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ersten Kunden erfassen</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-stone-800">Keine Kunden gefunden</h3>
              <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                Passen Sie die Suchkriterien oder den Statusfilter an, oder erfassen Sie einen neuen Kunden.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                }}
                className="mt-4 px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Filter zurücksetzen
              </button>
            </>
          )}
        </div>
      )}

      {/* 5. Customer Multi-Year Analytics Modal with Chart */}
      <CustomerAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        customer={selectedCustomerForAnalytics}
        currentYear={state.year}
        yearPlanEntries={state.yearPlanEntries}
        onClose={() => setIsAnalyticsModalOpen(false)}
        onUpdateCustomer={updateCustomer}
      />

      {/* 6. In-App Confirmation Modal: Kunde löschen (Löschen mit Bestätigung!) */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-rose-100 bg-rose-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Kunde unwiderruflich löschen?
                </h3>
                <p className="text-xs text-rose-800 font-medium">
                  Bestätigung erforderlich
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: customerToDelete.accentColor }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 truncate">
                    {customerToDelete.name}
                  </h4>
                  <p className="text-xs text-stone-500 truncate">
                    {customerToDelete.contactPerson} {customerToDelete.phone ? `• ${customerToDelete.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="text-xs text-stone-600 space-y-2">
                <p>
                  Möchten Sie den Kunden <strong>{customerToDelete.name}</strong> wirklich löschen?
                </p>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Folgende Daten werden unwiderruflich gelöscht:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11.5px] text-amber-900 space-y-0.5 pt-1 pl-1">
                    <li>Kundenstammdaten und Jahres-Sollmengen</li>
                    <li>
                      Alle Planungsblöcke im 52-Wochen-Grobplan ({state.yearPlanEntries.filter(e => e.customerId === customerToDelete.id).length} Einträge)
                    </li>
                    <li>Zuweisungen in den Schichten der Feinplanung</li>
                    <li>Gespeicherte historische Auswertungen</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteCustomer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Endgültig löschen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. In-App Confirmation Modal: Alle Kunden & Aufträge löschen */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-rose-100 bg-rose-50/70 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Alle Kunden &amp; Aufträge löschen?
                </h3>
                <p className="text-xs text-rose-800 font-medium">
                  Unwiderruflicher Vorgang
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-stone-600">
                Sind Sie sicher, dass Sie alle <strong>{state.customers.length} Kunden</strong> und sämtliche <strong>{state.yearPlanEntries.length} eingetragenen Jahresplanungen</strong> unwiderruflich leeren möchten?
              </p>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                <strong>Achtung:</strong> Die Datenbank wird komplett geleert. Sie können danach über „Neuen Kunden erfassen“ wieder von vorne beginnen.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsClearAllConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={confirmClearAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ja, alles unwiderruflich löschen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
