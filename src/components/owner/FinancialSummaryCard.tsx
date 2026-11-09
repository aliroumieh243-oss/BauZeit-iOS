import React, { useState } from 'react';
import { MonthlyCalculations, MonthlySettlement } from '../../types';
import { formatCurrency, formatHours } from '../../utils/timeCalculations';
import { t } from '../../utils/language';
import { Edit3, Check, Fuel, Banknote, X } from 'lucide-react';

interface FinancialSummaryCardProps {
  calculations: MonthlyCalculations;
  settlement: MonthlySettlement | null;
  workerName: string;
  entryCount?: number;
  onUpdateSettlement: (
    deposit: number,
    operatingExpenses: number,
    customWorkerRate?: number,
    customClientRate?: number,
    notes?: string
  ) => Promise<void>;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  calculations,
  settlement,
  workerName,
  entryCount = 0,
  onUpdateSettlement
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [workerRateInput, setWorkerRateInput] = useState<string>(
    calculations.workerRate.toString()
  );
  const [clientRateInput, setClientRateInput] = useState<string>(
    calculations.clientRate.toString()
  );
  const [depositInput, setDepositInput] = useState<string>(
    (settlement?.deposit ?? 0).toString()
  );
  const [operatingInput, setOperatingInput] = useState<string>(
    (settlement?.operatingExpenses ?? 0).toString()
  );
  const [notesInput, setNotesInput] = useState<string>(
    settlement?.notes ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setWorkerRateInput(calculations.workerRate.toFixed(2));
    setClientRateInput(calculations.clientRate.toFixed(2));
    setDepositInput((settlement?.deposit ?? 0).toFixed(2));
    setOperatingInput((settlement?.operatingExpenses ?? 0).toFixed(2));
    setNotesInput(settlement?.notes ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const wRate = parseFloat(workerRateInput.replace(',', '.')) || calculations.workerRate;
      const cRate = parseFloat(clientRateInput.replace(',', '.')) || calculations.clientRate;
      const dep = parseFloat(depositInput.replace(',', '.')) || 0;
      const op = parseFloat(operatingInput.replace(',', '.')) || 0;
      await onUpdateSettlement(dep, op, wRate, cRate, notesInput.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update settlement:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 mb-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('Abrechnung & Finanzen')}
          </span>
          <h3 className="text-base font-bold text-slate-900">{workerName}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="ios-touch p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                handleStartEdit();
              }
            }}
            className={`ios-touch px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isEditing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Speichern...' : 'Speichern'}</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Alles bearbeiten</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Edit Form Panel */}
      {isEditing && (
        <div className="my-3 p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2.5 text-xs">
          <div className="font-bold text-blue-900 text-[11px] uppercase tracking-wider">
            Alle Werte der Monatsabrechnung bearbeiten:
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Mitarbeiter-Lohn (€/h)
              </label>
              <input
                type="text"
                value={workerRateInput}
                onChange={e => setWorkerRateInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Kunden-Satz AR (€/h)
              </label>
              <input
                type="text"
                value={clientRateInput}
                onChange={e => setClientRateInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Anzahlung / Vorschuss (€)
              </label>
              <input
                type="text"
                value={depositInput}
                onChange={e => setDepositInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-amber-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Betriebskosten (€)
              </label>
              <input
                type="text"
                value={operatingInput}
                onChange={e => setOperatingInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Abrechnungs-Notiz / Bemerkung
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              placeholder="z.B. Bar ausgezahlt am Monatsende..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900"
            />
          </div>
        </div>
      )}

      {/* Primary Highlights: AR Total vs Worker Payout */}
      <div className="grid grid-cols-2 gap-3 my-4">
        {/* Mitarbeiter AR (Kundenverrechnung / Abrechnung) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/70">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('Kunden-Abrechnung AR')}</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md font-semibold">
              {formatCurrency(calculations.clientRate)}/h
            </span>
          </div>
          <div className="text-xl font-black text-blue-900 tracking-tight">
            {formatCurrency(calculations.clientTotalAmount)}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">
            {formatHours(calculations.totalHours)} h ({entryCount} Tage)
          </div>
        </div>

        {/* Mitarbeiter Lohn (Auszahlungsbasis) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/70">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('Mitarbeiter-Lohn')}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">
              {formatCurrency(calculations.workerRate)}/h
            </span>
          </div>
          <div className="text-xl font-black text-emerald-900 tracking-tight">
            {formatCurrency(calculations.workerTotalAmount)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {t('Grundlohn:')} vor Spesen
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-2.5 text-xs text-slate-600 pt-1">
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">{t('Geleistete Monatsstunden:')}</span>
          <span className="font-bold text-slate-800">{formatHours(calculations.totalHours)} Stunden ({entryCount} Tage)</span>
        </div>

        {/* Benzingeld Erstattung */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50 text-orange-600">
          <span className="font-medium flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5" />
            {t('Erstattung Benzingeld:')}
          </span>
          <span className="font-bold">+ {formatCurrency(calculations.totalFuelExpenses)}</span>
        </div>

        {/* Auslagen Erstattung */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50 text-emerald-600">
          <span className="font-medium flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5" />
            {t('Erstattung Material / Auslagen:')}
          </span>
          <span className="font-bold">+ {formatCurrency(calculations.totalExpenses)}</span>
        </div>

        {/* Anzahlung field */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">{t('Geleistete Anzahlung (Abzug):')}</span>
          <span className="font-bold text-red-600">
            - {formatCurrency(calculations.deposit)}
          </span>
        </div>

        {/* Jasin Betriebskosten */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">{t('Jasin Betriebskosten:')}</span>
          <span className="font-bold text-slate-700">
            {formatCurrency(calculations.operatingExpenses)}
          </span>
        </div>

        {settlement?.notes && (
          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500 font-medium">Bemerkung:</span>
            <span className="font-semibold text-slate-800">{settlement.notes}</span>
          </div>
        )}

        {/* Final Net Wage */}
        <div className="mt-3 pt-3 border-t-2 border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('Endgültiger Gesamtlohn')}
            </div>
            <div className="text-[11px] text-slate-500">
              {t('Inkl. Spesen & nach Anzahlung')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(calculations.netPayout)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
