import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'bauzeit_firebase_custom_config';

/**
 * Get active Firebase configuration from localStorage or Vite environment variables
 */
export function getStoredFirebaseConfig(): FirebaseConfigParams | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored Firebase config', err);
  }

  // Fallback to import.meta.env
  const envConfig: FirebaseConfigParams = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfigParams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.location.reload();
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isConfigured = false;

const currentConfig = getStoredFirebaseConfig();

if (currentConfig && currentConfig.apiKey && currentConfig.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(currentConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = true;
  } catch (e) {
    console.warn('Firebase initialization error, defaulting to local storage mode:', e);
  }
}

export { app, auth, db, isConfigured };
