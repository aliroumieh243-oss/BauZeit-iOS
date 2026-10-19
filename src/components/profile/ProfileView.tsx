import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/timeCalculations';
import { HardHat, ShieldCheck, Mail, LogOut, Smartphone, Share, PlusSquare, Lock } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, isOwner, logout } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="max-w-md mx-auto px-4 pb-safe-tab pt-2 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-md mb-3">
          {isOwner ? <ShieldCheck className="w-8 h-8" /> : <HardHat className="w-8 h-8" />}
        </div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{currentUser.displayName}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>

        <div className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          {isOwner ? '👑 Owner (Inhaber / Administrator)' : '👷 Arbeiter (Mitglied)'}
        </div>

        {/* Worker wage rate info */}
        {!isOwner && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dein Stundenlohn
              </span>
              <span className="text-base font-black text-slate-900">
                {formatCurrency(currentUser.workerRate || 12.00)}/h
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Status
              </span>
              <span className="text-base font-black text-emerald-600">Aktiv</span>
            </div>
          </div>
        )}
      </div>

      {/* Strict Privacy Notice */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-3xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-emerald-950">Strikte Datentrennung aktiv</h3>
          <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
            Du kannst ausschließlich deine eigenen Arbeitszeiten und Baustelleneinsätze sehen. Andere Arbeiter haben keinerlei Einblick in deine Stunden oder Abrechnungen.
          </p>
        </div>
      </div>

      {/* iOS Home Screen Installation Guide */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Als iPhone-App installieren</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Du kannst BauZeit direkt auf dem Startbildschirm deines iPhones wie eine vollwertige iOS-App speichern:
        </p>

        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>Öffne diese Seite im <b>Safari</b>-Browser auf deinem iPhone.</div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              <Share className="w-3.5 h-3.5" />
            </div>
            <div>Tippe unten in der Safari-Leiste auf das <b>„Teilen“-Symbol</b>.</div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              <PlusSquare className="w-3.5 h-3.5" />
            </div>
            <div>Wähle <b>„Zum Home-Bildschirm“</b> und tippe auf <b>Hinzufügen</b>.</div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="ios-touch w-full p-4 rounded-2xl bg-white border border-red-200 text-red-600 font-bold text-sm shadow-xs flex items-center justify-center gap-2 hover:bg-red-50 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>Vom Konto abmelden</span>
      </button>
    </div>
  );
};
