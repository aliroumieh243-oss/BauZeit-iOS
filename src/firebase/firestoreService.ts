import { db, isConfigured } from './config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { MonthlySettlement, TimeEntry, UserProfile } from '../types';
import { INITIAL_ENTRIES, INITIAL_SETTLEMENTS, INITIAL_USERS } from '../utils/sampleData';

const USERS_STORAGE_KEY = 'bauzeit_local_users';
const ENTRIES_STORAGE_KEY = 'bauzeit_local_entries';
const SETTLEMENTS_STORAGE_KEY = 'bauzeit_local_settlements';

// Helper to ensure clean storage without demo accounts
function initLocalStorageIfNeeded() {
  const oldUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
  if (oldUsersRaw) {
    try {
      const parsed: UserProfile[] = JSON.parse(oldUsersRaw);
      // Filter out any leftover demo user IDs from earlier tests
      const cleaned = parsed.filter(
        u => !u.id.startsWith('user-owner-') && !u.id.startsWith('user-worker-')
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cleaned));
      }
    } catch (_) {}
  } else {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
  }
}

// ----------------- USERS -----------------

export async function getDbUsers(): Promise<UserProfile[]> {
  initLocalStorageIfNeeded();

  if (isConfigured && db) {
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      }
    } catch (err) {
      console.warn('Error fetching Firestore users, falling back to local storage', err);
    }
  }

  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : INITIAL_USERS;
}

export async function saveDbUser(user: UserProfile): Promise<void> {
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      console.warn('Error saving Firestore user', err);
    }
  }

  // Also persist in localStorage
  const users = await getDbUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// ----------------- TIME ENTRIES -----------------

export async function getDbTimeEntries(userId?: string, monthPrefix?: string): Promise<TimeEntry[]> {
  initLocalStorageIfNeeded();

  if (isConfigured && db) {
    try {
      const colRef = collection(db, 'time_entries');
      let q = query(colRef, orderBy('date', 'asc'));

      if (userId) {
        q = query(colRef, where('userId', '==', userId), orderBy('date', 'asc'));
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TimeEntry));

      if (monthPrefix) {
        return list.filter(e => e.date.startsWith(monthPrefix));
      }
      return list;
    } catch (err) {
      console.warn('Error querying Firestore time entries, falling back to local:', err);
    }
  }

  const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
  let list: TimeEntry[] = raw ? JSON.parse(raw) : INITIAL_ENTRIES;

  if (userId) {
    list = list.filter(e => e.userId === userId);
  }
  if (monthPrefix) {
    list = list.filter(e => e.date.startsWith(monthPrefix));
  }

  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveDbTimeEntry(entry: TimeEntry): Promise<TimeEntry> {
  const entryId = entry.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const finalEntry = { ...entry, id: entryId, updatedAt: new Date().toISOString() };

  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'time_entries', entryId), finalEntry);
    } catch (err) {
      console.warn('Error saving Firestore time entry:', err);
    }
  }

  const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
  const list: TimeEntry[] = raw ? JSON.parse(raw) : [...INITIAL_ENTRIES];
  const idx = list.findIndex(e => e.id === entryId || (e.userId === entry.userId && e.date === entry.date));

  if (idx >= 0) {
    list[idx] = finalEntry;
  } else {
    list.push(finalEntry);
  }

  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(list));
  return finalEntry;
}

export async function deleteDbTimeEntry(entryId: string): Promise<void> {
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'time_entries', entryId));
    } catch (err) {
      console.warn('Error deleting Firestore time entry:', err);
    }
  }

  const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
  if (raw) {
    const list: TimeEntry[] = JSON.parse(raw);
    const filtered = list.filter(e => e.id !== entryId);
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(filtered));
  }
}

// ----------------- MONTHLY SETTLEMENTS (Anzahlung & Betriebskosten) -----------------

export async function getDbSettlement(userId: string, month: string): Promise<MonthlySettlement> {
  initLocalStorageIfNeeded();

  const settlementId = `settlement_${userId}_${month}`;

  if (isConfigured && db) {
    try {
      const q = query(
        collection(db, 'monthly_settlements'),
        where('userId', '==', userId),
        where('month', '==', month)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as MonthlySettlement;
      }
    } catch (err) {
      console.warn('Error fetching Firestore settlement:', err);
    }
  }

  const raw = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
  const list: MonthlySettlement[] = raw ? JSON.parse(raw) : INITIAL_SETTLEMENTS;
  const found = list.find(s => s.userId === userId && s.month === month);

  if (found) return found;

  return {
    id: settlementId,
    userId,
    month,
    deposit: 0,
    operatingExpenses: 0
  };
}

export async function saveDbSettlement(settlement: MonthlySettlement): Promise<void> {
  const settlementId = settlement.id || `settlement_${settlement.userId}_${settlement.month}`;
  const finalObj = { ...settlement, id: settlementId };

  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'monthly_settlements', settlementId), finalObj);
    } catch (err) {
      console.warn('Error saving Firestore settlement:', err);
    }
  }

  const raw = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
  const list: MonthlySettlement[] = raw ? JSON.parse(raw) : [...INITIAL_SETTLEMENTS];
  const idx = list.findIndex(s => s.userId === settlement.userId && s.month === settlement.month);

  if (idx >= 0) {
    list[idx] = finalObj;
  } else {
    list.push(finalObj);
  }

  localStorage.setItem(SETTLEMENTS_STORAGE_KEY, JSON.stringify(list));
}
