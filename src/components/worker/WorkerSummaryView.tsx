import React, { useState } from 'react';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatHours, GERMAN_MONTHS_FULL } from '../../utils/timeCalculations';
import { t } from '../../utils/language';
import { Wallet, Clock, CheckCircle, ChevronLeft, ChevronRight, Calendar, Camera, Fuel, Banknote, X } from 'lucide-react';
import { TimeEntry } from '../../types';

export const WorkerSummaryView: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedMonth, setSelectedMonth, calculations, entries } = useTimeTracking();
  const [viewedPhotoEntry, setViewedPhotoEntry] = useState<TimeEntry | null>(null);

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
              {t('Monatsabrechnung')}
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
          {t('Deine Lohnübersicht')}
        </span>
        <h3 className="text-base font-bold text-slate-900 mb-4">{currentUser?.displayName}</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
              {t('Geleistete Stunden')}
            </span>
            <div className="text-2xl font-black text-blue-900">
              {formatHours(calculations.totalHours)} <span className="text-sm font-semibold">{t('Std.')}</span>
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              aus {entries.length} {t('Arbeitstage')}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              {t('Dein Stundenlohn')}
            </span>
            <div className="text-2xl font-black text-emerald-900">
              {formatCurrency(calculations.workerRate)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">{t('pro Stunde')}</div>
          </div>
        </div>

        {/* Calculation Details */}
        <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">{t('Grundlohn:')}</span>
            <span className="font-bold text-slate-800">{formatCurrency(calculations.workerTotalAmount)}</span>
          </div>

          {calculations.totalFuelExpenses > 0 && (
            <div className="flex items-center justify-between text-orange-600">
              <span className="font-medium flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5" />
                {t('Benzingeld-Erstattung:')}
              </span>
              <span className="font-bold">+ {formatCurrency(calculations.totalFuelExpenses)}</span>
            </div>
          )}

          {calculations.totalExpenses > 0 && (
            <div className="flex items-center justify-between text-emerald-600">
              <span className="font-medium flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                {t('Material / Auslagen-Erstattung:')}
              </span>
              <span className="font-bold">+ {formatCurrency(calculations.totalExpenses)}</span>
            </div>
          )}

          {calculations.deposit > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">{t('Bereits erhaltene Anzahlung:')}</span>
              <span className="font-bold text-red-600">
                - {formatCurrency(calculations.deposit)}
              </span>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {t('Endgültiger Gesamtlohn')}
              </div>
              <div className="text-[10px] text-slate-400">{t('Auszahlungsbetrag')}</div>
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
          <p className="text-xs text-slate-400 text-center py-4">{t('Kein Eintrag')}</p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div
                key={e.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{e.date} • {e.startTime} - {e.endTime}</span>
                    {e.photoData && (
                      <button
                        onClick={() => setViewedPhotoEntry(e)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100/80 px-1.5 py-0.5 rounded-md hover:bg-blue-200 transition"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{t('Beleg')}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{e.siteDescription}</div>
                  
                  {(e.fuelExpenses || e.expenses) && (
                    <div className="flex items-center gap-2 mt-1">
                      {e.fuelExpenses && e.fuelExpenses > 0 && (
                        <span className="text-[10px] font-semibold text-orange-600">
                          ⛽ {formatCurrency(e.fuelExpenses)}
                        </span>
                      )}
                      {e.expenses && e.expenses > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600">
                          💶 {formatCurrency(e.expenses)}
                        </span>
                      )}
                    </div>
                  )}
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

      {/* Full Size Photo Modal */}
      {viewedPhotoEntry && viewedPhotoEntry.photoData && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4"
          onClick={() => setViewedPhotoEntry(null)}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-bold">
              {viewedPhotoEntry.date} • {viewedPhotoEntry.siteDescription}
            </span>
            <button
              onClick={() => setViewedPhotoEntry(null)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <img
              src={viewedPhotoEntry.photoData}
              alt="Beleg Vollbild"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="text-center text-xs text-white/70">
            Tippe zum Schließen
          </div>
        </div>
      )}
    </div>
  );
};
