import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, DollarSign, Phone, Check, AlertCircle } from 'lucide-react';

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ isOpen, onClose }) => {
  const { addNewWorker } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workerRate, setWorkerRate] = useState('12.00');
  const [clientRate, setClientRate] = useState('35.00');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Bitte Name und E-Mail ausfüllen.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const wRate = parseFloat(workerRate.replace(',', '.')) || 12.00;
    const cRate = parseFloat(clientRate.replace(',', '.')) || 35.00;

    const res = await addNewWorker(name, email, wRate, cRate, phone);
    setIsSubmitting(false);

    if (res.success) {
      setName('');
      setEmail('');
      setPhone('');
      onClose();
    } else {
      setError(res.error || 'Fehler beim Anlegen.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Neuen Mitarbeiter anlegen"
      subtitle="Arbeiter erhält sofort Zugang mit eigenem Login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Vollständiger Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Thomas Schmidt"
              required
              className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            E-Mail Adresse (für Login)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="thomas@bauzeit.de"
              required
              className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Stundenlohn (€/h)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={workerRate}
                onChange={e => setWorkerRate(e.target.value)}
                placeholder="12.00"
                required
                className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Kategorie Mitarbeiter</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              AR Satz (€/h)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-blue-600 absolute left-3 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={clientRate}
                onChange={e => setClientRate(e.target.value)}
                placeholder="35.00"
                required
                className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Kategorie Mitarbeiter AR</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Telefonnummer (Optional)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+49 170 0000000"
              className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="ios-touch w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
        >
          <Check className="w-4 h-4" />
          <span>{isSubmitting ? 'Wird angelegt...' : 'Mitarbeiter speichern'}</span>
        </button>
      </form>
    </Modal>
  );
};
