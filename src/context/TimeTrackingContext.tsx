import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { MonthlyCalculations, MonthlySettlement, TimeEntry } from '../types';
import { useAuth } from './AuthContext';
import {
  getDbTimeEntries,
  saveDbTimeEntry,
  deleteDbTimeEntry,
  getDbSettlement,
  saveDbSettlement
} from '../firebase/firestoreService';
import { calculateDecimalHours, calculateMonthlySettlement } from '../utils/timeCalculations';

interface TimeTrackingContextType {
  selectedMonth: string; // "YYYY-MM", e.g. "2026-06"
  setSelectedMonth: (month: string) => void;
  selectedWorkerId: string;
  setSelectedWorkerId: (workerId: string) => void;
  entries: TimeEntry[];
  settlement: MonthlySettlement | null;
  calculations: MonthlyCalculations;
  isLoading: boolean;
  saveEntry: (
    data: {
      id?: string;
      date: string;
      startTime: string;
      endTime: string;
      breakMinutes: number;
      siteDescription: string;
      notes?: string;
    }
  ) => Promise<TimeEntry>;
  deleteEntry: (entryId: string) => Promise<void>;
  updateSettlement: (deposit: number, operatingExpenses: number, notes?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isOwner, users } = useAuth();

  // Default to June 2026 as in the prompt reference, or current month
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settlement, setSettlement] = useState<MonthlySettlement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync selected worker ID depending on role
  useEffect(() => {
    if (!currentUser) return;

    if (!isOwner) {
      // Member can ONLY view their own records!
      setSelectedWorkerId(currentUser.id);
    } else {
      // Owner: default to first worker if not yet selected
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
    if (!targetWorkerId) {
      setEntries([]);
      setSettlement(null);
      return;
    }

    setIsLoading(true);
    try {
      const [fetchedEntries, fetchedSettlement] = await Promise.all([
        getDbTimeEntries(targetWorkerId, selectedMonth),
        getDbSettlement(targetWorkerId, selectedMonth)
      ]);
      setEntries(fetchedEntries);
      setSettlement(fetchedSettlement);
    } catch (err) {
      console.error('Error loading time tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedMonth, selectedWorkerId, currentUser]);

  // Determine current active rates
  const activeWorker = users.find(u => u.id === (!isOwner ? currentUser?.id : selectedWorkerId));
  const clientRate = settlement?.customClientRate ?? activeWorker?.clientRate ?? 35.00;
  const workerRate = settlement?.customWorkerRate ?? activeWorker?.workerRate ?? 12.00;

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
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    siteDescription: string;
    notes?: string;
  }): Promise<TimeEntry> => {
    const workerId = !isOwner ? (currentUser?.id || '') : selectedWorkerId;
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

  const updateSettlement = async (deposit: number, operatingExpenses: number, notes?: string) => {
    const workerId = !isOwner ? (currentUser?.id || '') : selectedWorkerId;
    const updated: MonthlySettlement = {
      id: settlement?.id || `settlement_${workerId}_${selectedMonth}`,
      userId: workerId,
      month: selectedMonth,
      deposit: Number(deposit) || 0,
      operatingExpenses: Number(operatingExpenses) || 0,
      notes: notes !== undefined ? notes : settlement?.notes
    };

    await saveDbSettlement(updated);
    setSettlement(updated);
  };

  return (
    <TimeTrackingContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedWorkerId,
        setSelectedWorkerId,
        entries,
        settlement,
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
