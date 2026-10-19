import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HardHat, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, UserPlus, LogIn, Key, User } from 'lucide-react';

// The secret master code required to create an Admin / Owner account
export const ADMIN_MASTER_CODES = ['CHEF2026', 'JASIN2026', 'BAUZEIT2026', 'ADMIN2026'];

export const LoginView: React.FC = () => {
  const { login, register, isFirebaseActive } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }
    if (!password) {
      setError('Bitte gib dein Passwort ein.');
      return;
    }

    setIsSubmitting(true);

    if (isRegisterMode) {
      let role: 'owner' | 'member' = 'member';

      // Check optional admin secret code
      const cleanAdminCode = adminCode.trim().toUpperCase();
      if (cleanAdminCode.length > 0) {
        if (ADMIN_MASTER_CODES.includes(cleanAdminCode)) {
          role = 'owner';
        } else {
          setIsSubmitting(false);
          setError('Der eingegebene Admin-Code ist ungültig. Lass das Feld leer, um dich als Mitarbeiter zu registrieren.');
          return;
        }
      }

      const res = await register(email, password, displayName, role);
      setIsSubmitting(false);
      if (!res.success && res.error) {
        setError(res.error);
      }
    } else {
      const res = await login(email, password);
      setIsSubmitting(false);
      if (!res.success && res.error) {
        setError(res.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        {/* iOS App Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-ios-lg mb-4 text-white">
          <HardHat className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">BauZeit</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Digitale Zeiterfassung für Handwerk & Baustelle
        </p>
      </div>

      {/* Main Login / Register Card */}
      <div className="bg-white rounded-3xl shadow-ios p-6 border border-slate-100">
        {/* Toggle Login vs Register */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
            }}
            className={`ios-touch flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              !isRegisterMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Anmelden</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
            }}
            className={`ios-touch flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              isRegisterMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Konto erstellen</span>
          </button>
        </div>

        <h2 className="text-base font-bold text-slate-900 mb-1">
          {isRegisterMode ? 'Neues Mitarbeiterkonto anlegen' : 'Geschützter Login'}
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          {isRegisterMode
            ? 'Registriere dich mit deinem Namen, deiner E-Mail und einem Passwort.'
            : 'Melde dich mit deiner persönlichen E-Mail-Adresse und deinem Passwort an.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5" htmlFor="name-input">
                Vollständiger Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name-input"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5" htmlFor="email-input">
              E-Mail Adresse
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@bauzeit.de"
                required
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5" htmlFor="password-input">
              Passwort
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Secret Admin Code Field (Only during Registration) */}
          {isRegisterMode && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1" htmlFor="admin-code-input">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin-Sicherheitscode (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Nur für Inhaber</span>
              </div>
              <input
                id="admin-code-input"
                type="password"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                placeholder="Code eingeben für Admin-Rechte"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition font-mono tracking-wider"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="ios-touch w-full py-4 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-3"
          >
            <span>
              {isSubmitting
                ? 'Bitte warten...'
                : isRegisterMode
                ? 'Konto erstellen'
                : 'Anmelden'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
