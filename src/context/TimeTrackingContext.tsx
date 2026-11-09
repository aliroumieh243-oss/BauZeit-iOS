import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { MonthlyCalculations, MonthlySettlement, TimeEntry } from '../types';
import { useAuth } from './AuthContext';
import {
  getDbTimeEntries,
  saveDbTimeEntry,
  deleteDbTimeEntry,
  getDbSettlement,
  getAllDbSettlementsForMonth,
  saveDbSettlement
} from '../firebase/firestoreService';
import { calculateDecimalHours, calculateMonthlySettlement } from '../utils/timeCalculations';

interface TimeTrackingContextType {
  selectedMonth: string; // "YYYY-MM", e.g. "2026-06"
  setSelectedMonth: (month: string) => void;
  selectedWorkerId: string;
  setSelectedWorkerId: (workerId: string) => void;
  entries: TimeEntry[];
  allMonthEntries: TimeEntry[];
  settlement: MonthlySettlement | null;
  allMonthSettlements: MonthlySettlement[];
  calculations: MonthlyCalculations;
  isLoading: boolean;
  saveEntry: (
    data: {
      id?: string;
      userId?: string;
      date: string;
      startTime: string;
      endTime: string;
      breakMinutes: number;
      siteDescription: string;
      notes?: string;
      expenses?: number;
      fuelExpenses?: number;
      expenseNote?: string;
      photoData?: string;
    }
  ) => Promise<TimeEntry>;
  deleteEntry: (entryId: string) => Promise<void>;
  updateSettlement: (
    deposit: number,
    operatingExpenses: number,
    customWorkerRate?: number,
    customClientRate?: number,
    notes?: string
  ) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isOwner, users } = useAuth();

  // Default to current month or 2026-11
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [allMonthEntries, setAllMonthEntries] = useState<TimeEntry[]>([]);
  const [settlement, setSettlement] = useState<MonthlySettlement | null>(null);
  const [allMonthSettlements, setAllMonthSettlements] = useState<MonthlySettlement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync selected worker ID depending on role
  useEffect(() => {
    if (!currentUser) return;

    if (!isOwner) {
      setSelectedWorkerId(currentUser.id);
    } else {
      if (!selectedWorkerId || selectedWorkerId === currentUser.id) {
        const firstWorker = users.find(u => u.role === 'member');
        if (firstWorker) {
          setSelectedWorkerId(firstWorker.id);
        }
      }
    }
  }, [currentUser, isOwner, users]);

  // Load entries and settlement whenever selectedMonth or selectedWorkerId changes
  const refreshData = async () => {
    const targetWorkerId = !isOwner ? currentUser?.id : selectedWorkerId;

    setIsLoading(true);
    try {
      const [allEntriesForMonth, allSettlementsForMonth] = await Promise.all([
        getDbTimeEntries(undefined, selectedMonth),
        getAllDbSettlementsForMonth(selectedMonth)
      ]);
      setAllMonthEntries(allEntriesForMonth);
      setAllMonthSettlements(allSettlementsForMonth);

      if (!targetWorkerId) {
        setEntries([]);
        setSettlement(null);
      } else {
        const workerEntries = allEntriesForMonth.filter(e => e.userId === targetWorkerId);
        const workerSettlement =
          allSettlementsForMonth.find(s => s.userId === targetWorkerId && s.month === selectedMonth) ||
          (await getDbSettlement(targetWorkerId, selectedMonth));
        setEntries(workerEntries);
        setSettlement(workerSettlement);
      }
    } catch (err) {
      console.error('Error loading time tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedMonth, selectedWorkerId, currentUser, users.length]);

  // Determine current active rates
  const activeWorker = users.find(u => u.id === (!isOwner ? currentUser?.id : selectedWorkerId));
  const clientRate = settlement?.customClientRate ?? activeWorker?.clientRate ?? 35.0;
  const workerRate = settlement?.customWorkerRate ?? activeWorker?.workerRate ?? 12.0;

  // Compute live calculations
  const calculations = useMemo(() => {
    return calculateMonthlySettlement(
      entries,
      clientRate,
      workerRate,
      settlement?.deposit ?? 0,
      settlement?.operatingExpenses ?? 0
    );
  }, [entries, clientRate, workerRate, settlement]);

  const saveEntry = async (data: {
    id?: string;
    userId?: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    siteDescription: string;
    notes?: string;
    expenses?: number;
    fuelExpenses?: number;
    expenseNote?: string;
    photoData?: string;
  }): Promise<TimeEntry> => {
    const workerId = data.userId || (!isOwner ? (currentUser?.id || '') : selectedWorkerId);
    const decimalHours = calculateDecimalHours(data.startTime, data.endTime, data.breakMinutes);

    const entryToSave: TimeEntry = {
      id: data.id || '',
      userId: workerId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes,
      siteDescription: data.siteDescription.trim() || 'Allgemeine Arbeiten',
      decimalHours,
      notes: data.notes,
      expenses: data.expenses || 0,
      fuelExpenses: data.fuelExpenses || 0,
      expenseNote: data.expenseNote,
      photoData: data.photoData,
      updatedAt: new Date().toISOString()
    };

    const saved = await saveDbTimeEntry(entryToSave);
    await refreshData();
    return saved;
  };

  const deleteEntry = async (entryId: string) => {
    await deleteDbTimeEntry(entryId);
    await refreshData();
  };

  const updateSettlement = async (
    deposit: number,
    operatingExpenses: number,
    customWorkerRate?: number,
    customClientRate?: number,
    notes?: string
  ) => {
    const workerId = !isOwner ? (currentUser?.id || '') : selectedWorkerId;
    const updated: MonthlySettlement = {
      id: settlement?.id || `settlement_${workerId}_${selectedMonth}`,
      userId: workerId,
      month: selectedMonth,
      deposit: Number(deposit) || 0,
      operatingExpenses: Number(operatingExpenses) || 0,
      customWorkerRate: customWorkerRate !== undefined ? Number(customWorkerRate) : settlement?.customWorkerRate,
      customClientRate: customClientRate !== undefined ? Number(customClientRate) : settlement?.customClientRate,
      notes: notes !== undefined ? notes : settlement?.notes
    };

    await saveDbSettlement(updated);
    setSettlement(updated);
    await refreshData();
  };

  return (
    <TimeTrackingContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedWorkerId,
        setSelectedWorkerId,
        entries,
        allMonthEntries,
        settlement,
        allMonthSettlements,
        calculations,
        isLoading,
        saveEntry,
        deleteEntry,
        updateSettlement,
        refreshData
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
}
