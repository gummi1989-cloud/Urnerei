import React, { useState } from 'react';
import { VacationPeriod, DayOfWeek } from '../types';
import { X, Palmtree, Plus, Trash2, Calendar, Info } from 'lucide-react';
import { getISOWeekNumber } from '../utils/holidays';

interface VacationModalProps {
  isOpen: boolean;
  vacations: VacationPeriod[];
  onClose: () => void;
  onSave: (vacations: VacationPeriod[]) => void;
}

const getDayOfWeekFromDate = (dateString: string): DayOfWeek | undefined => {
  if (!dateString) return undefined;
  const d = new Date(dateString + 'T12:00:00');
  const day = d.getDay();
  if (day === 1) return 'Mo';
  if (day === 2) return 'Di';
  if (day === 3) return 'Mi';
  if (day === 4) return 'Do';
  if (day === 5) return 'Fr';
  return undefined;
};

export const VacationModal: React.FC<VacationModalProps> = ({
  isOpen,
  vacations,
  onClose,
  onSave,
}) => {
  const [list, setList] = useState<VacationPeriod[]>(vacations);

  if (!isOpen) return null;

  const handleUpdate = (id: string, field: keyof VacationPeriod, val: any) => {
    setList(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: val } : v))
    );
  };
  const handleUpdateSingleDate = (id: string, dateStr: string) => {
    if (!dateStr) {
      handleUpdate(id, 'dateStr', '');
      return;
    }
    const d = new Date(dateStr + 'T12:00:00');
    const kw = getISOWeekNumber(d);
    const dayOfWeek = getDayOfWeekFromDate(dateStr);
    setList(prev =>
      prev.map(v => (v.id === id ? { ...v, dateStr, startWeek: kw, endWeek: kw, dayOfWeek } : v))
    );
  };

  const handleAddWeekPeriod = () => {
    const newVac: VacationPeriod = {
      id: 'vac-' + Date.now(),
      name: 'Betriebsferien / Revisionswoche',
      startWeek: 30,
      endWeek: 31,
      type: 'summer',
      description: 'Ganze Werkstatt geschlossen',
      isSingleDay: false,
    };
    setList(prev => [...prev, newVac]);
  };

  const handleAddSingleDay = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = y + '-' + m + '-' + day;
    const kw = getISOWeekNumber(today);
    const dayOfWeek = getDayOfWeekFromDate(dateStr);

    const newDay: VacationPeriod = {
      id: 'day-' + Date.now(),
      name: 'Freier Einzeltag (z.B. Brueckentag / Betriebsausflug)',
      startWeek: kw,
      endWeek: kw,
      type: 'custom',
      description: 'Zusaetzlicher freier Arbeitstag',
      isSingleDay: true,
      dateStr,
      dayOfWeek,
    };
    setList(prev => [...prev, newDay]);
  };

  const handleDelete = (id: string) => {
    setList(prev => prev.filter(v => v.id !== id));
  };

  const handleSave = () => {
    onSave(list);
    onClose();
  };
  const weekVacations = list.filter(v => !v.isSingleDay);
  const singleDays = list.filter(v => !!v.isSingleDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Palmtree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Betriebsferien & Freie Tage
              </h3>
              <p className="text-xs text-stone-500">
                Verwaltung von Ferienwochen, Brueckentagen und Betriebsausfluegen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="g-amber-50/70 rounded-xl p-3 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900">Planungseffekt:</span> Ganze Ferienwochen setzen die Wochenkapazitaet auf 0. Freie Einzeltage an Drehtagen (Mo, Di, Mi) reduzieren die Kapazitaet analog zu Feiertagen.
            </div>
          </div>

          { /* Bereich 1: Einzelne freie Tage */ }
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Einzelne freie Tage (Brueckentage / Ausfluege)
              </h4>
              <button
                type="button"
                onClick={handleAddSingleDay}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tag hinzufuegen
              </button>
            </div>

            {singleDays.length === 0 ? (
              <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-lg border border-dashed border-stone-200">
                Keine einzelnen freien Tage hinterlegt.
              </p>
            ) : (
              singleDays.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleUpdate(item.id, 'name', e.target.value)}
                      placeholder="Bezeichnung (z.B. Auffahrtsbruecke, Betriebsausflug)"
                      className="font-bold text-xs text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-700 focus:outline-none flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Loeschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Datum</label>
                      <input
                        type="date"
                        value={item.dateStr || ''}
                        onChange={e => handleUpdateSingleDate(item.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Woche / Drehtag</label>
                      <div className="px-2 py-1 text-xs bg-stone-100 border border-stone-200 rounded font-semibold text-stone-700 flex items-center justify-between">
                        <span>KW {item.startWeek}</span>
                        <span className="text-amber-800 font-bold">{item.dayOfWeek || 'Kein Drehtag'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Notiz</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleUpdate(item.id, 'description', e.target.value)}
                        placeholder="z.B. Brueckentag nach Auffahrt"
                        className="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700 text-stone-700"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          { /* Bereich 2: Ganze Ferienwochen */ }
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Palmtree className="w-4 h-4 text-emerald-600" />
                Ganze Betriebsferien & Revisionswochen
              </h4>
              <button
                type="button"
                onClick={handleAddWeekPeriod}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Periode hinzufuegen
              </button>
            </div>

            <div className="space-y-2.5">
              {weekVacations.map(vac => (
                <div key={vac.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={vac.name}
                      onChange={e => handleUpdate(vac.id, 'name', e.target.value)}
                      className="font-bold text-xs text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-700 focus:outline-none flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(vac.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Loeschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Start-Woche</label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-stone-400 font-mono">KW</span>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={vac.startWeek}
                          onChange={e => handleUpdate(vac.id, 'startWeek', Math.min(52, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full px-2 py-1 text-xs font-mono font-bold bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">End-Woche</label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-stone-400 font-mono">KW</span>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={vac.endWeek}
                          onChange={e => handleUpdate(vac.id, 'endWeek', Math.min(52, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full px-2 py-1 text-xs font-mono font-bold bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Typ</label>
                      <select
                        value={vac.type}
                        onChange={e => handleUpdate(vac.id, 'type', e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700 font-semibold"
                      >
                        <option value="summer">Sommerferien</option>
                        <option value="winter">Weihnachtsferien</option>
                        <option value="custom">Revision / Werkstattpause</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-3.5 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Aenderungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};
