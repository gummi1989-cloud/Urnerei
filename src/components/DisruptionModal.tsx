import React, { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { DayOfWeek, TurningSession } from '../types';
import { X, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw, Wrench, Sparkles } from 'lucide-react';

interface DisruptionModalProps {
  isOpen: boolean;
  weekNumber: number;
  day: DayOfWeek;
  sessionNumber: number;
  session?: TurningSession;
  onClose: () => void;
}

const COMMON_REASONS = [
  'Trocknungsrisse / Feuchtigkeitsabfall im Atelier',
  'Töpferscheiben-Wartung / Spindellager defekt',
  'Blasenbildung / Verunreinigung im Rohton',
  'Personalausfall / Krankheitsbedingte Unterbesetzung',
  'Ausschuss beim Formen & Abdrehen der Urnen',
  'Stromunterbruch / Temperaturabfall Werkstatt',
  'Individuelle Manufaktur-Verzögerung',
];

export const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  weekNumber,
  day,
  sessionNumber,
  session,
  onClose,
}) => {
  const { recordSessionDisruption, resetSessionOverride } = usePlan();
  const [effectiveCount, setEffectiveCount] = useState<number>(session?.effectiveCount ?? 16);
  const [reason, setReason] = useState<string>(session?.disruption?.reason ?? COMMON_REASONS[0]);
  const [notes, setNotes] = useState<string>(session?.disruption?.notes ?? '');

  useEffect(() => {
    if (session) {
      setEffectiveCount(session.effectiveCount ?? 16);
      setReason(session.disruption?.reason ?? COMMON_REASONS[0]);
      setNotes(session.disruption?.notes ?? '');
    } else {
      setEffectiveCount(16);
      setReason(COMMON_REASONS[0]);
      setNotes('');
    }
  }, [session, isOpen]);

  if (!isOpen) return null;

  const targetCount = 24;
  const shortfall = Math.max(0, targetCount - effectiveCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordSessionDisruption(weekNumber, day, sessionNumber, effectiveCount, reason, notes);
    onClose();
  };

  const handleReset = () => {
    const slotKey = `${weekNumber}_${day}_${sessionNumber}`;
    resetSessionOverride(slotKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Störungsmanagement & Minderproduktion
              </h3>
              <p className="text-xs text-stone-500">
                KW {weekNumber} · {day} · Session {sessionNumber} (Standard: 24 Urnen)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target vs Effective */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-500 block">Soll-Kapazität</span>
              <span className="text-2xl font-extrabold text-stone-900 font-mono mt-0.5 block">
                24 Urnen
              </span>
              <span className="text-[10px] text-stone-500">1 Standard Eindreh-Session</span>
            </div>

            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
              <span className="text-xs font-semibold text-rose-900 block">Tatsächlich gefertigt (Ist)</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={effectiveCount}
                  onChange={e => setEffectiveCount(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-20 px-2 py-1 text-xl font-bold font-mono bg-white border border-rose-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500 text-rose-950"
                />
                <span className="text-xs text-rose-700 font-semibold font-mono">Urnen</span>
              </div>
            </div>
          </div>

          {/* Dynamic Nachrücken Explanatory Card */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Dynamische Nachrück-Logik aktiviert:</span>
            </div>
            {shortfall > 0 ? (
              <p className="text-amber-900 leading-relaxed">
                Es entsteht ein Ausfall von <strong className="font-mono text-rose-700">{shortfall} Urnen</strong>.
                Diese Restmenge wird automatisch an die <strong>nächste Eindreh-Session</strong> weitergegeben
                und dort als Nachrück-Charge ausgewiesen.
              </p>
            ) : (
              <p className="text-emerald-800">
                Volle Sessionmenge (24 Urnen) erreicht. Keine Nachrück-Menge erforderlich.
              </p>
            )}
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Störungsursache auswählen
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30 text-stone-900 font-medium"
            >
              {COMMON_REASONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Detaillierte Werkstattnotiz (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="z.B. Temperatur im Trockenraum sank unter 18°C, Charge 4B muss neu angedreht werden."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700/30 text-stone-900"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            {session?.disruption ? (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 py-1.5 px-2.5 rounded-lg hover:bg-stone-100 transition-colors"
                title="Störung entfernen und wieder auf 24 Urnen setzen"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Störung zurücksetzen</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors"
              >
                Störung speichern & nachrücken
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
