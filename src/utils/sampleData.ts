import { MonthlySettlement, TimeEntry, UserProfile } from '../types';

// Complete clean slate: No pre-existing test accounts!
export const INITIAL_USERS: UserProfile[] = [];

export const INITIAL_ENTRIES: TimeEntry[] = [];

export const INITIAL_SETTLEMENTS: MonthlySettlement[] = [];

export const FREQUENT_SITES: string[] = [
  'Baustelle HafenCity - Trockenbau',
  'Villa Blankenese - Spachtelarbeiten Q3',
  'Gewerbepark Nord - Akustikdecken',
  'Einfamilienhaus Bergedorf - Trennwände',
  'Büroetage Altona - Brandschutzverkleidung',
  'Neubau Winterhude - Estrich & Dämmung'
];
