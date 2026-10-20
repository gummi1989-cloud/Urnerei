import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Customer, DayOfWeek, TurningSession, VacationPeriod, YearPlanEntry, RevisionEntry } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_VACATIONS, INITIAL_REVISIONS, generateInitialSessionOverrides, generateInitialYearPlan } from '../utils/mockData';
import { getISOWeekNumber } from '../utils/holidays';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'urnenmanufaktur_production_plan_v2';
const PLAN_DOC_REF = doc(db, 'production_plan', 'current');

const cleanForFirestore = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

interface PlanContextType {
  state: AppState;
  setActiveSheet: (sheet: 'yearPlan' | 'weekPlan' | 'customers') => void;
  setSelectedWeek: (week: number) => void;
  setYear: (year: number) => void;
  goToToday: () => void;
  addCustomer: (cust: Omit<Customer, 'id'>) => void;
  updateCustomer: (cust: Customer) => void;
  deleteCustomer: (id: string) => void;
  addOrUpdateYearPlanEntry: (customerId: string, weekNumber: number, typeA: number, typeB: number, plates: number, notes?: string) => void;
  moveYearPlanEntry: (entryId: string, targetWeek: number) => void;
  deleteYearPlanEntry: (entryId: string) => void;
  addOrUpdateRevision: (weekNumber: number, title?: string, notes?: string) => void;
  moveRevision: (revisionId: string, targetWeek: number) => void;
  deleteRevision: (revisionId: string) => void;
  updateVacations: (vacations: VacationPeriod[]) => void;
  recordSessionDisruption: (
    weekNumber: number,
    day: DayOfWeek,
    sessionNumber: number,
    effectiveCount: number,
    reason: string,
    notes?: string
  ) => void;
  updateSessionDetails: (
    slotKey: string,
    weekNumber: number,
    day: DayOfWeek,
    sessionNumber: number,
    details: Partial<TurningSession>
  ) => void;
  resetSessionOverride: (slotKey: string) => void;
  clearAllCustomersAndOrders: () => void;
  resetToDefaults: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customers && parsed.yearPlanEntries) {
          return {
            year: parsed.year || 2026,
            activeSheet: parsed.activeSheet || 'yearPlan',
            selectedWeek: parsed.selectedWeek || 16,
            customers: parsed.customers,
            yearPlanEntries: parsed.yearPlanEntries,
            vacations: parsed.vacations || INITIAL_VACATIONS,
            revisions: parsed.revisions || INITIAL_REVISIONS,
            sessionOverrides: parsed.sessionOverrides || generateInitialSessionOverrides(),
          };
        }
      }
    } catch (e) {
      console.warn('Fehler beim Laden aus localStorage', e);
    }

    return {
      year: 2026,
      activeSheet: 'yearPlan',
      selectedWeek: 16,
      customers: INITIAL_CUSTOMERS,
      yearPlanEntries: generateInitialYearPlan(),
      vacations: INITIAL_VACATIONS,
      revisions: INITIAL_REVISIONS,
      sessionOverrides: generateInitialSessionOverrides(),
    };
  });

  // Live-Sync mit Firebase Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(PLAN_DOC_REF, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<AppState>;
        setState(prev => ({
          ...prev,
          customers: data.customers || prev.customers,
          yearPlanEntries: data.yearPlanEntries || prev.yearPlanEntries,
          vacations: data.vacations || prev.vacations,
          revisions: data.revisions || prev.revisions,
          sessionOverrides: data.sessionOverrides || prev.sessionOverrides,
          year: data.year || prev.year,
        }));
      } else {
        setDoc(PLAN_DOC_REF, cleanForFirestore({
            year: state.year,
            customers: state.customers,
            yearPlanEntries: state.yearPlanEntries,
            vacations: state.vacations,
            revisions: state.revisions,
            sessionOverrides: state.sessionOverrides,
          })).catch(err => console.error('Firestore init error:', err));
      }
    }, (error) => {
      console.warn('Firestore offline oder Berechtigungsfehler, nutze lokalen Cache:', error);
    });

    return () => unsubscribe();
  }, []);

  const syncState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      setDoc(PLAN_DOC_REF, cleanForFirestore({
          year: next.year,
          customers: next.customers,
          yearPlanEntries: next.yearPlanEntries,
          vacations: next.vacations,
          revisions: next.revisions,
          sessionOverrides: next.sessionOverrides,
        }), { merge: true }).catch(err => console.error('Firestore sync error:', err));
      return next;
    });
  };

  const setActiveSheet = (sheet: 'customers' | 'yearPlan' | 'weekPlan') => {
    setState(prev => ({ ...prev, activeSheet: sheet }));
  };

  const setSelectedWeek = (week: number) => {
    const clamped = Math.max(1, Math.min(52, week));
    setState(prev => ({ ...prev, selectedWeek: clamped }));
  };

  const setYear = (year: number) => {
    syncState(prev => ({ ...prev, year }));
  };

  const addCustomer = (cust: Omit<Customer, 'id'>) => {
    const newCust: Customer = {
      ...cust,
      id: `cust-${Date.now()}`,
    };
    syncState(prev => ({
      ...prev,
      customers: [...prev.customers, newCust],
    }));
  };

  const updateCustomer = (cust: Customer) => {
    syncState(prev => ({
      ...prev,
      customers: prev.customers.map(c => (c.id === cust.id ? cust : c)),
    }));
  };

  const deleteCustomer = (id: string) => {
    syncState(prev => {
      const updatedOverrides = { ...prev.sessionOverrides };
      Object.keys(updatedOverrides).forEach(key => {
        if (updatedOverrides[key].customerId === id) {
          const copy = { ...updatedOverrides[key] };
          delete copy.customerId;
          updatedOverrides[key] = copy;
        }
      });

      return {
        ...prev,
        customers: prev.customers.filter(c => c.id !== id),
        yearPlanEntries: prev.yearPlanEntries.filter(e => e.customerId !== id),
        sessionOverrides: updatedOverrides,
      };
    });
  };

  const addOrUpdateYearPlanEntry = (
    customerId: string,
    weekNumber: number,
    typeA: number,
    typeB: number,
    plates: number,
    notes?: string
  ) => {
    syncState(prev => {
      const existingIndex = prev.yearPlanEntries.findIndex(
        e => e.customerId === customerId && e.weekNumber === weekNumber && (e.year ?? 2026) === prev.year
      );

      if (existingIndex >= 0) {
        const updated = [...prev.yearPlanEntries];
        if (typeA === 0 && typeB === 0 && plates === 0) {
          updated.splice(existingIndex, 1);
        } else {
          updated[existingIndex] = {
            ...updated[existingIndex],
            typeA,
            typeB,
            plates,
            notes: notes !== undefined ? notes : updated[existingIndex].notes,
          };
        }
        return { ...prev, yearPlanEntries: updated };
      }

      if (typeA > 0 || typeB > 0 || plates > 0) {
        const newEntry: YearPlanEntry = {
          id: `ype-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          customerId,
          year: prev.year, weekNumber, typeA, typeB, plates,
          notes,
        };
        return { ...prev, yearPlanEntries: [...prev.yearPlanEntries, newEntry] };
      }

      return prev;
    });
  };

  const moveYearPlanEntry = (entryId: string, targetWeek: number) => {
    syncState(prev => {
      const entry = prev.yearPlanEntries.find(e => e.id === entryId);
      if (!entry) return prev;

      const existingTarget = prev.yearPlanEntries.find(
        e => e.customerId === entry.customerId && e.weekNumber === targetWeek && (e.year ?? 2026) === (entry.year ?? 2026) && e.id !== entryId
      );

      if (existingTarget) {
        return {
          ...prev,
          yearPlanEntries: prev.yearPlanEntries
            .filter(e => e.id !== entryId)
            .map(e =>
              e.id === existingTarget.id
                ? {
                    ...e,
                    typeA: e.typeA + entry.typeA,
                    typeB: e.typeB + entry.typeB,
                    plates: e.plates + entry.plates,
                  }
                : e
            ),
        };
      }

      return {
        ...prev,
        yearPlanEntries: prev.yearPlanEntries.map(e =>
          e.id === entryId ? { ...e, weekNumber: targetWeek } : e
        ),
      };
    });
  };

  const deleteYearPlanEntry = (entryId: string) => {
    syncState(prev => ({
      ...prev,
      yearPlanEntries: prev.yearPlanEntries.filter(e => e.id !== entryId),
    }));
  };

  const addOrUpdateRevision = (weekNumber: number, title?: string, notes?: string) => {
    syncState(prev => {
      const existing = prev.revisions.find(r => r.weekNumber === weekNumber);
      if (existing) {
        return {
          ...prev,
          revisions: prev.revisions.map(r =>
            r.id === existing.id
              ? { ...r, title: title || r.title, notes: notes !== undefined ? notes : r.notes }
              : r
          ),
        };
      }
      const newRev: RevisionEntry = {
        id: `rev-${Date.now()}`,
        weekNumber,
        title: title || 'Ofen- & Werkstattrevision',
        notes: notes || 'Maschinen- & Ofenservice',
        type: 'general',
      };
      return {
        ...prev,
        revisions: [...prev.revisions, newRev],
      };
    });
  };

  const moveRevision = (revisionId: string, targetWeek: number) => {
    syncState(prev => ({
      ...prev,
      revisions: prev.revisions.map(r =>
        r.id === revisionId ? { ...r, weekNumber: targetWeek } : r
      ),
    }));
  };

  const deleteRevision = (revisionId: string) => {
    syncState(prev => ({
      ...prev,
      revisions: prev.revisions.filter(r => r.id !== revisionId),
    }));
  };

  const updateVacations = (vacations: VacationPeriod[]) => {
    syncState(prev => ({ ...prev, vacations }));
  };

  const recordSessionDisruption = (
    weekNumber: number,
    day: DayOfWeek,
    sessionNumber: number,
    effectiveCount: number,
    reason: string,
    notes?: string
  ) => {
    const slotKey = `${weekNumber}_${day}_${sessionNumber}`;
    const targetCount = 24;
    const clampedEffective = Math.max(0, Math.min(targetCount, effectiveCount));
    const shortfall = targetCount - clampedEffective;

    syncState(prev => {
      const currentOverrides = { ...prev.sessionOverrides };

      currentOverrides[slotKey] = {
        id: `sess-${slotKey}`,
        weekNumber,
        day,
        sessionNumber,
        targetCount,
        effectiveCount: clampedEffective,
        productType: 'Urne hart',
        disruption: {
          reason: reason || 'Produktionsstörung / Werkstattverzögerung',
          targetCount,
          effectiveCount: clampedEffective,
          shortfall,
          reportedAt: `KW ${weekNumber} ${day} (Session ${sessionNumber})`,
          notes,
        },
        notes,
      };

      if (shortfall > 0) {
        const dayOrder: DayOfWeek[] = ['Mo', 'Di', 'Mi'];
        const currentDayIdx = dayOrder.indexOf(day);

        let nextWeek = weekNumber;
        let nextDay: DayOfWeek = day;
        let nextSessionNum = sessionNumber + 1;

        if (nextSessionNum > 3 || (day === 'Mi' && nextSessionNum > 3)) {
          if (currentDayIdx < 2) {
            nextDay = dayOrder[currentDayIdx + 1];
            nextSessionNum = 1;
          } else {
            nextWeek = weekNumber < 52 ? weekNumber + 1 : 1;
            nextDay = 'Mo';
            nextSessionNum = 1;
          }
        }

        const nextSlotKey = `${nextWeek}_${nextDay}_${nextSessionNum}`;
        const existingNext = currentOverrides[nextSlotKey] || {
          id: `sess-${nextSlotKey}`,
          weekNumber: nextWeek,
          day: nextDay,
          sessionNumber: nextSessionNum,
          targetCount: 24,
          effectiveCount: 24,
          productType: 'Urne hart',
        };

        currentOverrides[nextSlotKey] = {
          ...existingNext,
          carriedOverShortfall: {
            sourceSessionId: slotKey,
            sourceDay: day,
            sourceWeek: weekNumber,
            amount: shortfall,
          },
          notes: `Nachrück-Charge: +${shortfall} Urnen übernommen aus KW ${weekNumber} ${day} (Session ${sessionNumber}).`,
        };
      }

      return {
        ...prev,
        sessionOverrides: currentOverrides,
      };
    });
  };

  const updateSessionDetails = (
    slotKey: string,
    weekNumber: number,
    day: DayOfWeek,
    sessionNumber: number,
    details: Partial<TurningSession>
  ) => {
    syncState(prev => {
      const current = prev.sessionOverrides[slotKey] || {
        id: `sess-${slotKey}`,
        weekNumber,
        day,
        sessionNumber,
        targetCount: 24,
        effectiveCount: 24,
        productType: 'Urne hart',
      };

      let derivedProductType = details.productType || current.productType;
      const targetCustId = details.customerId !== undefined ? details.customerId : current.customerId;
      if (targetCustId) {
        const assignedCust = prev.customers.find(cu => cu.id === targetCustId);
        if (assignedCust) {
          const pType = assignedCust.productType || (assignedCust.targetPlates > 0 ? 'plaettli' : (assignedCust.targetB > 0 ? 'loeslich' : 'hart'));
          derivedProductType = (pType === 'plaettli' ? 'Gemischt' : (pType === 'loeslich' ? 'Urne löslich' : 'Urne hart')) as any;
        }
      }
      return {
        ...prev,
        sessionOverrides: {
          ...prev.sessionOverrides,
          [slotKey]: {
            ...current,
            ...details,
            productType: derivedProductType,
          },
        },
      };
    });
  };

  const resetSessionOverride = (slotKey: string) => {
    syncState(prev => {
      const updated = { ...prev.sessionOverrides };
      delete updated[slotKey];
      return { ...prev, sessionOverrides: updated };
    });
  };

  const clearAllCustomersAndOrders = () => {
    syncState(prev => ({
      ...prev,
      customers: [],
      yearPlanEntries: [],
      sessionOverrides: {},
    }));
  };

  const resetToDefaults = () => {
    const fresh: AppState = {
      year: 2026,
      activeSheet: 'yearPlan',
      selectedWeek: 16,
      customers: INITIAL_CUSTOMERS,
      yearPlanEntries: generateInitialYearPlan(),
      vacations: INITIAL_VACATIONS,
      revisions: INITIAL_REVISIONS,
      sessionOverrides: generateInitialSessionOverrides(),
    };
    syncState(() => fresh);
  };

  const exportDataJSON = () => {
    return JSON.stringify(state, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.customers) && Array.isArray(parsed.yearPlanEntries)) {
        syncState(prev => ({
          ...prev,
          year: parsed.year || 2026,
          activeSheet: parsed.activeSheet || 'yearPlan',
          selectedWeek: parsed.selectedWeek || 16,
          customers: parsed.customers,
          yearPlanEntries: parsed.yearPlanEntries,
          vacations: parsed.vacations || INITIAL_VACATIONS,
          revisions: parsed.revisions || INITIAL_REVISIONS,
          sessionOverrides: parsed.sessionOverrides || {},
        }));
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON for import', e);
    }
    return false;
  };

  const goToToday = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = Math.min(52, Math.max(1, getISOWeekNumber(now)));
    setState(prev => ({
      ...prev,
      year: currentYear,
      selectedWeek: currentWeek,
    }));
  };

  return (
    <PlanContext.Provider
      value={{
        state,
        setActiveSheet,
        setSelectedWeek,
        setYear,
        goToToday,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addOrUpdateYearPlanEntry,
        moveYearPlanEntry,
        deleteYearPlanEntry,
        addOrUpdateRevision,
        moveRevision,
        deleteRevision,
        updateVacations,
        recordSessionDisruption,
        updateSessionDetails,
        resetSessionOverride,
        clearAllCustomersAndOrders,
        resetToDefaults,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};