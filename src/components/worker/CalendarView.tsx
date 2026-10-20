import React, { useState, useMemo } from 'react';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { useAuth } from '../../context/AuthContext';
import { getDaysForMonth, formatHours, formatCurrency, GERMAN_MONTHS_FULL } from '../../utils/timeCalculations';
import { DayItem } from './DayItem';
import { TimeEntryModal } from './TimeEntryModal';
import { DayCalendarInfo } from '../../types';
import { t } from '../../utils/language';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, HardHat } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { selectedMonth, setSelectedMonth, entries, calculations, saveEntry, deleteEntry, selectedWorkerId } =
    useTimeTracking();
  const { currentUser, isOwner, users } = useAuth();

  const [activeDayModal, setActiveDayModal] = useState<DayCalendarInfo | null>(null);

  // Parse Year and Month
  const [year, month] = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return [y, m];
  }, [selectedMonth]);

  const monthName = GERMAN_MONTHS_FULL[month - 1];

  const days = useMemo(() => {
    return getDaysForMonth(selectedMonth, entries);
  }, [selectedMonth, entries]);

  const handlePrevMonth = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const monthPad = newMonth.toString().padStart(2, '0');
    setSelectedMonth(`${newYear}-${monthPad}`);
  };

  const handleNextMonth = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const monthPad = newMonth.toString().padStart(2, '0');
    setSelectedMonth(`${newYear}-${monthPad}`);
  };

  // Find who we are viewing (if owner is inspecting an employee)
  const inspectedUser = isOwner
    ? users.find(u => u.id === selectedWorkerId)
    : currentUser;

  return (
    <div className="max-w-md mx-auto px-4 pb-safe-tab">
      {/* Month Navigator Header */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 mb-4 mt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="ios-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Vorheriger Monat"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{t('Zeiterfassung')}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {monthName} {year}
            </h2>
          </div>

          <button
            onClick={handleNextMonth}
            className="ios-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Nächster Monat"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Info when in Owner mode */}
        {isOwner && inspectedUser && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Zeiten für Mitarbeiter:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <HardHat className="w-3.5 h-3.5 text-blue-600" />
              {inspectedUser.displayName}
            </span>
          </div>
        )}

        {/* Monthly Summary Quick Pills */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              {t('Monatsstunden')}
            </span>
            <span className="text-xl font-black text-blue-900">
              {formatHours(calculations.totalHours)} <span className="text-xs font-semibold">{t('Std.')}</span>
            </span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              {t('Arbeitstage')}
            </span>
            <span className="text-xl font-black text-emerald-900">
              {entries.length} <span className="text-xs font-semibold">{t('Tage')}</span>
            </span>
          </div>
        </div>

        {/* Optional Spesen Pill if fuel/expenses present */}
        {(calculations.totalFuelExpenses > 0 || calculations.totalExpenses > 0) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs px-1">
            {calculations.totalFuelExpenses > 0 && (
              <span className="text-orange-600 font-bold">
                ⛽ {t('Benzin:')} {formatCurrency(calculations.totalFuelExpenses)}
              </span>
            )}
            {calculations.totalExpenses > 0 && (
              <span className="text-emerald-600 font-bold">
                💶 {t('Auslagen:')} {formatCurrency(calculations.totalExpenses)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Days List (1 to 30/31) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tagesübersicht ({monthName})
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Tippe auf einen Tag zum Eintragen
          </span>
        </div>

        {days.map(dayInfo => (
          <DayItem
            key={dayInfo.date}
            dayInfo={dayInfo}
            onClick={() => setActiveDayModal(dayInfo)}
          />
        ))}
      </div>

      {/* Time Entry Modal */}
      {activeDayModal && (
        <TimeEntryModal
          isOpen={true}
          onClose={() => setActiveDayModal(null)}
          dateIso={activeDayModal.date}
          formattedDateStr={activeDayModal.formattedDate}
          existingEntry={activeDayModal.entry}
          onSave={saveEntry}
          onDelete={deleteEntry}
        />
      )}
    </div>
  );
};
