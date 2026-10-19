import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { formatCurrency } from '../../utils/timeCalculations';
import { UserPlus, HardHat, ShieldCheck, Mail, Phone, Edit2, Check, DollarSign } from 'lucide-react';
import { AddWorkerModal } from './AddWorkerModal';

export const TeamManagementView: React.FC = () => {
  const { users, updateWorker } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editWorkerRate, setEditWorkerRate] = useState<string>('');
  const [editClientRate, setEditClientRate] = useState<string>('');

  const workers = users.filter(u => u.role === 'member');
  const owner = users.find(u => u.role === 'owner');

  const startEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditWorkerRate(user.workerRate.toString());
    setEditClientRate(user.clientRate.toString());
  };

  const saveEdit = async (user: UserProfile) => {
    const wRate = parseFloat(editWorkerRate.replace(',', '.')) || user.workerRate;
    const cRate = parseFloat(editClientRate.replace(',', '.')) || user.clientRate;

    await updateWorker({
      ...user,
      workerRate: wRate,
      clientRate: cRate
    });
    setEditingUserId(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-safe-tab pt-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Teamverwaltung
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Mitarbeiter & Stundensätze
            </h2>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="ios-touch px-3 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Neuer Arbeiter</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Hier verwaltest du alle Arbeiter und hinterlegst die Stundensätze für die Lohn- und Verrechnungsberechnung.
        </p>
      </div>

      {/* Owner Profile Card */}
      {owner && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900">{owner.displayName}</span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md">
                  Inhaber
                </span>
              </div>
              <div className="text-xs text-slate-500">{owner.email}</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-amber-800 font-semibold">
            Zentraler Owner
          </div>
        </div>
      )}

      {/* Workers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registrierte Arbeiter ({workers.length})
          </span>
          <span className="text-[11px] text-slate-400">Strikte Datentrennung aktiv</span>
        </div>

        {workers.map(worker => {
          const isCurrentlyEditing = editingUserId === worker.id;

          return (
            <div
              key={worker.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 transition"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                      worker.avatarColor || 'bg-emerald-600'
                    }`}
                  >
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{worker.displayName}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{worker.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isCurrentlyEditing) {
                      saveEdit(worker);
                    } else {
                      startEdit(worker);
                    }
                  }}
                  className="ios-touch p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="Stundensätze bearbeiten"
                >
                  {isCurrentlyEditing ? (
                    <Check className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Rates Display / Edit */}
              <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                {/* Worker Wage */}
                <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">
                    Mitarbeiter Lohn
                  </span>
                  {isCurrentlyEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editWorkerRate}
                        onChange={e => setEditWorkerRate(e.target.value)}
                        className="w-16 px-1.5 py-0.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-900"
                      />
                      <span className="font-bold text-emerald-800">€/h</span>
                    </div>
                  ) : (
                    <span className="text-base font-black text-emerald-900">
                      {formatCurrency(workerRateFallback(worker.workerRate))}/h
                    </span>
                  )}
                </div>

                {/* Client AR Rate */}
                <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block mb-1">
                    Mitarbeiter AR
                  </span>
                  {isCurrentlyEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editClientRate}
                        onChange={e => setEditClientRate(e.target.value)}
                        className="w-16 px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-bold text-blue-900"
                      />
                      <span className="font-bold text-blue-800">€/h</span>
                    </div>
                  ) : (
                    <span className="text-base font-black text-blue-900">
                      {formatCurrency(clientRateFallback(worker.clientRate))}/h
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AddWorkerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

function workerRateFallback(rate: number): number {
  return rate > 0 ? rate : 12.00;
}

function clientRateFallback(rate: number): number {
  return rate > 0 ? rate : 35.00;
}
