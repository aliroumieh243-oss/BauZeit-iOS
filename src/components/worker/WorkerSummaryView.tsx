import React from 'react';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatHours, GERMAN_MONTHS_FULL } from '../../utils/timeCalculations';
import { Wallet, Clock, CheckCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const WorkerSummaryView: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedMonth, setSelectedMonth, calculations, entries } = useTimeTracking();

  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const monthName = GERMAN_MONTHS_FULL[month - 1];

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

  return (
    <div className="max-w-md mx-auto px-4 pb-safe-tab pt-2 space-y-4">
      {/* Month Navigator Header */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="ios-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Monatsabrechnung
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
      </div>

      {/* Wage Overview Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Deine Lohnabrechnung
        </span>
        <h3 className="text-base font-bold text-slate-900 mb-4">{currentUser?.displayName}</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
              Geleistete Stunden
            </span>
            <div className="text-2xl font-black text-blue-900">
              {formatHours(calculations.totalHours)} <span className="text-sm font-semibold">h</span>
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              aus {entries.length} Arbeitstagen
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Dein Stundensatz
            </span>
            <div className="text-2xl font-black text-emerald-900">
              {formatCurrency(calculations.workerRate)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">pro Arbeitsstunde</div>
          </div>
        </div>

        {/* Calculation Details */}
        <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Lohn vor Anzahlung ({formatHours(calculations.totalHours)} h × {formatCurrency(calculations.workerRate)}):</span>
            <span className="font-bold text-slate-800">{formatCurrency(calculations.workerTotalAmount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Bereits erhaltene Anzahlung:</span>
            <span className="font-bold text-red-600">
              - {formatCurrency(calculations.deposit)}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Endgültiger Gesamtlohn
              </div>
              <div className="text-[10px] text-slate-400">Zur Auszahlung an dich</div>
            </div>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(calculations.netPayout)}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown list of entries */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Alle Einsätze im {monthName} ({entries.length})
        </h4>

        {entries.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Keine Einträge für diesen Monat.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div
                key={e.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{e.date} • {e.startTime} - {e.endTime} Uhr</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{e.siteDescription}</div>
                </div>
                <div className="text-right">
                  <span className="font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                    {formatHours(e.decimalHours)} h
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
