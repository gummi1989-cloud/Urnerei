import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { X, Download, Upload, Copy, Check, RotateCcw, ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportDataJSON, importDataJSON, resetToDefaults, clearAllCustomersAndOrders } = usePlan();
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = exportDataJSON();
    setJsonText(data);
    setStatusMessage({ type: 'success', text: 'Produktionsdaten erfolgreich als JSON generiert.' });
  };

  const handleCopy = () => {
    const data = jsonText || exportDataJSON();
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const data = jsonText || exportDataJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urnerei-bruehlgut-produktionsplan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      setStatusMessage({ type: 'error', text: 'Bitte fügen Sie gültigen JSON-Code in das Textfeld ein.' });
      return;
    }
    const success = importDataJSON(jsonText);
    if (success) {
      setStatusMessage({ type: 'success', text: 'Produktionsdaten erfolgreich importiert und geladen!' });
      setTimeout(() => onClose(), 1200);
    } else {
      setStatusMessage({ type: 'error', text: 'Ungültiges JSON-Format. Import fehlgeschlagen.' });
    }
  };

  const [confirmAction, setConfirmAction] = useState<'none' | 'clear' | 'reset'>('none');

  const handleClearAll = () => {
    setConfirmAction('clear');
  };

  const handleReset = () => {
    setConfirmAction('reset');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Datensicherung & Import (LocalStorage)
              </h3>
              <p className="text-xs text-stone-500">
                Produktionsplan sichern, exportieren oder auf Werkseinstellungen zurücksetzen
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

        <div className="p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON anzeigen</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Datei herunterladen (.json)</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              JSON-Daten (Export / Import)
            </label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder='Klicken Sie auf "JSON anzeigen" für den Export oder fügen Sie hier gesicherten JSON-Code für den Import ein...'
              className="w-full p-3 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-stone-800"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-2">
              {confirmAction === 'clear' ? (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-rose-950 font-bold">Alles löschen?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllCustomersAndOrders();
                      setStatusMessage({ type: 'success', text: 'Alle Kunden und eingetragenen Aufträge wurden gelöscht.' });
                      setConfirmAction('none');
                      setTimeout(() => onClose(), 1200);
                    }}
                    className="font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Ja, löschen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('none')}
                    className="text-stone-600 hover:text-stone-900 px-1.5 py-0.5 cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : confirmAction === 'reset' ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
                  <span className="text-amber-950 font-bold">Auf Standard zurücksetzen?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetToDefaults();
                      setStatusMessage({ type: 'success', text: 'Erfolgreich auf Standarddaten zurückgesetzt.' });
                      setConfirmAction('none');
                      setTimeout(() => onClose(), 1200);
                    }}
                    className="font-bold text-white bg-amber-700 hover:bg-amber-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Ja, zurücksetzen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('none')}
                    className="text-stone-600 hover:text-stone-900 px-1.5 py-0.5 cursor-pointer"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-semibold py-1.5 px-2.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Löscht alle Kunden und eingetragenen Aufträge"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Alle Kunden &amp; Aufträge löschen</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium py-1.5 px-2.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Setzt die App auf Standard zurück"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Auf Standard zurücksetzen</span>
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleImport}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>JSON importieren</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
