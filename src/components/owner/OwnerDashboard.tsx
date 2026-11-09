import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { formatCurrency, formatHours, GERMAN_MONTHS_FULL } from '../../utils/timeCalculations';
import { t } from '../../utils/language';
import {
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Camera,
  X,
  PlusCircle,
  Edit2,
  BarChart3,
  Table
} from 'lucide-react';
import { AddWorkerModal } from './AddWorkerModal';
import { MonthlyDocumentModal } from './MonthlyDocumentModal';
import { TimeEntryModal } from '../worker/TimeEntryModal';
import { TimeEntry } from '../../types';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export const OwnerDashboard: React.FC<{ onNavigateToCalendar: () => void }> = ({
  onNavigateToCalendar
}) => {
  const { users } = useAuth();
  const {
    selectedMonth,
    setSelectedMonth,
    selectedWorkerId,
    setSelectedWorkerId,
    calculations,
    settlement,
    updateSettlement,
    entries,
    allMonthEntries,
    allMonthSettlements,
    saveEntry,
    deleteEntry
  } = useTimeTracking();

  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL'>('SINGLE');
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isMonthlyDocOpen, setIsMonthlyDocOpen] = useState(false);
  const [viewedPhotoEntry, setViewedPhotoEntry] = useState<TimeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ dateIso: string; entry?: TimeEntry } | null>(null);

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

  // Compute All Workers Summary for "Alle (Gesamt)" view
  const allWorkersSummary = workers.map(w => {
    const wEntries = allMonthEntries.filter(e => e.userId === w.id);
    const wSettlement = allMonthSettlements.find(s => s.userId === w.id && s.month === selectedMonth);
    const wHours = wEntries.reduce((s, e) => s + (e.decimalHours || 0), 0);
    const wFuel = wEntries.reduce((s, e) => s + (e.fuelExpenses || 0), 0);
    const wExp = wEntries.reduce((s, e) => s + (e.expenses || 0), 0);
    const workerRate = wSettlement?.customWorkerRate ?? w.workerRate ?? 12;
    const clientRate = wSettlement?.customClientRate ?? w.clientRate ?? 35;
    const deposit = wSettlement?.deposit || 0;
    const baseWage = wHours * workerRate;
    const clientAR = wHours * clientRate;
    const netPayout = baseWage + wFuel + wExp - deposit;

    return {
      worker: w,
      days: wEntries.length,
      hours: wHours,
      workerRate,
      clientRate,
      baseWage,
      clientAR,
      fuel: wFuel,
      expenses: wExp,
      deposit,
      netPayout
    };
  });

  const companyTotals = allWorkersSummary.reduce(
    (acc, r) => ({
      days: acc.days + r.days,
      hours: acc.hours + r.hours,
      clientAR: acc.clientAR + r.clientAR,
      baseWage: acc.baseWage + r.baseWage,
      fuel: acc.fuel + r.fuel,
      expenses: acc.expenses + r.expenses,
      deposit: acc.deposit + r.deposit,
      netPayout: acc.netPayout + r.netPayout
    }),
    { days: 0, hours: 0, clientAR: 0, baseWage: 0, fuel: 0, expenses: 0, deposit: 0, netPayout: 0 }
  );

  return (
    <div className="max-w-md mx-auto px-4 pb-safe-tab pt-2">
      {/* Top Banner with Month Navigation & Quick Month Strip */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between mb-2.5">
          <button
            onClick={handlePrevMonth}
            className="ios-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              {t('Inhaber-Übersicht')}
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

        {/* Quick Month Selector Strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-100 ios-scroll">
          {SHORT_MONTHS.map((mLabel, idx) => {
            const mNum = String(idx + 1).padStart(2, '0');
            const mIso = `${year}-${mNum}`;
            const isSelected = selectedMonth === mIso;
            return (
              <button
                key={mIso}
                onClick={() => setSelectedMonth(mIso)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mLabel} '{String(year).slice(-2)}
              </button>
            );
          })}
        </div>

        {/* Worker Switcher Carousel with "Alle (Gesamt)" */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Abrechnung wechseln ({workers.length})
            </span>
            <button
              onClick={() => setIsAddWorkerOpen(true)}
              className="ios-touch text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ {t('Arbeiter')}</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 ios-scroll">
            <button
              onClick={() => setViewMode('ALL')}
              className={`ios-touch px-3.5 py-2 rounded-2xl border text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                viewMode === 'ALL'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Alle ({workers.length})</span>
            </button>

            {workers.map(w => {
              const wHours = allMonthEntries
                .filter(e => e.userId === w.id)
                .reduce((s, e) => s + (e.decimalHours || 0), 0);
              const isSelected = viewMode === 'SINGLE' && activeWorker?.id === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setViewMode('SINGLE');
                    setSelectedWorkerId(w.id);
                  }}
                  className={`ios-touch px-3.5 py-2 rounded-2xl border text-xs font-bold shrink-0 transition flex items-center gap-2 ${
                    isSelected
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
                  <span className="text-[10px] opacity-80">({formatHours(wHours)}h)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KI-Monatsdokument & Echte Tabellen-Export Highlight Button */}
      <div className="mb-4">
        <button
          onClick={() => setIsMonthlyDocOpen(true)}
          className="ios-touch w-full p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Table className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black tracking-tight uppercase text-blue-100">
                KI-Monatsdokument & Echte Tabelle
              </div>
              <div className="text-xs text-white font-bold">
                Echte Tabelle ansehen & als Excel (.xls) / CSV exportieren
              </div>
            </div>
          </div>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-xl">
            Tabelle →
          </span>
        </button>
      </div>

      {viewMode === 'ALL' ? (
        /* ALL WORKERS COMPANY OVERVIEW & TABLE */
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 mb-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Gesamtbetrieb • Alle Mitarbeiter
              </span>
              <h3 className="text-base font-black text-slate-900">
                {monthName} {year} ({workers.length} Mitarbeiter)
              </h3>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              {formatHours(companyTotals.hours)} h
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70">
              <div className="text-[10px] font-bold uppercase text-blue-700">Kunden-AR Gesamt</div>
              <div className="text-lg font-black text-blue-900 mt-0.5">
                {formatCurrency(companyTotals.clientAR)}
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">{companyTotals.days} Einsatztage</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
              <div className="text-[10px] font-bold uppercase text-emerald-700">Auszahlung Gesamt</div>
              <div className="text-lg font-black text-emerald-900 mt-0.5">
                {formatCurrency(companyTotals.netPayout)}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Inkl. Spesen & Anzahlung</div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-bold text-slate-700">
              Mitarbeiter-Abrechnungen (Antippen zum Bearbeiten):
            </div>
            {allWorkersSummary.map(row => (
              <div
                key={row.worker.id}
                onClick={() => {
                  setSelectedWorkerId(row.worker.id);
                  setViewMode('SINGLE');
                }}
                className="cursor-pointer p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 flex items-center justify-between transition"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{row.worker.displayName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatHours(row.hours)} h ({row.days} Tage) • Lohn: {formatCurrency(row.workerRate)}/h
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-emerald-700">
                    {formatCurrency(row.netPayout)}
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 flex items-center justify-end gap-1">
                    <span>Bearbeiten</span>
                    <Edit2 className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeWorker ? (
        <>
          <FinancialSummaryCard
            calculations={calculations}
            settlement={settlement}
            workerName={activeWorker.displayName}
            entryCount={entries.length}
            onUpdateSettlement={updateSettlement}
          />

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={onNavigateToCalendar}
              className="ios-touch p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t('Tageszeiten ansehen')}</span>
            </button>

            <button
              onClick={() => setIsMonthlyDocOpen(true)}
              className="ios-touch p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center gap-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{t('Abrechnung Exportieren')}</span>
            </button>
          </div>

          {/* Editable Entries List */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('Erfasste Einsätze')} ({entries.length})
              </span>
              <button
                onClick={() =>
                  setEditingEntry({
                    dateIso: `${selectedMonth}-01`,
                    entry: undefined
                  })
                }
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tag eintragen</span>
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <p>In diesem Monat wurden für {activeWorker.displayName} noch keine Zeiten eingetragen.</p>
                <button
                  onClick={() =>
                    setEditingEntry({
                      dateIso: `${selectedMonth}-01`,
                      entry: undefined
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs"
                >
                  + Ersten Arbeitstag eintragen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map(e => (
                  <div
                    key={e.id}
                    onClick={() => setEditingEntry({ dateIso: e.date, entry: e })}
                    className="cursor-pointer p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{e.date}: {e.startTime} - {e.endTime}</span>
                        {e.photoData && (
                          <button
                            onClick={ev => {
                              ev.stopPropagation();
                              setViewedPhotoEntry(e);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-md hover:bg-blue-700 transition"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{t('Beleg')}</span>
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                        {e.siteDescription}
                      </div>
                      {(e.fuelExpenses || e.expenses) ? (
                        <div className="flex items-center gap-2 mt-1">
                          {e.fuelExpenses && e.fuelExpenses > 0 ? (
                            <span className="text-[10px] font-semibold text-orange-600">
                              ⛽ {formatCurrency(e.fuelExpenses)}
                            </span>
                          ) : null}
                          {e.expenses && e.expenses > 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-600">
                              💶 {formatCurrency(e.expenses)}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {formatHours(e.decimalHours)} h
                      </span>
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
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

      {/* KI-Monatsdokument & Tabellen-Export Modal (with ALL month entries & settlements!) */}
      <MonthlyDocumentModal
        isOpen={isMonthlyDocOpen}
        onClose={() => setIsMonthlyDocOpen(false)}
        workers={workers}
        month={selectedMonth}
        entries={allMonthEntries}
        settlements={allMonthSettlements}
      />

      {/* Direct TimeEntry Edit/Create Modal for Owner */}
      {editingEntry && (
        <TimeEntryModal
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          dateIso={editingEntry.dateIso}
          formattedDateStr={editingEntry.dateIso}
          existingEntry={editingEntry.entry}
          onSave={async data => {
            await saveEntry({ ...data, userId: activeWorker?.id });
            setEditingEntry(null);
          }}
          onDelete={
            editingEntry.entry
              ? async id => {
                  await deleteEntry(id);
                  setEditingEntry(null);
                }
              : undefined
          }
        />
      )}

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
