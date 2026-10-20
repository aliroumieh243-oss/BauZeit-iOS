import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MonthlyCalculations, MonthlySettlement, TimeEntry, UserProfile } from '../../types';
import { formatCurrency, formatHours } from '../../utils/timeCalculations';
import { t } from '../../utils/language';
import { Sparkles, Copy, Check, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

interface MonthlyDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: UserProfile[];
  month: string;
  entries: TimeEntry[];
  settlements: MonthlySettlement[];
}

export const MonthlyDocumentModal: React.FC<MonthlyDocumentModalProps> = ({
  isOpen,
  onClose,
  workers,
  month,
  entries,
  settlements
}) => {
  const [copied, setCopied] = useState(false);

  // Generate TSV string for 1-click clipboard paste into Excel / Google Sheets
  const generateTableExport = (): string => {
    const lines: string[] = [];

    lines.push('BAUZEIT • MONATSABRECHNUNG & ZEITERFASSUNG');
    lines.push(`Abrechnungsmonat:\t${month}`);
    lines.push(`Erstellt am:\t${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`);
    lines.push('');

    // Summary block
    lines.push('ÜBERSICHT ALLER MITARBEITER');
    lines.push('Mitarbeiter\tStunden (h)\tStundenlohn (€)\tGrundlohn (€)\tBenzin (€)\tAuslagen (€)\tAnzahlung (€)\tAuszahlung (€)');

    let totalAllHours = 0;
    let totalAllPayout = 0;
    let totalAllFuel = 0;
    let totalAllExpenses = 0;

    workers.forEach(w => {
      const wEntries = entries.filter(e => e.userId === w.id);
      const wSettlement = settlements.find(s => s.userId === w.id && s.month === month);
      const wHours = wEntries.reduce((sum, e) => sum + (e.decimalHours || 0), 0);
      const wFuel = wEntries.reduce((sum, e) => sum + (e.fuelExpenses || 0), 0);
      const wExp = wEntries.reduce((sum, e) => sum + (e.expenses || 0), 0);
      const wDep = wSettlement?.deposit || 0;
      const wBaseWages = wHours * w.workerRate;
      const wPayout = wBaseWages + wFuel + wExp - wDep;

      totalAllHours += wHours;
      totalAllPayout += wPayout;
      totalAllFuel += wFuel;
      totalAllExpenses += wExp;

      lines.push(
        `${w.displayName}\t${formatHours(wHours)}\t${w.workerRate.toFixed(2)}\t${wBaseWages.toFixed(2)}\t${wFuel.toFixed(2)}\t${wExp.toFixed(2)}\t${wDep.toFixed(2)}\t${wPayout.toFixed(2)}`
      );
    });

    lines.push(
      `GESAMT BETRIEB\t${formatHours(totalAllHours)}\t-\t-\t${totalAllFuel.toFixed(2)}\t${totalAllExpenses.toFixed(2)}\t-\t${totalAllPayout.toFixed(2)}`
    );
    lines.push('');
    lines.push('================================================================================');
    lines.push('');

    // Detailed day-by-day table
    lines.push('EINZELAUFSTELLUNG ALLER TAGE & EINSÄTZE');
    lines.push('Mitarbeiter\tDatum\tBeginn\tEnde\tPause (Min)\tStunden\tBaustelle / Einsatzort\tBenzin (€)\tAuslagen (€)\tBeleg\tNotiz');

    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    sortedEntries.forEach(e => {
      const wName = workers.find(w => w.id === e.userId)?.displayName || 'Mitarbeiter';
      const fuelStr = (e.fuelExpenses && e.fuelExpenses > 0) ? e.fuelExpenses.toFixed(2) : '0,00';
      const expStr = (e.expenses && e.expenses > 0) ? e.expenses.toFixed(2) : '0,00';
      const receiptStr = e.photoData ? 'Ja (Foto vorhanden)' : '-';
      const noteStr = (e.expenseNote || e.notes || '').replace(/\t/g, ' ');

      lines.push(
        `${wName}\t${e.date}\t${e.startTime}\t${e.endTime}\t${e.breakMinutes}\t${formatHours(e.decimalHours)}\t${e.siteDescription}\t${fuelStr}\t${expStr}\t${receiptStr}\t${noteStr}`
      );
    });

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = generateTableExport();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownloadCSV = () => {
    const tsvText = generateTableExport();
    // Convert tabs to semicolons for standard European CSV
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(tsvText.replace(/\t/g, ';'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `BauZeit_Monatsabrechnung_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('KI-Monatsdokument & Tabellen-Export')}
      subtitle={`Abrechnungsmonat: ${month}`}
    >
      <div className="space-y-4">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {t('KI-Monatsdokument bereit')}
              </h3>
              <p className="text-xs text-white/80">
                {t('Perfekt vorbereitet zur Übertragung in deine Tabellen')}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex flex-col gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`ios-touch w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('Kopiert! Bereit zum Einfügen')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-blue-600" />
                  <span>{t('In Tabelle einfügen (Kopieren)')}</span>
                </>
              )}
            </button>

            {/* CSV Download */}
            <button
              onClick={handleDownloadCSV}
              className="ios-touch w-full py-2.5 px-4 rounded-2xl font-semibold text-xs text-white/90 bg-white/10 hover:bg-white/20 flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Als CSV herunterladen')}</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Wie funktioniert das Einfügen?</span>
          </div>
          <p>
            1. Tippe oben auf <strong>"In Tabelle einfügen (Kopieren)"</strong>.
          </p>
          <p>
            2. Öffne deine Excel-, Numbers- oder Google-Tabelle.
          </p>
          <p>
            3. Drücke <strong>Einfügen (Strg+V bzw. Cmd+V)</strong>. Alle Spalten, Stunden, Löhne und Belege ordnen sich automatisch perfekt an!
          </p>
        </div>

        {/* Live Preview */}
        <div className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
          <pre>{generateTableExport().split('\n').slice(0, 16).join('\n') + '\n...'}</pre>
        </div>

        <button
          onClick={onClose}
          className="ios-touch w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
        >
          {t('Schließen')}
        </button>
      </div>
    </Modal>
  );
};
