import React, { useState, useEffect } from 'react';
import { Customer, ProductType } from '../types';
import { usePlan } from '../context/PlanContext';
import { X, Trash2, Check } from 'lucide-react';

const COLOR_PALETTE = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#16A34A', '#0D9488', '#0891B2', '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777', '#E11D48', '#475569'];

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  onDelete?: (customerId: string) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer, onDelete }) => {
  const { addCustomer, updateCustomer } = usePlan();
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productType, setProductType] = useState<ProductType>('hart');
  const [targetQuantity, setTargetQuantity] = useState<number>(100);
  const [accentColor, setAccentColor] = useState(COLOR_PALETTE[0]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setShortName(customer.shortName);
      setContactPerson(customer.contactPerson);
      setEmail(customer.email);
      setPhone(customer.phone);
      setProductType(customer.productType || 'hart');
      setTargetQuantity(customer.targetQuantity ?? (customer.productType === 'plaettli' ? customer.targetPlates : (customer.productType === 'loeslich' ? customer.targetB : (customer.targetA || 100))));
      setAccentColor(customer.accentColor || COLOR_PALETTE[0]);
    } else {
      setName(''); setShortName(''); setContactPerson(''); setEmail(''); setPhone(''); setProductType('hart'); setTargetQuantity(100); setAccentColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
    }
    setIsDeleteConfirmOpen(false);
  }, [customer, isOpen]);

  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const short = shortName.trim() || name.substring(0, 3).toUpperCase();
    const qty = Number(targetQuantity) || 0;
    const data = {
      name: name.trim(), shortName: short, contactPerson: contactPerson.trim(), email: email.trim(), phone: phone.trim(), productType, targetQuantity: qty,
      targetA: productType === 'hart' ? qty : 0, targetB: productType === 'loeslich' ? qty : 0, targetPlates: productType === 'plaettli' ? qty : 0, accentColor,
    };
    if (customer) {
      updateCustomer({ ...data, id: customer.id });
    } else {
      addCustomer(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base font-bold text-stone-900">{customer ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-stone-700 mb-1">Kundenname *</label><input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="z. B. Krematorium Nord" className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-stone-700 mb-1">Kuerzel (Kachel)</label><input type="text" maxLength={5} value={shortName} onChange={e => setShortName(e.target.value.toUpperCase())} placeholder="z. B. KRN" className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg font-mono text-stone-900" /></div>
              <div><label className="block text-xs font-semibold text-stone-700 mb-1">Ansprechperson</label><input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="z. B. Herr Meier" className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-stone-700 mb-1">Telefon</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+41 52 ..." className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900" /></div>
              <div><label className="block text-xs font-semibold text-stone-700 mb-1">E-Mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kontakt@partner.ch" className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-900" /></div>
            </div>
          </div>
          <div className="space-y-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div><label className="block text-xs font-bold text-stone-700 mb-1">Produkttyp *</label><div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setProductType('hart')} className={`py-2 px-2 text-xs font-bold rounded-lg border-2 transition-all ${productType === 'hart' ? 'bg-amber-100 border-amber-600 text-amber-950 shadow-xs ring-2 ring-amber-500/30 font-black' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>Urnen hart</button><button type="button" onClick={() => setProductType('loeslich')} className={`py-2 px-2 text-xs font-bold rounded-lg border-2 transition-all ${productType === 'loeslich' ? 'bg-sky-100 border-sky-600 text-sky-950 shadow-xs ring-2 ring-sky-500/30 font-black' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>Urnen loeslich</button><button type="button" onClick={() => setProductType('plaettli')} className={`py-2 px-2 text-xs font-bold rounded-lg border-2 transition-all ${productType === 'plaettli' ? 'bg-emerald-100 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-500/30 font-black' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>Tonplaettli</button></div></div>
            <div><label className="block text-xs font-bold text-stone-700 mb-1">Jahressoll (Stueck) *</label><input type="number" min="0" step="1" value={targetQuantity} onChange={e => setTargetQuantity(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-3 py-2 text-sm font-bold font-mono bg-white border border-stone-300 rounded-lg text-stone-900" /></div>
          </div>
          <div className="pt-2"><div className="flex items-center justify-between mb-1.5"><label className="block text-xs font-semibold text-stone-700">Kundenfarbe</label><span className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: accentColor }} /></div><div className="grid grid-cols-8 gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200">{COLOR_PALETTE.map(c => (<button key={c} type="button" onClick={() => setAccentColor(c)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: c }}>{accentColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}</button>))}</div></div>
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-100"><div>{customer && onDelete && (isDeleteConfirmOpen ? (<div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs"><span className="text-rose-950 font-bold">Wirklich loeschen?</span><button type="button" onClick={() => { onDelete(customer.id); onClose(); }} className="font-bold text-white bg-rose-600 px-2 py-0.5 rounded">Ja</button><button type="button" onClick={() => setIsDeleteConfirmOpen(false)} className="text-stone-600 px-1.5 py-0.5">Nein</button></div>) : (<button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-rose-600" /><span>Loeschen</span></button>))}</div><div className="flex items-center justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg">Abbrechen</button><button type="submit" className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">{customer ? 'Speichern' : 'Kunde anlegen'}</button></div></div>
        </form>
      </div>
    </div>
  );
};
