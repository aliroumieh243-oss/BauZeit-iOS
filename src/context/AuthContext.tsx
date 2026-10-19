import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { getDbUsers, saveDbUser } from '../firebase/firestoreService';
import { isConfigured, auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';

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
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // If real Firebase Auth is configured and credentials are supplied
    if (isConfigured && auth && password) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const all = await getDbUsers();
        const found = all.find(u => u.email.toLowerCase() === cleanEmail || u.id === userCred.user.uid);
        if (found) {
          setCurrentUser(found);
          localStorage.setItem(CURRENT_USER_SESSION_KEY, found.id);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Firebase auth failed, checking local profiles:', err.message);
      }
    }

    // Local / direct lookup
    const allUsers = await getDbUsers();
    const matched = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matched) {
      return {
        success: false,
        error: 'Kein Konto mit dieser E-Mail-Adresse gefunden. Bitte prüfe die Eingabe oder wende dich an den Inhaber.'
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

    let userId = `user_${Date.now()}`;

    // If real Firebase Auth is active
    if (isConfigured && auth && password) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        userId = userCred.user.uid;
      } catch (err: any) {
        return { success: false, error: err.message || 'Registrierung bei Firebase fehlgeschlagen.' };
      }
    }

    const allUsers = await getDbUsers();
    // Default to owner if it's the very first user or explicitly requested
    const assignedRole: 'owner' | 'member' = role || (allUsers.length === 0 ? 'owner' : 'member');

    const newUser: UserProfile = {
      id: userId,
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
    if (isConfigured && auth) {
      try {
        fbSignOut(auth);
      } catch (_) {}
    }
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
    const cleanEmail = email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Ein Mitarbeiter mit dieser E-Mail existiert bereits.' };
    }

    const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newWorker: UserProfile = {
      id: `user_worker_${Date.now()}`,
      email: cleanEmail,
      displayName: name.trim(),
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
