import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { useAuth } from '../context/AuthContext';
import { Layers, Calendar, Clock, RotateCcw, Download, Upload, ShieldCheck, Factory, Check, ChevronLeft, ChevronRight, CalendarCheck, LogOut, KeyRound } from 'lucide-react';

export const Header: React.FC<{
  onOpenBackupModal: () => void;
  onOpenVacationModal: () => void;
  onOpenPasswordModal: () => void;
}> = ({ onOpenBackupModal, onOpenVacationModal, onOpenPasswordModal }) => {
  const { state, setActiveSheet, resetToDefaults, setYear, goToToday } = usePlan();
  const { logout } = useAuth();
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [isResetConfirming, setIsResetConfirming] = useState(false);

  const handleReset = () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      setTimeout(() => setIsResetConfirming(false), 4000);
    } else {
      resetToDefaults();
      setIsResetConfirming(false);
      setResetConfirmed(true);
      setTimeout(() => setResetConfirmed(false), 2500);
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 text-white border-b border-indigo-400/30 shadow-md sticky top-0 z-40">
      {/* Top Bar Zone 1, 2, 3 */}
      <div className="max-w-[1920px] w-full mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark & Year Selector & Heute Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                  Urnerei Brühlgut
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] text-blue-100 font-medium">
                Digitale Produktionsplanung
              </span>
            </div>

            {/* Jahr-Auswahl im Header */}
            <div className="flex items-center bg-white/15 border border-white/25 backdrop-blur-xs rounded-lg p-0.5 text-xs ml-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setYear(state.year - 1)}
                className="p-1 hover:bg-white/20 text-blue-100 hover:text-white rounded transition-colors cursor-pointer"
                title="Vorheriges Jahr"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={state.year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent font-extrabold text-white px-1 py-0.5 text-xs focus:outline-none cursor-pointer border-none font-mono"
                title="Planungsjahr auswählen"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y} className="bg-indigo-900 text-white">
                    Jahr {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setYear(state.year + 1)}
                className="p-1 hover:bg-white/20 text-blue-100 hover:text-white rounded transition-colors cursor-pointer"
                title="Nächstes Jahr"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Gehe zu heute Button */}
            <button
              type="button"
              onClick={goToToday}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/35 backdrop-blur-xs rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Auf aktuelle Kalenderwoche & aktuelles Datum springen"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-pink-200" />
              <span>Heute</span>
            </button>
          </div>

          {/* Zone 2: Navigation Links in neuer Reihenfolge per Benutzerwunsch */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* 1. Grobplanung */}
            <button
              type="button"
              onClick={() => setActiveSheet('yearPlan')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                state.activeSheet === 'yearPlan'
                  ? 'bg-white text-indigo-950 shadow-md border border-white/90 scale-102'
                  : 'text-white/85 hover:text-white hover:bg-white/15'
              }`}
            >
              <Calendar className={`w-4 h-4 ${state.activeSheet === 'yearPlan' ? 'text-indigo-600' : 'text-white/80'}`} />
              <span>1. Grobplanung</span>
            </button>

            {/* 2. Feinplanung */}
            <button
              type="button"
              onClick={() => setActiveSheet('weekPlan')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                state.activeSheet === 'weekPlan'
                  ? 'bg-white text-indigo-950 shadow-md border border-white/90 scale-102'
                  : 'text-white/85 hover:text-white hover:bg-white/15'
              }`}
            >
              <Clock className={`w-4 h-4 ${state.activeSheet === 'weekPlan' ? 'text-indigo-600' : 'text-white/80'}`} />
              <span>2. Wochenübersicht</span>
            </button>

            {/* 3. Kundenübersicht */}
            <button
              type="button"
              onClick={() => setActiveSheet('customers')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                state.activeSheet === 'customers'
                  ? 'bg-white text-indigo-950 shadow-md border border-white/90 scale-102'
                  : 'text-white/85 hover:text-white hover:bg-white/15'
              }`}
            >
              <Layers className={`w-4 h-4 ${state.activeSheet === 'customers' ? 'text-pink-600' : 'text-white/80'}`} />
              <span>3. Kundenübersicht</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action / Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenVacationModal}
              title="Betriebsferien (Sommer & Weihnachten) einstellen"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-xs rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>Betriebsferien</span>
            </button>

            <button
              type="button"
              onClick={onOpenBackupModal}
              title="Daten sichern / wiederherstellen"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-xs rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-pink-200" />
              <span className="hidden sm:inline">Backup / JSON</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              title={isResetConfirming ? 'Klicken zum Bestätigen des Zurücksetzens' : 'Auf Manufaktur-Standardwerte zurücksetzen'}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                isResetConfirming
                  ? 'bg-rose-500 text-white font-bold ring-2 ring-white animate-pulse'
                  : 'text-white/80 hover:text-white hover:bg-white/20'
              }`}
            >
              {resetConfirmed ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : isResetConfirming ? (
                <span className="text-[11px] px-1 font-bold">Reset?</span>
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </button>

            {/* Password Modal Button */}
            <button
              type="button"
              onClick={onOpenPasswordModal}
              title="Plattform-Passwort ändern"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-pink-200" />
            </button>

            {/* Lock / Logout Button */}
            <button
              type="button"
              onClick={logout}
              title="Plattform sperren / Abmelden"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-white/20 hover:bg-rose-500/80 border border-white/30 hover:border-rose-400 rounded-md transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5 text-pink-200" />
              <span className="hidden md:inline">Sperren</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
