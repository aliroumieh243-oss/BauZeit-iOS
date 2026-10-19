import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, HardHat, LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { isOwner, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 ios-glass pt-safe px-4 pb-3 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
            {isOwner ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Owner
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <HardHat className="w-3.5 h-3.5" />
                Mitarbeiter
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Logout */}
          <button
            onClick={logout}
            title="Abmelden"
            className="ios-touch p-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
