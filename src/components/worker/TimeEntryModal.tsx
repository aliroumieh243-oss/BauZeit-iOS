import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { TimeEntry } from '../../types';
import {
  calculateDecimalHours,
  formatBreakMinutes,
  formatHours,
  parseBreakToMinutes
} from '../../utils/timeCalculations';
import { FREQUENT_SITES } from '../../utils/sampleData';
import { Clock, MapPin, Coffee, Trash2, Check, Sparkles } from 'lucide-react';

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateIso: string;
  formattedDateStr: string;
  existingEntry?: TimeEntry;
  onSave: (data: {
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    siteDescription: string;
    notes?: string;
  }) => Promise<any>;
  onDelete?: (id: string) => Promise<void>;
}

const COMMON_START_TIMES = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '13:30'];
const COMMON_END_TIMES = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:40'];
const COMMON_BREAK_MINUTES = [0, 10, 15, 30, 40, 45, 60];

export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  dateIso,
  formattedDateStr,
  existingEntry,
  onSave,
  onDelete
}) => {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [siteDescription, setSiteDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever opened or existingEntry changes
  useEffect(() => {
    if (existingEntry) {
      setStartTime(existingEntry.startTime || '08:00');
      setEndTime(existingEntry.endTime || '17:00');
      setBreakMinutes(existingEntry.breakMinutes ?? 30);
      setSiteDescription(existingEntry.siteDescription || '');
      setNotes(existingEntry.notes || '');
    } else {
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakMinutes(30);
      setSiteDescription('');
      setNotes('');
    }
  }, [existingEntry, dateIso, isOpen]);

  // Live calculation of decimal hours
  const liveDecimalHours = calculateDecimalHours(startTime, endTime, breakMinutes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        id: existingEntry?.id,
        date: dateIso,
        startTime,
        endTime,
        breakMinutes,
        siteDescription: siteDescription.trim() || 'Allgemeine Arbeiten',
        notes
      });
      onClose();
    } catch (err) {
      console.error('Error saving entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry?.id || !onDelete) return;
    if (window.confirm('Möchtest du diesen Tageseintrag wirklich löschen?')) {
      setIsSaving(true);
      try {
        await onDelete(existingEntry.id);
        onClose();
      } catch (err) {
        console.error('Error deleting entry:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingEntry ? 'Arbeitszeit bearbeiten' : 'Arbeitszeit eintragen'}
      subtitle={formattedDateStr}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Live Calculation Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                Geleistete Arbeitszeit
              </div>
              <div className="text-xs text-blue-600">
                {startTime} bis {endTime} abzüglich {formatBreakMinutes(breakMinutes)} Pause
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-blue-900 tracking-tight">
              {formatHours(liveDecimalHours)} <span className="text-sm font-semibold text-blue-700">Std.</span>
            </div>
            <div className="text-[10px] text-blue-500 font-medium">Dezimalstunden</div>
          </div>
        </div>

        {/* 1. BEGINN (Start Time) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Beginn (Startzeit)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Quick presets for common start times */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_START_TIMES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setStartTime(t)}
                className={`ios-touch text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  startTime === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ENDEN (End Time) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              Enden (Feierabend)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Quick presets for common end times */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_END_TIMES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setEndTime(t)}
                className={`ios-touch text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  endTime === t
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 3. PAUSE */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              Tägliche Pause
            </label>
            <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              {formatBreakMinutes(breakMinutes)} ({breakMinutes} Min.)
            </span>
          </div>
          {/* Quick presets for pause (e.g. 00:00, 00:10, 00:30, 00:40) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_BREAK_MINUTES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setBreakMinutes(m)}
                className={`ios-touch text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  breakMinutes === m
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {formatBreakMinutes(m)}
              </button>
            ))}
          </div>
        </div>

        {/* 4. BAUSTELLE BESCHREIBUNG */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Baustelle Beschreibung / Einsatzort
          </label>
          <input
            type="text"
            value={siteDescription}
            onChange={e => setSiteDescription(e.target.value)}
            placeholder="z.B. Baustelle HafenCity - Trockenbau"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />

          {/* Quick Select Frequent Sites */}
          <div className="mt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Häufige Baustellen:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENT_SITES.slice(0, 4).map((site: string) => (
                <button
                  key={site}
                  type="button"
                  onClick={() => setSiteDescription(site)}
                  className="ios-touch text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  {site.split(' - ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Bemerkung / Zusatz (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="z.B. Material geliefert, Spachtelarbeiten"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          {existingEntry && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="ios-touch py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="ios-touch flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Wird gespeichert...' : 'Zeit eintragen & speichern'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
