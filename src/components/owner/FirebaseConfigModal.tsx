import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isConfigured,
  FirebaseConfigParams
} from '../../firebase/config';
import { parseGoogleServicePlist, parseGoogleServicesJson } from '../../utils/firebaseConfigParser';
import { Cloud, Check, Upload, ExternalLink } from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const current = getStoredFirebaseConfig();
  const [apiKey, setApiKey] = useState(current?.apiKey || '');
  const [projectId, setProjectId] = useState(current?.projectId || '');
  const [authDomain, setAuthDomain] = useState(current?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(current?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(current?.messagingSenderId || '');
  const [appId, setAppId] = useState(current?.appId || '');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      let parsed: FirebaseConfigParams | null = null;
      if (file.name.endsWith('.plist') || text.includes('GoogleService-Info')) {
        parsed = parseGoogleServicePlist(text);
      } else if (file.name.endsWith('.json') || text.includes('project_info')) {
        parsed = parseGoogleServicesJson(text);
      }

      if (parsed) {
        setApiKey(parsed.apiKey);
        setProjectId(parsed.projectId);
        setAuthDomain(parsed.authDomain);
        setStorageBucket(parsed.storageBucket);
        setMessagingSenderId(parsed.messagingSenderId);
        setAppId(parsed.appId);
        setUploadSuccess(`Datei "${file.name}" erfolgreich eingelesen! Klicke unten auf "Speichern".`);
      } else {
        alert('Die Datei konnte nicht als Firebase-Konfiguration erkannt werden.');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: FirebaseConfigParams = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };
    saveFirebaseConfig(config);
  };

  const handleClear = () => {
    if (window.confirm('Firebase-Verbindung trennen und wieder lokalen Speicher nutzen?')) {
      clearFirebaseConfig();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Cloud & Firebase Sync"
      subtitle="Echtzeit-Synchronisierung auf allen iPhones und Rechnern"
    >
      <div className="space-y-4 text-xs">
        {/* Status Box */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isConfigured
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                isConfigured ? 'bg-blue-600' : 'bg-amber-500'
              }`}
            >
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">
                {isConfigured ? 'Firebase Cloud aktiv' : 'Lokaler Speicher aktiv (Offline)'}
              </div>
              <div className="text-[11px] opacity-80">
                {isConfigured
                  ? 'Echtzeit-Sync mit Google Cloud Firestore aktiv'
                  : 'Bereit zur Verbindung mit Google Cloud'}
              </div>
            </div>
          </div>
          {isConfigured && (
            <button
              onClick={handleClear}
              className="ios-touch px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700"
            >
              Trennen
            </button>
          )}
        </div>

        {/* 1-Click File Upload Box */}
        <div className="p-3.5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 text-center">
          <label className="cursor-pointer block">
            <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <span className="font-bold text-blue-900 block text-xs">
              GoogleService-Info.plist oder json hochladen
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">
              1 Klick – füllt alle Einstellungen automatisch aus
            </span>
            <input
              type="file"
              accept=".plist,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {uploadSuccess && (
            <div className="mt-2 p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-[11px]">
              {uploadSuccess}
            </div>
          )}
        </div>

        {/* Info guide */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-slate-600">
          <div className="font-bold text-slate-900 mb-1 flex items-center justify-between">
            <span>Manuelle Eingabe oder Firebase Console:</span>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 flex items-center gap-0.5 hover:underline text-[11px]"
            >
              <span>Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] leading-relaxed">
            Alternativ kannst du die Werte aus den Firebase-Projekteinstellungen manuell eintragen:
          </p>
        </div>

        {/* Config Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Firebase API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Project ID
            </label>
            <input
              type="text"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="dein-firebase-projekt"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={e => setAuthDomain(e.target.value)}
                placeholder="projekt.firebaseapp.com"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                App ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="1:123456789:web:abc"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="ios-touch w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            <span>Firebase Einstellungen speichern & aktivieren</span>
          </button>
        </form>
      </div>
    </Modal>
  );
};
