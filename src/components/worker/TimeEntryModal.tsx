import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { TimeEntry } from '../../types';
import {
  calculateDecimalHours,
  formatBreakMinutes,
  formatHours
} from '../../utils/timeCalculations';
import { FREQUENT_SITES } from '../../utils/sampleData';
import { compressImageFile } from '../../utils/imageCompressor';
import { t } from '../../utils/language';
import {
  Clock,
  MapPin,
  Coffee,
  Trash2,
  Check,
  Fuel,
  Banknote,
  FileText,
  Camera,
  Image as ImageIcon,
  X,
  Maximize2
} from 'lucide-react';

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
    expenses?: number;
    fuelExpenses?: number;
    expenseNote?: string;
    photoData?: string;
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
  
  // Expenses and Fuel
  const [fuelExpenses, setFuelExpenses] = useState('');
  const [expenses, setExpenses] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  // Photo / Receipt
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isViewingFullPhoto, setIsViewingFullPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever opened or existingEntry changes
  useEffect(() => {
    if (existingEntry) {
      setStartTime(existingEntry.startTime || '08:00');
      setEndTime(existingEntry.endTime || '17:00');
      setBreakMinutes(existingEntry.breakMinutes ?? 30);
      setSiteDescription(existingEntry.siteDescription || '');
      setNotes(existingEntry.notes || '');
      setFuelExpenses(existingEntry.fuelExpenses ? existingEntry.fuelExpenses.toString() : '');
      setExpenses(existingEntry.expenses ? existingEntry.expenses.toString() : '');
      setExpenseNote(existingEntry.expenseNote || '');
      setPhotoData(existingEntry.photoData);
    } else {
      setStartTime('08:00');
      setEndTime('17:00');
      setBreakMinutes(30);
      setSiteDescription('');
      setNotes('');
      setFuelExpenses('');
      setExpenses('');
      setExpenseNote('');
      setPhotoData(undefined);
    }
  }, [existingEntry, dateIso, isOpen]);

  // Live calculation of decimal hours
  const liveDecimalHours = calculateDecimalHours(startTime, endTime, breakMinutes);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      const base64 = await compressImageFile(file, 1024, 0.7);
      setPhotoData(base64);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Das Foto konnte nicht geladen werden.');
    } finally {
      setIsCompressingPhoto(false);
      // Reset input value so same photo can be re-uploaded if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedExpenses = parseFloat(expenses.replace(',', '.')) || 0;
      const parsedFuel = parseFloat(fuelExpenses.replace(',', '.')) || 0;

      await onSave({
        id: existingEntry?.id,
        date: dateIso,
        startTime,
        endTime,
        breakMinutes,
        siteDescription: siteDescription.trim() || 'Allgemeine Arbeiten',
        notes: notes.trim() || undefined,
        expenses: parsedExpenses,
        fuelExpenses: parsedFuel,
        expenseNote: expenseNote.trim() || undefined,
        photoData
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={existingEntry ? t('Arbeitszeit bearbeiten') : t('Arbeitszeit eintragen')}
        subtitle={formattedDateStr}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Calculation Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                  {t('Geleistete Arbeitszeit')}
                </div>
                <div className="text-xs text-blue-600">
                  {startTime} bis {endTime} ({t('Pause:')} {formatBreakMinutes(breakMinutes)})
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-blue-900 tracking-tight">
                {formatHours(liveDecimalHours)} <span className="text-sm font-semibold text-blue-700">{t('Std.')}</span>
              </div>
            </div>
          </div>

          {/* 1. BEGINN (Start Time) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {t('Arbeitsbeginn')}
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
              {COMMON_START_TIMES.map(tPreset => (
                <button
                  key={tPreset}
                  type="button"
                  onClick={() => setStartTime(tPreset)}
                  className={`ios-touch text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    startTime === tPreset
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tPreset}
                </button>
              ))}
            </div>
          </div>

          {/* 2. ENDE (End Time) */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                {t('Feierabend')}
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
              {COMMON_END_TIMES.map(tPreset => (
                <button
                  key={tPreset}
                  type="button"
                  onClick={() => setEndTime(tPreset)}
                  className={`ios-touch text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    endTime === tPreset
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tPreset}
                </button>
              ))}
            </div>
          </div>

          {/* 3. PAUSE */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                {t('Tägliche Pause')}
              </label>
              <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                {formatBreakMinutes(breakMinutes)} ({breakMinutes} {t('Minuten')})
              </span>
            </div>
            {/* Quick presets for pause */}
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
                  {m === 0 ? t('Keine') : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. BAUSTELLE BESCHREIBUNG */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {t('Baustelle / Einsatzort')}
            </label>
            <input
              type="text"
              value={siteDescription}
              onChange={e => setSiteDescription(e.target.value)}
              placeholder="z.B. Baustelle HafenCity - Trockenbau"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {/* Quick Select Frequent Sites */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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

          {/* 5. AUSLAGEN & BENZINGELD */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              {t('Auslagen & Fahrtkosten')}
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Benzingeld */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                  <Fuel className="w-3.5 h-3.5 text-orange-500" />
                  {t('Benzingeld / Sprit')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fuelExpenses}
                    onChange={e => setFuelExpenses(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-3 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">€</span>
                </div>
              </div>

              {/* Sonstige Auslagen / Material */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mb-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  {t('Geld ausgegeben')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenses}
                    onChange={e => setExpenses(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-3 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">€</span>
                </div>
              </div>
            </div>

            {/* Zweck / Notiz der Ausgaben */}
            {(fuelExpenses || expenses) && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3" />
                  {t('Zweck (z.B. Tanken Sprinter, Schrauben OBI)')}
                </label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={e => setExpenseNote(e.target.value)}
                  placeholder="z.B. Tanken Shell oder Material Bauhaus"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 6. BELEG- & FOTO-ERFASSUNG */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                {t('Beleg / Foto (Optional)')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {t('Quittung, Tankbeleg oder Baustelle')}
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {photoData ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white">
                <img
                  src={photoData}
                  alt="Beleg Vorschau"
                  className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition"
                  onClick={() => setIsViewingFullPhoto(true)}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsViewingFullPhoto(true)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition"
                    title={t('Foto ansehen')}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoData(undefined)}
                    className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition"
                    title={t('Foto entfernen')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-2 flex items-center justify-between text-xs bg-slate-50 border-t border-slate-100">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {t('Beleg vorhanden')}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    Ändern
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressingPhoto}
                className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-white hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-blue-600 transition"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">
                  {isCompressingPhoto ? 'Foto wird verarbeitet...' : t('Foto / Beleg auswählen')}
                </span>
                <span className="text-[10px] text-slate-400">
                  Kamera oder Fotogalerie
                </span>
              </button>
            )}
          </div>

          {/* 7. ALLGEMEINE NOTIZEN */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t('Optionale Notizen')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="z.B. Material geliefert, Spachtelarbeiten..."
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
                title={t('Tageseintrag löschen')}
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
              <span>{isSaving ? 'Wird gespeichert...' : t('Speichern')}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Full-Screen Photo Preview Modal */}
      {isViewingFullPhoto && photoData && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4"
          onClick={() => setIsViewingFullPhoto(false)}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-bold">{formattedDateStr} • {siteDescription}</span>
            <button
              onClick={() => setIsViewingFullPhoto(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center py-4">
            <img
              src={photoData}
              alt="Beleg Vollbild"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="text-center text-xs text-white/70">
            Tippe zum Schließen
          </div>
        </div>
      )}
    </>
  );
};
