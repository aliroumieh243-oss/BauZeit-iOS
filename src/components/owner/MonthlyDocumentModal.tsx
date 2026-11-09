import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MonthlySettlement, TimeEntry, UserProfile } from '../../types';
import { formatCurrency, formatHours } from '../../utils/timeCalculations';
import { t } from '../../utils/language';
import { Sparkles, Copy, Download, FileSpreadsheet, CheckCircle2, Table } from 'lucide-react';

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
  const [filterWorkerId, setFilterWorkerId] = useState<string>('ALL');

  const targetWorkers =
    filterWorkerId === 'ALL'
      ? workers
      : workers.filter(w => w.id === filterWorkerId);

  const allowedIds = new Set(targetWorkers.map(w => w.id));
  const sortedEntries = [...entries]
    .filter(e => allowedIds.has(e.userId))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build structured summary rows for Table 1
  const summaryRows = targetWorkers.map(w => {
    const wEntries = entries.filter(e => e.userId === w.id);
    const wSettlement = settlements.find(s => s.userId === w.id && s.month === month);
    const wHours = wEntries.reduce((sum, e) => sum + (e.decimalHours || 0), 0);
    const wFuel = wEntries.reduce((sum, e) => sum + (e.fuelExpenses || 0), 0);
    const wExp = wEntries.reduce((sum, e) => sum + (e.expenses || 0), 0);
    const workerRate = wSettlement?.customWorkerRate ?? w.workerRate ?? 12;
    const clientRate = wSettlement?.customClientRate ?? w.clientRate ?? 35;
    const wDep = wSettlement?.deposit || 0;
    const wOp = wSettlement?.operatingExpenses || 0;
    const wBaseWages = wHours * workerRate;
    const wClientAR = wHours * clientRate;
    const wPayout = wBaseWages + wFuel + wExp - wDep;

    return {
      worker: w,
      days: wEntries.length,
      hours: wHours,
      workerRate,
      baseWages: wBaseWages,
      clientRate,
      clientAR: wClientAR,
      fuel: wFuel,
      expenses: wExp,
      deposit: wDep,
      operating: wOp,
      netPayout: wPayout,
      notes: wSettlement?.notes || '-'
    };
  });

  const totals = summaryRows.reduce(
    (acc, r) => ({
      days: acc.days + r.days,
      hours: acc.hours + r.hours,
      baseWages: acc.baseWages + r.baseWages,
      clientAR: acc.clientAR + r.clientAR,
      fuel: acc.fuel + r.fuel,
      expenses: acc.expenses + r.expenses,
      deposit: acc.deposit + r.deposit,
      operating: acc.operating + r.operating,
      netPayout: acc.netPayout + r.netPayout
    }),
    { days: 0, hours: 0, baseWages: 0, clientAR: 0, fuel: 0, expenses: 0, deposit: 0, operating: 0, netPayout: 0 }
  );

  // Generate TSV string for 1-click clipboard paste into Excel / Google Sheets
  const generateTableExport = (): string => {
    const lines: string[] = [];

    lines.push('BAUZEIT • MONATSABRECHNUNG & ZEITERFASSUNG');
    lines.push(`Abrechnungsmonat:\t${month}`);
    lines.push(`Erstellt am:\t${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`);
    lines.push('');

    lines.push('TABELLE 1: MONATSABRECHNUNG JE MITARBEITER');
    lines.push(
      'Mitarbeiter\tTage\tStunden (h)\tLohn/h (€)\tGrundlohn (€)\tKunden-AR/h (€)\tKunden-AR (€)\tBenzin (€)\tAuslagen (€)\tAnzahlung (€)\tBetriebskosten (€)\tAuszahlung Netto (€)\tNotiz'
    );

    summaryRows.forEach(r => {
      lines.push(
        `${r.worker.displayName}\t${r.days}\t${formatHours(r.hours)}\t${r.workerRate.toFixed(2)}\t${r.baseWages.toFixed(2)}\t${r.clientRate.toFixed(2)}\t${r.clientAR.toFixed(2)}\t${r.fuel.toFixed(2)}\t${r.expenses.toFixed(2)}\t${r.deposit.toFixed(2)}\t${r.operating.toFixed(2)}\t${r.netPayout.toFixed(2)}\t${r.notes}`
      );
    });

    lines.push(
      `GESAMT\t${totals.days}\t${formatHours(totals.hours)}\t-\t${totals.baseWages.toFixed(2)}\t-\t${totals.clientAR.toFixed(2)}\t${totals.fuel.toFixed(2)}\t${totals.expenses.toFixed(2)}\t${totals.deposit.toFixed(2)}\t${totals.operating.toFixed(2)}\t${totals.netPayout.toFixed(2)}\t-`
    );
    lines.push('');

    lines.push('TABELLE 2: EINZELAUFSTELLUNG ALLER TAGE & EINSÄTZE');
    lines.push(
      'Datum\tMitarbeiter\tBeginn\tEnde\tPause (Min)\tStunden\tBaustelle / Einsatzort\tBenzin (€)\tAuslagen (€)\tBeleg\tNotiz'
    );

    sortedEntries.forEach(e => {
      const wName = workers.find(w => w.id === e.userId)?.displayName || 'Mitarbeiter';
      const fuelStr = e.fuelExpenses && e.fuelExpenses > 0 ? e.fuelExpenses.toFixed(2) : '0.00';
      const expStr = e.expenses && e.expenses > 0 ? e.expenses.toFixed(2) : '0.00';
      const receiptStr = e.photoData ? 'Ja (Foto)' : '-';
      const noteStr = (e.expenseNote || e.notes || '-').replace(/\t/g, ' ');

      lines.push(
        `${e.date}\t${wName}\t${e.startTime}\t${e.endTime}\t${e.breakMinutes}\t${formatHours(e.decimalHours)}\t${e.siteDescription}\t${fuelStr}\t${expStr}\t${receiptStr}\t${noteStr}`
      );
    });

    return lines.join('\n');
  };

  // Generate Real Formatted Excel (.xls) HTML Spreadsheet
  const generateExcelHTML = (): string => {
    const summaryRowsHtml = summaryRows
      .map(
        r => `
      <tr>
        <td><strong>${r.worker.displayName}</strong></td>
        <td style="text-align:right">${r.days}</td>
        <td style="text-align:right"><strong>${formatHours(r.hours)}</strong></td>
        <td style="text-align:right">${formatCurrency(r.workerRate)}</td>
        <td style="text-align:right">${formatCurrency(r.baseWages)}</td>
        <td style="text-align:right">${formatCurrency(r.clientRate)}</td>
        <td style="text-align:right;color:#1d4ed8;font-weight:bold">${formatCurrency(r.clientAR)}</td>
        <td style="text-align:right">${formatCurrency(r.fuel)}</td>
        <td style="text-align:right">${formatCurrency(r.expenses)}</td>
        <td style="text-align:right;color:#dc2626">- ${formatCurrency(r.deposit)}</td>
        <td style="text-align:right">${formatCurrency(r.operating)}</td>
        <td style="text-align:right;color:#047857;font-weight:bold">${formatCurrency(r.netPayout)}</td>
        <td>${r.notes}</td>
      </tr>`
      )
      .join('');

    const entriesRowsHtml = sortedEntries
      .map(e => {
        const wName = workers.find(w => w.id === e.userId)?.displayName || 'Mitarbeiter';
        return `
      <tr>
        <td>${e.date}</td>
        <td>${wName}</td>
        <td>${e.startTime}</td>
        <td>${e.endTime}</td>
        <td style="text-align:right">${e.breakMinutes}</td>
        <td style="text-align:right"><strong>${formatHours(e.decimalHours)}</strong></td>
        <td>${e.siteDescription}</td>
        <td style="text-align:right">${formatCurrency(e.fuelExpenses || 0)}</td>
        <td style="text-align:right">${formatCurrency(e.expenses || 0)}</td>
        <td>${e.photoData ? 'Ja (Foto)' : '-'}</td>
        <td>${e.expenseNote || e.notes || '-'}</td>
      </tr>`;
      })
      .join('');

    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
          th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; }
          td { padding: 7px 8px; border: 1px solid #cbd5e1; }
          .total td { background-color: #e2e8f0; font-weight: bold; border-top: 2px solid #0f172a; }
        </style>
      </head>
      <body>
        <h2>BAUZEIT • MONATSABRECHNUNG (${month})</h2>
        <h3>1. Monatsabrechnung & Löhne</h3>
        <table>
          <thead>
            <tr>
              <th>Mitarbeiter</th><th>Tage</th><th>Stunden</th><th>Lohn/h</th><th>Grundlohn</th><th>AR/h</th><th>Kunden-AR</th><th>Benzin</th><th>Auslagen</th><th>Anzahlung</th><th>Betriebsk.</th><th>Auszahlung Netto</th><th>Notiz</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRowsHtml}
            <tr class="total">
              <td>GESAMT</td>
              <td style="text-align:right">${totals.days}</td>
              <td style="text-align:right">${formatHours(totals.hours)}</td>
              <td>-</td>
              <td style="text-align:right">${formatCurrency(totals.baseWages)}</td>
              <td>-</td>
              <td style="text-align:right;color:#1d4ed8">${formatCurrency(totals.clientAR)}</td>
              <td style="text-align:right">${formatCurrency(totals.fuel)}</td>
              <td style="text-align:right">${formatCurrency(totals.expenses)}</td>
              <td style="text-align:right;color:#dc2626">- ${formatCurrency(totals.deposit)}</td>
              <td style="text-align:right">${formatCurrency(totals.operating)}</td>
              <td style="text-align:right;color:#047857">${formatCurrency(totals.netPayout)}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
        <h3>2. Einzelaufstellung aller Einsatztage (${sortedEntries.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Datum</th><th>Mitarbeiter</th><th>Beginn</th><th>Ende</th><th>Pause (Min)</th><th>Stunden</th><th>Baustelle</th><th>Benzin</th><th>Auslagen</th><th>Beleg</th><th>Notiz</th>
            </tr>
          </thead>
          <tbody>
            ${entriesRowsHtml}
          </tbody>
        </table>
      </body>
    </html>`;
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

  const handleDownloadExcel = () => {
    const html = generateExcelHTML();
    const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BauZeit_Tabelle_${month}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const tsvText = generateTableExport();
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
        {/* Filter Pills: Alle vs Einzelner Mitarbeiter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterWorkerId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              filterWorkerId === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Alle Mitarbeiter ({workers.length})
          </button>
          {workers.map(w => (
            <button
              key={w.id}
              onClick={() => setFilterWorkerId(w.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                filterWorkerId === w.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {w.displayName}
            </button>
          ))}
        </div>

        {/* Hero Export Card */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-4 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <Table className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">
                Echte Monats-Tabelle & Export
              </h3>
              <p className="text-[11px] text-white/80">
                Direkt als formatierte Excel-Tabelle (.xls), CSV oder Kopieren
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleDownloadExcel}
              className="ios-touch w-full py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 shadow-md transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Echte Excel-Tabelle herunterladen (.xls)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className={`ios-touch py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tabelle kopieren</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCSV}
                className="ios-touch py-2.5 px-3 rounded-2xl font-semibold text-xs text-white bg-white/15 hover:bg-white/25 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV-Datei (.csv)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ECHTE VISUELLE TABELLE 1: Mitarbeiter-Abrechnung */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>1. Tabelle: Monatsabrechnung & Löhne</span>
            <span className="text-[10px] text-slate-400 font-normal">Horizontal scrollbar ↔</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white font-bold">
                  <th className="py-2 px-2.5 border-r border-blue-800">Mitarbeiter</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Tage</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Std.</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Lohn/h</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Grundlohn</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Kunden-AR</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Benzin</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Auslagen</th>
                  <th className="py-2 px-2 text-right border-r border-blue-800">Anzahlung</th>
                  <th className="py-2 px-2.5 text-right">Auszahlung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summaryRows.map((r, i) => (
                  <tr key={r.worker.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">{r.worker.displayName}</td>
                    <td className="py-2 px-2 text-right">{r.days}</td>
                    <td className="py-2 px-2 text-right font-bold whitespace-nowrap">{formatHours(r.hours)} h</td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(r.workerRate)}</td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(r.baseWages)}</td>
                    <td className="py-2 px-2 text-right font-bold text-blue-700 whitespace-nowrap">{formatCurrency(r.clientAR)}</td>
                    <td className="py-2 px-2 text-right text-orange-600 whitespace-nowrap">{formatCurrency(r.fuel)}</td>
                    <td className="py-2 px-2 text-right text-emerald-600 whitespace-nowrap">{formatCurrency(r.expenses)}</td>
                    <td className="py-2 px-2 text-right text-red-600 whitespace-nowrap">- {formatCurrency(r.deposit)}</td>
                    <td className="py-2 px-2.5 text-right font-black text-emerald-700 whitespace-nowrap">{formatCurrency(r.netPayout)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="py-2 px-2.5">GESAMT</td>
                  <td className="py-2 px-2 text-right">{totals.days}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatHours(totals.hours)} h</td>
                  <td className="py-2 px-2 text-right">-</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(totals.baseWages)}</td>
                  <td className="py-2 px-2 text-right text-blue-700 whitespace-nowrap">{formatCurrency(totals.clientAR)}</td>
                  <td className="py-2 px-2 text-right text-orange-600 whitespace-nowrap">{formatCurrency(totals.fuel)}</td>
                  <td className="py-2 px-2 text-right text-emerald-600 whitespace-nowrap">{formatCurrency(totals.expenses)}</td>
                  <td className="py-2 px-2 text-right text-red-600 whitespace-nowrap">- {formatCurrency(totals.deposit)}</td>
                  <td className="py-2 px-2.5 text-right text-emerald-700 whitespace-nowrap">{formatCurrency(totals.netPayout)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ECHTE VISUELLE TABELLE 2: Einzelaufstellung aller Einsatztage */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            2. Tabelle: Einzelaufstellung Einsatztage ({sortedEntries.length})
          </div>
          {sortedEntries.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              Keine Einträge für diesen Zeitraum vorhanden.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-56 rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-indigo-950 text-white font-bold">
                    <th className="py-2 px-2.5 border-r border-indigo-900">Datum</th>
                    <th className="py-2 px-2 border-r border-indigo-900">Mitarbeiter</th>
                    <th className="py-2 px-2 border-r border-indigo-900">Zeit</th>
                    <th className="py-2 px-2 text-right border-r border-indigo-900">Pause</th>
                    <th className="py-2 px-2 text-right border-r border-indigo-900">Std.</th>
                    <th className="py-2 px-2.5 border-r border-indigo-900">Baustelle</th>
                    <th className="py-2 px-2 text-right border-r border-indigo-900">Benzin</th>
                    <th className="py-2 px-2 text-right">Auslagen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedEntries.map((e, idx) => {
                    const wName = workers.find(w => w.id === e.userId)?.displayName || 'Mitarbeiter';
                    return (
                      <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-1.5 px-2.5 font-bold whitespace-nowrap">{e.date}</td>
                        <td className="py-1.5 px-2 whitespace-nowrap">{wName}</td>
                        <td className="py-1.5 px-2 whitespace-nowrap">{e.startTime}–{e.endTime}</td>
                        <td className="py-1.5 px-2 text-right">{e.breakMinutes}m</td>
                        <td className="py-1.5 px-2 text-right font-bold text-blue-700 whitespace-nowrap">{formatHours(e.decimalHours)} h</td>
                        <td className="py-1.5 px-2.5 truncate max-w-[140px]">{e.siteDescription}</td>
                        <td className="py-1.5 px-2 text-right text-orange-600 whitespace-nowrap">
                          {e.fuelExpenses ? formatCurrency(e.fuelExpenses) : '-'}
                        </td>
                        <td className="py-1.5 px-2 text-right text-emerald-600 whitespace-nowrap">
                          {e.expenses ? formatCurrency(e.expenses) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
