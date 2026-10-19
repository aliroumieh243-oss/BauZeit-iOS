import { DayCalendarInfo, MonthlyCalculations, TimeEntry } from '../types';

/**
 * Calculates decimal hours from HH:mm start, HH:mm end, and break minutes.
 * Example: 08:00 to 17:00 with 30 min pause = 510 min = 8.50 decimal hours.
 */
export function calculateDecimalHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  let startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  // Handle overnight shift if ever needed
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }

  const workedMinutes = endTotalMinutes - startTotalMinutes - (breakMinutes || 0);
  if (workedMinutes <= 0) return 0;

  const decimal = workedMinutes / 60;
  // Round to 2 decimal places cleanly
  return Math.round(decimal * 100) / 100;
}

/**
 * Format decimal hours to German locale (e.g., 8,50 Std. or 3,00)
 */
export function formatHours(hours: number): string {
  return hours.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format currency in EUR (e.g., 2.712,50 €)
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR'
  });
}

/**
 * Format minutes as string (e.g. 30 -> "00:30", 40 -> "00:40", 0 -> "00:00")
 */
export function formatBreakMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Parse break string ("00:30") or number to minutes
 */
export function parseBreakToMinutes(breakStrOrNum: string | number): number {
  if (typeof breakStrOrNum === 'number') return breakStrOrNum;
  if (!breakStrOrNum) return 0;
  if (breakStrOrNum.includes(':')) {
    const [h, m] = breakStrOrNum.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  const parsed = parseInt(breakStrOrNum, 10);
  return isNaN(parsed) ? 0 : parsed;
}

const GERMAN_WEEKDAYS_SHORT = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
const GERMAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];
export const GERMAN_MONTHS_FULL = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

/**
 * Returns all days for a given month (e.g., "2026-06")
 * Formatted like: "Mi. 01. Jun" to "Do. 30. Jun"
 */
export function getDaysForMonth(yearMonth: string, entries: TimeEntry[] = []): DayCalendarInfo[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const entriesByDate = new Map<string, TimeEntry>();
  entries.forEach(e => entriesByDate.set(e.date, e));

  const daysCount = new Date(year, month + 1, 0).getDate();
  const days: DayCalendarInfo[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const dateObj = new Date(year, month, d);
    const dayOfWeekIdx = dateObj.getDay();
    const dayOfWeek = GERMAN_WEEKDAYS_SHORT[dayOfWeekIdx];
    const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 6;

    const dayPad = d.toString().padStart(2, '0');
    const monthPad = (month + 1).toString().padStart(2, '0');
    const dateIso = `${year}-${monthPad}-${dayPad}`;

    const formattedDate = `${dayOfWeek} ${dayPad}. ${GERMAN_MONTHS_SHORT[month]}`;

    days.push({
      date: dateIso,
      dayOfWeek,
      dayNumber: d,
      formattedDate,
      isWeekend,
      entry: entriesByDate.get(dateIso)
    });
  }

  return days;
}

/**
 * Calculates complete monthly financial numbers matching the user's specification:
 * - Mitarbeiter AR: totalHours * clientRate (e.g. 77.50 * 35 € = 2,712.50 €)
 * - Mitarbeiter: totalHours * workerRate (e.g. 77.50 * 12 € = 930.00 €)
 * - Anzahlung: e.g. 208.50 €
 * - Endgültiger Gesamtlohn: Mitarbeiter sum - Anzahlung = 721.50 €
 */
export function calculateMonthlySettlement(
  entries: TimeEntry[],
  clientRate: number = 35.0,
  workerRate: number = 12.0,
  deposit: number = 0,
  operatingExpenses: number = 0
): MonthlyCalculations {
  const totalHours = entries.reduce((sum, e) => sum + (e.decimalHours || 0), 0);
  const roundedHours = Math.round(totalHours * 100) / 100;

  const clientTotalAmount = Math.round(roundedHours * clientRate * 100) / 100;
  const workerTotalAmount = Math.round(roundedHours * workerRate * 100) / 100;
  const netPayout = Math.round((workerTotalAmount - deposit) * 100) / 100;

  return {
    totalHours: roundedHours,
    clientTotalAmount,
    workerTotalAmount,
    deposit,
    operatingExpenses,
    netPayout,
    clientRate,
    workerRate
  };
}
