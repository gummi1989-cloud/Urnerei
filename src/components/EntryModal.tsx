import React, { useState, useEffect } from 'react';
import { Customer, YearPlanEntry } from '../types';
import { usePlan } from '../context/PlanContext';
import { X, Trash2 } from 'lucide-react';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customer: Customer;
  weekNumber: number;
  entry?: YearPlanEntry;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customer,
  weekNumber,
  entry,
}) => {
  const { state, addOrUpdateYearPlanEntry, deleteYearPlanEntry } = usePlan();
  const activeCustomer = customer || state.customers.find(cu => cu.id === customerId);
  const isPlates = activeCustomer?.productType === 'plaettli';

  const [amount, setAmount] = useState<number>(isPlates ? 500 : 24);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (entry) {
      const total = entry.amount ?? ((entry.typeA || 0) + (entry.typeB || 0) + (entry.plates || 0));
      setAmount(total);
      setNotes(entry.notes || '');
    } else {
      setAmount(isPlates ? 500 : 24);
      setNotes('');
    }
  }, [entry, isOpen, isPlates]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount) || 0;
    const pType = activeCustomer?.productType || 'hart';
    const a = pType === 'hart' ? num : 0;
    const b = pType === 'loeslich' ? num : 0;
    const pl = pType === 'plaettli' ? num : 0;
    addOrUpdateYearPlanEntry(customerId, weekNumber, a, b, pl, notes);
    onClose();
  };

  const handleDelete = () => {
    if (entry?.id) {
      deleteYearPlanEntry(entry.id);
    } else {
      const found = state.yearPlanEntries.find(
        e => e.customerId === customerId && e.weekNumber === weekNumber && (e.year ?? 2026) === (state.year ?? 2026)
      );
      if (found) deleteYearPlanEntry(found.id);
    }
    onClose();
  };

  const labelType = activeCustomer?.productType === 'plaettli'
    ? 'Tonplaettli'
    : activeCustomer?.productType === 'loeslich'
    ? 'Urnen loeslich'
    : 'Urnen hart';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="text-base font-bold text-stone-900">KW {weekNumber} planen</h3>
            <p className="text-xs text-stone-500">{(activeCustomer?.name || 'Kunde')} ({(activeCustomer?.shortName || '')})</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-stone-700">Geplante Anzahl (Stk.)</label>
                <span className="text-[11px] text-stone-500 font-mono">Typ: <strong className="text-stone-800">{labelType}</strong></span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-lg font-bold font-mono bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
              {!isPlates && (
                <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                  {[24, 48, 72, 96, 120, 144, 168, 192].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="flex-1 py-1 text-xs font-bold rounded bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Notiz / Bemerkung</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="z. B. Sonderglasur oder Abholung..."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-700/30"
              />
            </div>
          </div>
          <div className="pt-3 flex items-center justify-between border-t border-stone-100">
            <div>
              {entry && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eintrag loeschen</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Abbrechen</button>
              <button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Speichern</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};