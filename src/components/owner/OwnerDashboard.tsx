import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { formatCurrency, formatHours, GERMAN_MONTHS_FULL } from '../../utils/timeCalculations';
import {
  Users,
  UserPlus,
  Calendar,
  TrendingUp,
  Download,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Clock
} from 'lucide-react';
import { AddWorkerModal } from './AddWorkerModal';

export const OwnerDashboard: React.FC<{ onNavigateToCalendar: () => void }> = ({
  onNavigateToCalendar
}) => {
  const { users, currentUser } = useAuth();
  const {
    selectedMonth,
    setSelectedMonth,
    selectedWorkerId,
    setSelectedWorkerId,
    calculations,
    settlement,
    updateSettlement,
    entries
  } = useTimeTracking();

  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);

  // Parse Year and Month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const monthName = GERMAN_MONTHS_FULL[month - 1];

  const workers = users.filter(u => u.role === 'member');
  const activeWorker = workers.find(w => w.id === selectedWorkerId) || workers[0];

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

  // CSV Export for Owner
  const handleExportCSV = () => {
    if (!activeWorker || entries.length === 0) {
      alert('Keine Einträge für diesen Zeitraum vorhanden.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Mitarbeiter;${activeWorker.displayName}\n`;
    csvContent += `Monat;${monthName} ${year}\n`;
    csvContent += `Stundensatz Mitarbeiter;${activeWorker.workerRate.toFixed(2)} EUR\n`;
    csvContent += `Verrechnungssatz AR;${activeWorker.clientRate.toFixed(2)} EUR\n\n`;
    csvContent += 'Datum;Beginn;Ende;Pause (Min);Stunden;Baustelle / Beschreibung\n';

    entries.forEach(e => {
      csvContent += `${e.date};${e.startTime};${e.endTime};${e.breakMinutes};${e.decimalHours.toFixed(2).replace('.', ',')};"${e.siteDescription}"\n`;
    });

    csvContent += `\nGesamtstunden;${calculations.totalHours.toFixed(2).replace('.', ',')}\n`;
    csvContent += `Mitarbeiter AR Gesamt;${calculations.clientTotalAmount.toFixed(2).replace('.', ',')} EUR\n`;
    csvContent += `Mitarbeiter Lohn;${calculations.workerTotalAmount.toFixed(2).replace('.', ',')} EUR\n`;
    csvContent += `Anzahlung (Abzug);-${calculations.deposit.toFixed(2).replace('.', ',')} EUR\n`;
    csvContent += `Endgueltiger Gesamtlohn;${calculations.netPayout.toFixed(2).replace('.', ',')} EUR\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Zeiterfassung_${activeWorker.displayName.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-safe-tab pt-2">
      {/* Top Banner with Month Navigation */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevMonth}
            className="ios-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Inhaber-Übersicht
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {monthName} {year}
            </h2>
          </div>

          <button
            onClick={handleNextMonth}
            className="ios-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Switcher Carousel */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Mitarbeiter auswählen ({workers.length})
            </span>
            <button
              onClick={() => setIsAddWorkerOpen(true)}
              className="ios-touch text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Neuer Arbeiter</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 ios-scroll">
            {workers.map(w => (
              <button
                key={w.id}
                onClick={() => setSelectedWorkerId(w.id)}
                className={`ios-touch px-3.5 py-2 rounded-2xl border text-xs font-bold shrink-0 transition flex items-center gap-2 ${
                  (activeWorker?.id === w.id)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    w.avatarColor || 'bg-slate-500'
                  }`}
                >
                  {w.displayName.charAt(0)}
                </div>
                <span>{w.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary Card for Selected Worker */}
      {activeWorker ? (
        <>
          <FinancialSummaryCard
            calculations={calculations}
            settlement={settlement}
            workerName={activeWorker.displayName}
            onUpdateSettlement={updateSettlement}
          />

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={onNavigateToCalendar}
              className="ios-touch p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Tageszeiten ansehen</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="ios-touch p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Abrechnung Exportieren</span>
            </button>
          </div>

          {/* Recent Entries Preview */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Erfasste Einsätze ({entries.length})
              </span>
              <button
                onClick={onNavigateToCalendar}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Alle {entries.length} Tage anzeigen →
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                In diesem Monat wurden für {activeWorker.displayName} noch keine Zeiten eingetragen.
              </div>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 5).map(e => (
                  <div
                    key={e.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{e.date}: {e.startTime} - {e.endTime}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{e.siteDescription}</div>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {formatHours(e.decimalHours)} h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-sm text-slate-500 mb-3">Noch keine Arbeiter angelegt.</p>
          <button
            onClick={() => setIsAddWorkerOpen(true)}
            className="ios-touch px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            + Ersten Arbeiter anlegen
          </button>
        </div>
      )}

      {/* Add Worker Modal */}
      <AddWorkerModal
        isOpen={isAddWorkerOpen}
        onClose={() => setIsAddWorkerOpen(false)}
      />
    </div>
  );
};
