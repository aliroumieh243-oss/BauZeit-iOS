export type UserRole = 'owner' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  workerRate: number;      // e.g. 12.00 € (Worker payout rate / Stundenlohn)
  clientRate: number;      // e.g. 35.00 € (Mitarbeiter AR billing rate)
  avatarColor?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;          // Id of the member who worked
  date: string;            // ISO Date: YYYY-MM-DD (e.g. "2026-06-01")
  startTime: string;       // HH:mm (e.g. "08:00", "09:00", "09:30", "13:30")
  endTime: string;         // HH:mm (e.g. "16:30", "17:00", "18:00", "18:40")
  breakMinutes: number;    // e.g. 0, 10, 30, 40 (minutes)
  siteDescription: string; // "Baustelle Beschreibung", e.g. "Musterstraße 12 - Trockenbau"
  decimalHours: number;    // Calculated: e.g. 3.00, 7.00, 8.50, 10.00
  notes?: string;
  expenses?: number;       // Geld ausgegeben (Material, Werkzeug)
  fuelExpenses?: number;   // Benzingeld / Sprit
  expenseNote?: string;    // Notiz zu den Ausgaben
  updatedAt: string;
}

export interface MonthlySettlement {
  id: string;
  userId: string;
  month: string;           // YYYY-MM (e.g. "2026-06")
  deposit: number;         // "Anzahlung", e.g. 208.50 €
  operatingExpenses: number; // "Jasin Betriebskosten", e.g. 0.00 €
  customClientRate?: number; // Custom "Mitarbeiter AR" rate if different from user default
  customWorkerRate?: number; // Custom "Mitarbeiter" rate if different from user default
  notes?: string;
}

export interface MonthlyCalculations {
  totalHours: number;              // Sum of all decimal hours
  clientTotalAmount: number;       // Mitarbeiter AR: totalHours * clientRate (e.g. 2.712,50 €)
  workerTotalAmount: number;       // Mitarbeiter Lohn: totalHours * workerRate (e.g. 930,00 €)
  totalExpenses: number;           // Summe Geld ausgegeben
  totalFuelExpenses: number;       // Summe Benzingeld
  deposit: number;                 // Anzahlung (e.g. 208,50 €)
  operatingExpenses: number;       // Jasin Betriebskosten (e.g. 0,00 €)
  netPayout: number;               // Gesamtlohn: workerTotalAmount + totalExpenses + totalFuelExpenses - deposit
  clientRate: number;              // Current client rate applied (e.g. 35,00 €)
  workerRate: number;              // Current worker rate applied (e.g. 12,00 €)
}

export interface DayCalendarInfo {
  date: string;            // YYYY-MM-DD
  dayOfWeek: string;       // "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.", "So."
  dayNumber: number;       // 1 - 31
  formattedDate: string;   // e.g. "Mi. 01. Jun"
  isWeekend: boolean;
  entry?: TimeEntry;
}
