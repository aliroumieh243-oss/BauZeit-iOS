import React, { useState } from 'react';
import { MonthlyCalculations, MonthlySettlement } from '../../types';
import { formatCurrency, formatHours } from '../../utils/timeCalculations';
import { t } from '../../utils/language';
import { Euro, TrendingUp, Receipt, Wallet, Edit3, Check, DollarSign, Fuel, Banknote } from 'lucide-react';

interface FinancialSummaryCardProps {
  calculations: MonthlyCalculations;
  settlement: MonthlySettlement | null;
  workerName: string;
  onUpdateSettlement: (deposit: number, operatingExpenses: number) => Promise<void>;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  calculations,
  settlement,
  workerName,
  onUpdateSettlement
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [depositInput, setDepositInput] = useState<string>(
    (settlement?.deposit ?? 0).toString()
  );
  const [operatingInput, setOperatingInput] = useState<string>(
    (settlement?.operatingExpenses ?? 0).toString()
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dep = parseFloat(depositInput.replace(',', '.')) || 0;
      const op = parseFloat(operatingInput.replace(',', '.')) || 0;
      await onUpdateSettlement(dep, op);
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
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setDepositInput((settlement?.deposit ?? 0).toString());
              setOperatingInput((settlement?.operatingExpenses ?? 0).toString());
              setIsEditing(true);
            }
          }}
          className="ios-touch px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          {isEditing ? (
            <>
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span>{isSaving ? 'Speichern...' : t('Fertig')}</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Anzahlung/Kosten</span>
            </>
          )}
        </button>
      </div>

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
            {formatHours(calculations.totalHours)} h Gesamtsumme
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
            {t('Grundlohn:')} vor Abzug
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-2.5 text-xs text-slate-600 pt-1">
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">{t('Geleistete Monatsstunden:')}</span>
          <span className="font-bold text-slate-800">{formatHours(calculations.totalHours)} Stunden</span>
        </div>

        {/* Benzingeld Erstattung */}
        {calculations.totalFuelExpenses > 0 && (
          <div className="flex items-center justify-between py-1 border-b border-slate-50 text-orange-600">
            <span className="font-medium flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              {t('Erstattung Benzingeld:')}
            </span>
            <span className="font-bold">+ {formatCurrency(calculations.totalFuelExpenses)}</span>
          </div>
        )}

        {/* Auslagen Erstattung */}
        {calculations.totalExpenses > 0 && (
          <div className="flex items-center justify-between py-1 border-b border-slate-50 text-emerald-600">
            <span className="font-medium flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5" />
              {t('Erstattung Material / Auslagen:')}
            </span>
            <span className="font-bold">+ {formatCurrency(calculations.totalExpenses)}</span>
          </div>
        )}

        {/* Anzahlung field */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">{t('Geleistete Anzahlung (Abzug):')}</span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={depositInput}
                onChange={e => setDepositInput(e.target.value)}
                placeholder="208.50"
                className="w-24 px-2 py-1 text-right bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="font-bold text-slate-700">€</span>
            </div>
          ) : (
            <span className="font-bold text-red-600">
              - {formatCurrency(calculations.deposit)}
            </span>
          )}
        </div>

        {/* Jasin Betriebskosten */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-500 font-medium">{t('Jasin Betriebskosten:')}</span>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={operatingInput}
                onChange={e => setOperatingInput(e.target.value)}
                placeholder="0.00"
                className="w-24 px-2 py-1 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-700">€</span>
            </div>
          ) : (
            <span className="font-bold text-slate-700">
              {formatCurrency(calculations.operatingExpenses)}
            </span>
          )}
        </div>

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
