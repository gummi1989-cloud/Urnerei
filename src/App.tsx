import React, { useState } from 'react';
import { PlanProvider, usePlan } from './context/PlanContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { Header } from './components/Header';
import { CustomerSheet } from './components/CustomerSheet';
import { YearPlanSheet } from './components/YearPlanSheet';
import { WeekPlanSheet } from './components/WeekPlanSheet';
import { CustomerModal } from './components/CustomerModal';
import { VacationModal } from './components/VacationModal';
import { EntryModal } from './components/EntryModal';
import { DisruptionModal } from './components/DisruptionModal';
import { BackupModal } from './components/BackupModal';
import { Customer, DayOfWeek, TurningSession, VacationPeriod, YearPlanEntry } from './types';
import { Sparkles, Calendar, Layers, Clock, ShieldCheck, Factory } from 'lucide-react';

const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    state,
    setActiveSheet,
    setSelectedWeek,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateVacations,
  } = usePlan();

  // Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | undefined>(undefined);

  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Entry modal state for Sheet 2
  const [entryModalState, setEntryModalState] = useState<{
    isOpen: boolean;
    customerId: string;
    weekNumber: number;
    entry?: YearPlanEntry;
  }>({
    isOpen: false,
    customerId: '',
    weekNumber: 1,
  });

  // Disruption modal state for Sheet 3
  const [disruptionModalState, setDisruptionModalState] = useState<{
    isOpen: boolean;
    weekNumber: number;
    day: DayOfWeek;
    sessionNumber: number;
    session?: TurningSession;
  }>({
    isOpen: false,
    weekNumber: 1,
    day: 'Mo',
    sessionNumber: 1,
  });

  // Handlers for customer modal
  const handleOpenCustomerModal = (customer?: Customer) => {
    setSelectedCustomerForEdit(customer);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (custData: Omit<Customer, 'id'>, id?: string) => {
    if (id) {
      updateCustomer({ ...custData, id });
    } else {
      addCustomer(custData);
    }
  };

  // Handler for jumping from CustomerSheet or WeekPlan to YearPlan
  const handleJumpToYearPlanForCustomer = (customerId: string) => {
    setActiveSheet('yearPlan');
  };

  // Handler for jumping directly to WeekPlan Feinplanung
  const handleJumpToWeekPlan = (weekNumber: number) => {
    setSelectedWeek(weekNumber);
    setActiveSheet('weekPlan');
  };

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div
      className={`bg-gradient-to-br from-blue-50/40 via-slate-50 to-pink-50/35 text-stone-900 flex flex-col font-sans ${
        state.activeSheet === 'yearPlan' || state.activeSheet === 'weekPlan'
          ? 'h-screen overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* 1. Header Navigation Bar */}
      <Header
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenVacationModal={() => setIsVacationModalOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />

      {/* 2. Main Viewport Container */}
      <main
        className={`flex-1 w-full mx-auto ${
          state.activeSheet === 'yearPlan' || state.activeSheet === 'weekPlan'
            ? 'h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden px-2 sm:px-4 py-2 flex flex-col min-h-0'
            : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
        }`}
      >
        {/* Active Sheet Rendering */}
        {state.activeSheet === 'customers' && (
          <CustomerSheet
            onOpenCustomerModal={handleOpenCustomerModal}
            onJumpToYearPlan={handleJumpToYearPlanForCustomer}
          />
        )}

        {state.activeSheet === 'yearPlan' && (
          <YearPlanSheet
            onOpenVacationModal={() => setIsVacationModalOpen(true)}
            onOpenEntryModal={(customerId, weekNumber, entry) => {
              setEntryModalState({
                isOpen: true,
                customerId,
                weekNumber,
                entry,
              });
            }}
            onJumpToWeek={handleJumpToWeekPlan}
          />
        )}

        {state.activeSheet === 'weekPlan' && (
          <WeekPlanSheet
            onOpenDisruptionModal={(weekNumber, day, sessionNumber, session) => {
              setDisruptionModalState({
                isOpen: true,
                weekNumber,
                day,
                sessionNumber,
                session,
              });
            }}
            onJumpToYearPlan={() => setActiveSheet('yearPlan')}
          />
        )}
      </main>

      {/* 3. Quiet Editorial Footer (Nur auf Kundenübersicht anzeigen, damit Planer ohne Scrollen auskommen) */}
      {state.activeSheet === 'customers' && (
        <footer className="mt-auto border-t border-stone-200/80 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800">Urnerei Brühlgut</span>
              <span>·</span>
              <span>Keramische Dreharbeiten & Manufaktururnen</span>
              <span>·</span>
              <span className="font-mono">Winterthur, CH-8400</span>
            </div>

            <div className="flex items-center gap-4">
              <span>Kapazität: 192 Urnen / Woche (Mo–Mi)</span>
              <span>·</span>
              <span>Feiertage: Winterthur & Kanton Zürich</span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        customer={selectedCustomerForEdit}
        onClose={() => setIsCustomerModalOpen(false)}
        
        onDelete={deleteCustomer}
      />

      <VacationModal
        isOpen={isVacationModalOpen}
        vacations={state.vacations}
        onClose={() => setIsVacationModalOpen(false)}
        onSave={vacs => updateVacations(vacs)}
      />

      <EntryModal customer={state.customers.find((c: any) => c.id === entryModalState.customerId) || state.customers[0]} isOpen={entryModalState.isOpen}
        customerId={entryModalState.customerId}
        weekNumber={entryModalState.weekNumber}
        entry={entryModalState.entry}
        onClose={() => setEntryModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <DisruptionModal
        isOpen={disruptionModalState.isOpen}
        weekNumber={disruptionModalState.weekNumber}
        day={disruptionModalState.day}
        sessionNumber={disruptionModalState.sessionNumber}
        session={disruptionModalState.session}
        onClose={() => setDisruptionModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlanProvider>
        <MainContent />
      </PlanProvider>
    </AuthProvider>
  );
}
