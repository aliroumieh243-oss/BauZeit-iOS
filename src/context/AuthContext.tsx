import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { getDbUsers, saveDbUser } from '../firebase/firestoreService';
import { isConfigured } from '../firebase/config';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isOwner: boolean;
  isMember: boolean;
  isLoading: boolean;
  isFirebaseActive: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password?: string,
    name?: string,
    role?: 'owner' | 'member'
  ) => Promise<{ success: boolean; error?: string }>;
  quickStart: (role: 'owner' | 'member') => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  addNewWorker: (
    name: string,
    email: string,
    workerRate?: number,
    clientRate?: number,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateWorker: (worker: UserProfile) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_SESSION_KEY = 'bauzeit_session_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUsers = async () => {
    try {
      const dbUsers = await getDbUsers();
      setUsers(dbUsers);

      const savedUserId = localStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (savedUserId) {
        const found = dbUsers.find(u => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        }
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
    const interval = setInterval(() => {
      refreshUsers();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    const allUsers = await getDbUsers();
    const matched = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matched) {
      return {
        success: false,
        error: 'Kein Konto mit dieser E-Mail-Adresse gefunden. Bitte erstelle zuerst ein neues Konto oder nutze den Schnell-Start.'
      };
    }

    setCurrentUser(matched);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, matched.id);
    return { success: true };
  };

  const register = async (
    email: string,
    password?: string,
    name?: string,
    role?: 'owner' | 'member'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = (name && name.trim()) || cleanEmail.split('@')[0];

    const allUsers = await getDbUsers();

    // Smart Account Linking: Falls Konto mit dieser E-Mail schon vom Chef oder auf anderem Gerät angelegt wurde, direkt verknüpfen!
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      const updatedUser: UserProfile = {
        ...existing,
        displayName: (name && name.trim()) ? name.trim() : existing.displayName,
        role: role === 'owner' ? 'owner' : existing.role
      };
      await saveDbUser(updatedUser);
      await refreshUsers();
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_SESSION_KEY, updatedUser.id);
      return { success: true };
    }

    const assignedRole: 'owner' | 'member' = role || (allUsers.length === 0 ? 'owner' : 'member');
    const newUser: UserProfile = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      displayName,
      role: assignedRole,
      workerRate: assignedRole === 'owner' ? 0 : 12.00,
      clientRate: 35.00,
      avatarColor: assignedRole === 'owner' ? 'bg-blue-600' : 'bg-emerald-600',
      createdAt: new Date().toISOString()
    };

    await saveDbUser(newUser);
    await refreshUsers();
    setCurrentUser(newUser);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, newUser.id);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
  };

  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(CURRENT_USER_SESSION_KEY, found.id);
    }
  };

  const addNewWorker = async (
    name: string,
    email: string,
    workerRate: number = 12.00,
    clientRate: number = 35.00,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase() || `mitarbeiter_${Date.now()}@bauzeit.de`;
    const allUsers = await getDbUsers();
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      const updated: UserProfile = {
        ...existing,
        displayName: name.trim() || existing.displayName,
        workerRate: workerRate > 0 ? workerRate : existing.workerRate,
        clientRate: clientRate > 0 ? clientRate : existing.clientRate,
        phoneNumber: phone?.trim() || existing.phoneNumber
      };
      await saveDbUser(updated);
      await refreshUsers();
      return { success: true };
    }

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newWorker: UserProfile = {
      id: `user_worker_${Date.now()}`,
      email: cleanEmail,
      displayName: name.trim() || 'Mitarbeiter',
      role: 'member',
      workerRate: workerRate > 0 ? workerRate : 12.00,
      clientRate: clientRate > 0 ? clientRate : 35.00,
      avatarColor: randomColor,
      phoneNumber: phone?.trim(),
      createdAt: new Date().toISOString()
    };

    await saveDbUser(newWorker);
    await refreshUsers();
    return { success: true };
  };

  const updateWorker = async (worker: UserProfile) => {
    await saveDbUser(worker);
    await refreshUsers();
    if (currentUser?.id === worker.id) {
      setCurrentUser(worker);
    }
  };

  const quickStart = async (role: 'owner' | 'member'): Promise<void> => {
    const allUsers = await getDbUsers();
    const existing = allUsers.find(u => u.role === role);
    if (existing) {
      setCurrentUser(existing);
      localStorage.setItem(CURRENT_USER_SESSION_KEY, existing.id);
      return;
    }

    const isChef = role === 'owner';
    const newAccount: UserProfile = {
      id: isChef ? 'user_owner_default' : 'user_member_default',
      email: isChef ? 'chef@bauzeit.de' : 'mitarbeiter@bauzeit.de',
      displayName: isChef ? 'Chef (Inhaber)' : 'Mitarbeiter',
      role,
      workerRate: isChef ? 0 : 12,
      clientRate: 35,
      createdAt: new Date().toISOString()
    };
    await saveDbUser(newAccount);
    setCurrentUser(newAccount);
    localStorage.setItem(CURRENT_USER_SESSION_KEY, newAccount.id);
    await refreshUsers();
  };

  const isOwner = currentUser?.role === 'owner';
  const isMember = currentUser?.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isOwner,
        isMember,
        isLoading,
        isFirebaseActive: isConfigured,
        login,
        register,
        quickStart,
        logout,
        switchUser,
        addNewWorker,
        updateWorker,
        refreshUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
