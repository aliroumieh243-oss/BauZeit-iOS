import React from 'react';
import { Calendar, BarChart3, Users, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabType = 'overview' | 'calendar' | 'team' | 'settings' | 'summary' | 'profile';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const { isOwner } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 ios-glass border-t border-slate-200/80 px-2 pb-safe pt-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {isOwner ? (
          <>
            <button
              onClick={() => onTabChange('overview')}
              className={`ios-touch flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Übersicht</span>
            </button>

            <button
              onClick={() => onTabChange('calendar')}
              className={`ios-touch flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Zeiten</span>
            </button>

            <button
              onClick={() => onTabChange('team')}
              className={`ios-touch flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'team' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Team</span>
            </button>

            <button
              onClick={() => onTabChange('settings')}
              className={`ios-touch flex flex-col items-center py-1 px-3 rounded-xl transition ${
                activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Settings className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Cloud/Setup</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTabChange('calendar')}
              className={`ios-touch flex flex-col items-center py-1 px-4 rounded-xl transition ${
                activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Mein Kalender</span>
            </button>

            <button
              onClick={() => onTabChange('summary')}
              className={`ios-touch flex flex-col items-center py-1 px-4 rounded-xl transition ${
                activeTab === 'summary' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Abrechnung</span>
            </button>

            <button
              onClick={() => onTabChange('profile')}
              className={`ios-touch flex flex-col items-center py-1 px-4 rounded-xl transition ${
                activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-semibold">Mein Profil</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
