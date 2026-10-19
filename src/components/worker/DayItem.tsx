import React from 'react';
import { DayCalendarInfo } from '../../types';
import { formatHours, formatBreakMinutes } from '../../utils/timeCalculations';
import { Clock, MapPin, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DayItemProps {
  dayInfo: DayCalendarInfo;
  onClick: () => void;
}

export const DayItem: React.FC<DayItemProps> = ({ dayInfo, onClick }) => {
  const { date, dayOfWeek, dayNumber, formattedDate, isWeekend, entry } = dayInfo;

  return (
    <div
      onClick={onClick}
      className={`ios-touch w-full p-3.5 mb-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
        entry
          ? 'bg-white border-slate-200/90 shadow-sm hover:border-blue-400'
          : isWeekend
          ? 'bg-slate-100/60 border-slate-200/50 opacity-75'
          : 'bg-white/70 border-dashed border-slate-300 hover:bg-white hover:border-blue-300'
      }`}
    >
      {/* Date badge on the left */}
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-center shrink-0 border ${
            entry
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : isWeekend
              ? 'bg-slate-200/70 border-slate-300 text-slate-500'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
            {dayOfWeek}
          </span>
          <span className="text-base font-black leading-tight mt-0.5">{dayNumber}</span>
        </div>

        {/* Details in the middle */}
        <div className="text-left overflow-hidden">
          {entry ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {entry.startTime} – {entry.endTime} Uhr
                </span>
                {entry.breakMinutes > 0 && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                    Pause: {formatBreakMinutes(entry.breakMinutes)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600 truncate mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate font-medium">{entry.siteDescription}</span>
              </div>
            </>
          ) : (
            <div>
              <div className="text-xs font-medium text-slate-700">
                {isWeekend ? 'Wochenende' : 'Noch keine Arbeitszeit'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span>Tippen zum Erfassen</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Hours badge or Add icon */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {entry ? (
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              {formatHours(entry.decimalHours)} h
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600">
            <Plus className="w-4 h-4" />
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  );
};
