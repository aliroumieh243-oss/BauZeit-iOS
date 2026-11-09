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

// Built-in default configuration for papa-zeitverfassung-app
const DEFAULT_FIREBASE_CONFIG: FirebaseConfigParams = {
  apiKey: 'AIzaSyCDmBOHHJ8vp99GfFcV85Yreh9ZZvcDGXU',
  authDomain: 'papa-zeitverfassung-app.firebaseapp.com',
  projectId: 'papa-zeitverfassung-app',
  storageBucket: 'papa-zeitverfassung-app.firebasestorage.app',
  messagingSenderId: '929730877647',
  appId: '1:929730877647:ios:f4ff606f8a85da177cbfba'
};

/**
 * Get active Firebase configuration from localStorage, Vite env, or built-in default
 */
export function getStoredFirebaseConfig(): FirebaseConfigParams {
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

  const envConfig: FirebaseConfigParams = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId
  };

  return envConfig;
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
