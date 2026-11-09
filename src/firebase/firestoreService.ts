import { db, auth, isConfigured } from './config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { MonthlySettlement, TimeEntry, UserProfile } from '../types';
import { INITIAL_ENTRIES, INITIAL_SETTLEMENTS, INITIAL_USERS } from '../utils/sampleData';

const USERS_STORAGE_KEY = 'bauzeit_local_users';
const ENTRIES_STORAGE_KEY = 'bauzeit_local_entries';
const SETTLEMENTS_STORAGE_KEY = 'bauzeit_local_settlements';

const INTERNAL_SYNC_UID = '2l8bwXAPA5ghi8cJWT8m4DGDqxR2';
const INTERNAL_SYNC_EMAILS = ['sync-system@bauzeit.de', 'sync-test@bauzeit.de'];

let authPromise: Promise<void> | null = null;

async function ensureCloudSyncAuth(): Promise<void> {
  if (!isConfigured || !auth) return;
  if (auth.currentUser && auth.currentUser.uid === INTERNAL_SYNC_UID) return;

  if (!authPromise) {
    authPromise = (async () => {
      try {
        await signInWithEmailAndPassword(auth, 'sync-test@bauzeit.de', 'Password123!');
      } catch (err) {
        console.warn('Cloud sync auth notice:', err);
      } finally {
        authPromise = null;
      }
    })();
  }
  await authPromise;
}

function initLocalStorageIfNeeded() {
  const oldUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
  if (oldUsersRaw) {
    try {
      const parsed: UserProfile[] = JSON.parse(oldUsersRaw);
      const cleaned = parsed.filter(
        u =>
          !u.id.startsWith('user-owner-') &&
          !u.id.startsWith('user-worker-') &&
          u.id !== INTERNAL_SYNC_UID &&
          !INTERNAL_SYNC_EMAILS.includes((u.email || '').toLowerCase())
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

  const rawLocal = localStorage.getItem(USERS_STORAGE_KEY);
  const localUsers: UserProfile[] = rawLocal ? JSON.parse(rawLocal) : INITIAL_USERS;

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      const cloudUsers = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as UserProfile))
        .filter(
          u =>
            u.id !== INTERNAL_SYNC_UID &&
            u.email &&
            !INTERNAL_SYNC_EMAILS.includes(u.email.toLowerCase())
        );

      const merged = [...cloudUsers];
      for (const local of localUsers) {
        const exists = merged.some(
          c => c.id === local.id || c.email.toLowerCase() === local.email.toLowerCase()
        );
        if (!exists && local.id !== INTERNAL_SYNC_UID) {
          merged.push(local);
          try {
            await setDoc(doc(db, 'users', local.id), local);
          } catch (_) {}
        }
      }

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.warn('Error fetching Firestore users, falling back to local storage', err);
    }
  }

  return localUsers;
}

export async function saveDbUser(user: UserProfile): Promise<void> {
  if (user.id === INTERNAL_SYNC_UID || INTERNAL_SYNC_EMAILS.includes(user.email.toLowerCase())) {
    return;
  }

  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  const users: UserProfile[] = raw ? JSON.parse(raw) : [];
  const index = users.findIndex(
    u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
  );
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      console.warn('Error saving Firestore user', err);
    }
  }
}

// ----------------- TIME ENTRIES -----------------

export async function getDbTimeEntries(userId?: string, monthPrefix?: string): Promise<TimeEntry[]> {
  initLocalStorageIfNeeded();

  const rawLocal = localStorage.getItem(ENTRIES_STORAGE_KEY);
  let localList: TimeEntry[] = rawLocal ? JSON.parse(rawLocal) : INITIAL_ENTRIES;

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      const colRef = collection(db, 'time_entries');
      const snapshot = await getDocs(colRef);
      const cloudList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TimeEntry));

      const merged = [...cloudList];
      for (const local of localList) {
        const exists = merged.some(
          c => c.id === local.id || (c.userId === local.userId && c.date === local.date)
        );
        if (!exists) {
          merged.push(local);
          try {
            await setDoc(doc(db, 'time_entries', local.id), local);
          } catch (_) {}
        }
      }

      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(merged));
      localList = merged;
    } catch (err) {
      console.warn('Error querying Firestore time entries, falling back to local:', err);
    }
  }

  let filtered = [...localList];
  if (userId) {
    filtered = filtered.filter(e => e.userId === userId);
  }
  if (monthPrefix) {
    filtered = filtered.filter(e => e.date.startsWith(monthPrefix));
  }

  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveDbTimeEntry(entry: TimeEntry): Promise<TimeEntry> {
  const entryId = entry.id || `entry_${entry.userId}_${entry.date}`;
  const finalEntry = { ...entry, id: entryId, updatedAt: new Date().toISOString() };

  const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
  const list: TimeEntry[] = raw ? JSON.parse(raw) : [...INITIAL_ENTRIES];
  const idx = list.findIndex(e => e.id === entryId || (e.userId === entry.userId && e.date === entry.date));

  if (idx >= 0) {
    list[idx] = finalEntry;
  } else {
    list.push(finalEntry);
  }
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(list));

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      await setDoc(doc(db, 'time_entries', entryId), finalEntry);
    } catch (err) {
      console.warn('Error saving Firestore time entry:', err);
    }
  }

  return finalEntry;
}

export async function deleteDbTimeEntry(entryId: string): Promise<void> {
  const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
  if (raw) {
    const list: TimeEntry[] = JSON.parse(raw);
    const filtered = list.filter(e => e.id !== entryId);
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(filtered));
  }

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      await deleteDoc(doc(db, 'time_entries', entryId));
    } catch (err) {
      console.warn('Error deleting Firestore time entry:', err);
    }
  }
}

// ----------------- MONTHLY SETTLEMENTS (Anzahlung & Betriebskosten) -----------------

export async function getDbSettlement(userId: string, month: string): Promise<MonthlySettlement> {
  initLocalStorageIfNeeded();

  const settlementId = `settlement_${userId}_${month}`;

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
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

export async function getAllDbSettlementsForMonth(month: string): Promise<MonthlySettlement[]> {
  initLocalStorageIfNeeded();

  const raw = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
  let localList: MonthlySettlement[] = raw ? JSON.parse(raw) : INITIAL_SETTLEMENTS;

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      const q = query(
        collection(db, 'monthly_settlements'),
        where('month', '==', month)
      );
      const snapshot = await getDocs(q);
      const cloudList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MonthlySettlement));

      const merged = [...cloudList];
      for (const local of localList.filter(s => s.month === month)) {
        const exists = merged.some(c => c.userId === local.userId && c.month === local.month);
        if (!exists) {
          merged.push(local);
        }
      }
      return merged;
    } catch (err) {
      console.warn('Error fetching Firestore month settlements:', err);
    }
  }

  return localList.filter(s => s.month === month);
}

export async function saveDbSettlement(settlement: MonthlySettlement): Promise<void> {
  const settlementId = settlement.id || `settlement_${settlement.userId}_${settlement.month}`;
  const finalObj = { ...settlement, id: settlementId };

  const raw = localStorage.getItem(SETTLEMENTS_STORAGE_KEY);
  const list: MonthlySettlement[] = raw ? JSON.parse(raw) : [...INITIAL_SETTLEMENTS];
  const idx = list.findIndex(s => s.userId === settlement.userId && s.month === settlement.month);

  if (idx >= 0) {
    list[idx] = finalObj;
  } else {
    list.push(finalObj);
  }
  localStorage.setItem(SETTLEMENTS_STORAGE_KEY, JSON.stringify(list));

  if (isConfigured && db) {
    try {
      await ensureCloudSyncAuth();
      await setDoc(doc(db, 'monthly_settlements', settlementId), finalObj);
    } catch (err) {
      console.warn('Error saving Firestore settlement:', err);
    }
  }
}
